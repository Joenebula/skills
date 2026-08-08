# Backend & infrastructure

The application-backend flaws (server-side pricing, webhook verification, IDOR, admin auth, hashing, injection, recovery, fail-open, races) live in the payments/access/injection references — those are *already* backend and are the bulk of the audit. This file covers the layer *beneath* the application: the database's own posture, server-to-server credentials, background jobs, logging, resource abuse, the deploy pipeline, and where the code audit hands off to a specialist.

**The honest split matters here more than anywhere.** Much of this layer is **configuration in a dashboard, not code** — so the skill can only tell the owner to check it and give steps, not verify it. Each item is tagged: **[code]** = the skill can audit/fix it · **[owner]** = dashboard/config, an owner action · **[specialist]** = points beyond a code audit. Expect this section to produce more owner-actions than the front-end work did — that's the honest nature of the layer, not a shortfall.

## Contents
- A. Database posture — 37 exposure, 38 least privilege, 39 encryption, 40 backups
- B. Backend credentials — 41 server-to-server keys, 42 preview/staging exposure
- C. Execution surfaces — 43 background jobs/cron, 44 non-payment webhooks, 45 serverless state/cache leakage
- D. Logging — 46 logging hygiene
- E. Resource abuse — 47 expensive/unbounded operations
- F. Pipeline — 48 CI/CD & build artifacts
- G. Conditional — 49 GraphQL, 50 XML/deserialization
- H. 51 the specialist boundary

---

## A. Database posture

### 37 — Database exposed to the public internet — 🔴 [owner] (some [code])
The database should accept connections **only from your app**, not from anywhere on the internet. A publicly reachable database is one weak password or one known vulnerability away from total data loss. On AI-built sites this is often left at a permissive default.
- **Check:** in the database host's dashboard (Supabase, Neon, PlanetScale, RDS, etc.), is network access restricted to your app / a private network / an allow-list — or open to `0.0.0.0/0` (everywhere)?
- **Owner steps:** restrict inbound access to your app's network or an IP allow-list; disable public access if the host offers a private connection; ensure the DB isn't separately listening on a public port.
- **Verify:** attempting to connect to the database from an unrelated network fails.

### 38 — App connects with least privilege — 🟠 [code]+[owner]
Does the app connect as an all-powerful admin/superuser when it only needs to read products and read/write orders? If so, an app compromise (via any other flaw) becomes a *total* database compromise — drop tables, read everything.
- **Check:** the database user in the connection string — is it the admin role, or a scoped role limited to the tables/operations the app needs?
- **Fix/steps:** create a limited database user with only the needed privileges; use it in the app's connection string; reserve the admin credential for migrations/maintenance only.
- **Verify:** the app's DB user cannot perform destructive/admin operations outside its remit.

### 39 — Encryption in transit and at rest — 🟠 [code]+[owner]
Two separate things: the *connection* to the database should be encrypted (TLS/SSL) so it can't be snooped in transit; the *stored data* should be encrypted at rest so a stolen disk/backup is useless.
- **Check:** connection uses SSL (often `?sslmode=require` or the host enforces it); the host has encryption-at-rest enabled (most managed hosts do by default — confirm).
- **Steps:** enable SSL on the connection; confirm at-rest encryption in the host dashboard.
- **Verify:** the connection is refused without SSL; the host reports at-rest encryption on.

### 40 — Backups exist and are *tested* — 🟠 [owner]
Are there backups, are they stored securely (an exposed backup is itself a breach — same sensitivity as the live data), and — the bit everyone skips — has a **restore actually been tested**? An untested backup is a hope. This also closes the ransomware/bad-deploy gap from the observability note.
- **Owner steps:** confirm automated backups are on; confirm they're stored privately (not a public bucket); **do one test restore** to prove it works and you know how; note the retention period.
- **Verify:** a test restore succeeds; backup storage is not publicly accessible.

---

## B. Backend credentials & secrets

### 41 — Server-to-server keys scoped and rotated — 🟠 [code]+[owner]
Extends item 5 into the server-to-server world. The keys the *backend* uses (Stripe, database, email, other services) should be **least-privilege and rotated**. A full-access Stripe secret key where a restricted key would do turns any leak into a bigger loss.
- **Check:** are backend keys the most powerful variant, or scoped to what's needed (e.g. Stripe restricted keys)? Any single shared key used everywhere?
- **Steps:** use restricted/scoped keys per service where supported; separate keys per environment; rotate on a schedule and after any suspected exposure (ties to owner-actions item 13).
- **Verify:** each service key can do only what that integration needs.

### 42 — Preview/staging exposure & environment scoping — 🔴 [code]+[owner]
A classic Vercel-shaped hole: **preview or staging deployments leaking *production* secrets or real customer data**, and preview URLs being publicly reachable (or indexed by search engines). A preview build pointed at the production database, with no access control, is a full data exposure on a URL nobody's watching.
- **Check:** do preview deployments use *separate* (non-production) secrets and data? Are preview URLs protected (Vercel deployment protection / password) rather than open? Is production data ever copied into a preview/staging DB?
- **Steps:** scope env vars per environment (Production vs Preview vs Development) in Vercel; enable deployment protection on previews; never point a preview at the production database; never seed staging with real customer data.
- **Verify:** a preview URL requires auth or carries no real data/secrets; production secrets are not present in preview env.

---

## C. Backend execution surfaces (pure backend — no page to look at)

### 43 — Background jobs, cron, and queue triggers — 🔴 [code]
Code that runs on the server **without a user present** — a scheduled job, a queue worker, a webhook doing deferred work. These often have privileged access and are a blind spot because there's no page. The classic flaw: the *trigger endpoint is unauthenticated*, so anyone on the internet can fire your "process all orders" / "send all emails" / "recalculate balances" job.
- **Check:** every cron/job/queue endpoint (often `/api/cron/*`, `/api/jobs/*`) — is it authenticated (a secret header/token, Vercel Cron's signature, or restricted to internal calls)? Do privileged workers validate the data they're handed rather than trusting it?
- **Fix:** require a secret/verified trigger on every job endpoint; fail closed if it's missing (item 23); validate job inputs.
- **Verify:** calling the job endpoint without the secret is rejected.

### 44 — Non-payment webhooks verified — 🟠 [code]
Item 7b verified the *payment* webhook. **Every other inbound webhook** — shipping, email/delivery status, inventory, auth provider — needs the same "prove it really came from them" check (signature against the raw body). An unverified webhook is an open endpoint anyone can POST fake events to.
- **Check:** each inbound webhook verifies its provider's signature before acting.
- **Fix:** add signature verification per provider's docs; fail closed.
- **Verify:** a forged webhook payload without a valid signature is rejected.

### 45 — Serverless state leakage & cached authenticated data — 🔴 [code]+[owner]
Two nasty Vercel/Next.js-specific flaws where **one customer sees another's data**:
- **Shared/global state:** per-user data stored in a module-level/global variable in a serverless function can persist and leak into another user's request (functions are reused). Red flag: caching user-specific data in a variable outside the request handler.
- **CDN-cached personalised pages:** a logged-in/personalised page (account, order, cart) accidentally marked cacheable is stored by the CDN and served to the *wrong* person. Red flag: `Cache-Control: public` (or `force-dynamic` missing / wrong caching config) on a page that shows user-specific data.
- **Fix:** never hold per-user data in shared scope — keep it inside the request; mark personalised routes non-cacheable (`private`/`no-store` or the framework's dynamic setting); confirm CDN caching rules exclude authenticated pages.
- **Verify:** two different users' requests never see each other's data; an account/order page is not served from a shared cache.

---

## D. Logging

### 46 — Logging hygiene — 🟠 [code]
The flip side of "no breach detection": logging **too much**. Writing card numbers, CVVs, passwords, tokens, session cookies, or personal data into logs turns your log store into a soft target (and, for card data, a PCI problem). Third-party log services widen who can see it.
- **Check:** what gets logged around auth, checkout, and payment code — whole request bodies? tokens? Are errors logging full objects that include secrets/PII?
- **Fix:** log identifiers, not secrets; redact card/token/password fields; never log full auth or payment payloads; scrub before sending to any external log service.
- **Verify:** a checkout/login run produces logs with no card data, passwords, or tokens in them.

---

## E. Resource abuse

### 47 — Expensive / unbounded operations — 🟠 [code]
Extends item 33 to the query layer. An endpoint that makes the backend do enormous work, or returns unbounded data: a search with no limit, a list API with no pagination, a "mass export" that can dump the whole table, a report that scans everything. Both a denial-of-service (make your own backend fall over) and a bulk-data-theft path (one call exfiltrates the customer table).
- **Check:** list/search/export endpoints — is there a hard cap and pagination? Can a parameter make the query arbitrarily expensive? Can an export be called by a normal user?
- **Fix:** enforce server-side limits and pagination; cap the cost of user-controlled queries; restrict bulk-export to admins with an audit trail.
- **Verify:** a request for "everything" returns a bounded page, not the whole table.

---

## F. Pipeline

### 48 — CI/CD & build artifacts — 🟠 [owner] (some [code])
The system that builds and ships your code is itself an attack surface. Three common issues: **secrets sitting in the CI/build system** (GitHub Actions secrets over-shared, or printed in build logs); **a deploy hook anyone can trigger**; and **secrets or source maps baked into the published build** (source maps can expose server logic; a leaked secret in the client bundle ties back to item 5).
- **Check:** are CI secrets scoped and not echoed in logs? Is any deploy/build webhook protected? Do production builds ship source maps or embedded secrets?
- **Steps:** scope and mask CI secrets; protect deploy hooks; disable source maps in production (or restrict them); confirm no secret is in the built client bundle.
- **Verify:** build logs contain no secrets; the deploy hook can't be fired by an outsider; the production bundle has no secrets/source maps.

---

## G. Conditional backend tech (only if used)

### 49 — GraphQL security — 🟠 [code], conditional
Only if a site uses GraphQL. Two specifics: **introspection** left enabled in production (hands an attacker your whole API schema — a map), and **query cost/depth** unbounded (a deliberately nested query that overloads the backend — a DoS). Also confirm field-level authorization (GraphQL makes it easy to over-expose).
- **Fix:** disable introspection in production; add query depth/complexity limits; enforce per-field auth.
- **Verify:** introspection is off in prod; a deeply nested query is rejected.

### 50 — XML parsing / unsafe deserialization — 🔴 [code], conditional
Only if the backend parses XML (some payment/shipping callbacks are XML) or rebuilds objects from untrusted data. Two serious flaws: **XXE** (XML External Entities — a crafted XML doc makes your server read local files or make internal requests, an SSRF cousin), and **insecure deserialization** (rebuilding a live object from attacker-controlled data → code execution).
- **Fix:** disable external entities/DTDs in the XML parser; never deserialize untrusted data into live objects (avoid `node-serialize`/`eval` on input); use plain JSON with validation.
- **Verify:** an XML payload referencing an external entity is ignored/rejected.

---

## H. 51 — Deep network & infrastructure — [specialist], advise-only

Where a *code* audit stops and *cloud/infrastructure security* begins. Network segmentation, a Web Application Firewall (WAF), DDoS protection, runtime/OS hardening, secrets-manager infrastructure. The skill can **name these and tell the owner what to ask for**, but cannot audit them from code — and shouldn't pretend to. For a shop taking real money, these belong to the hosting provider's managed protections, a specialist, or the penetration test.
- **Advise:** confirm the host provides DDoS protection and a WAF (Vercel/Cloudflare do at some tiers); ask a specialist about network segmentation and runtime hardening if handling significant data/traffic.
- **Honest line:** this item exists to mark the boundary. A thorough backend audit is a better smoke alarm; it is not a pentest, and the infrastructure end is explicitly beyond it.
