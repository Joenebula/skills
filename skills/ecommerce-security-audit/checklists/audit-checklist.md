# Master audit checklist — all 30 items, three rings

Work top-down. Items are grouped by ring and ordered so the highest-impact, most-common flaws come first. Tick each; for conditional items, first confirm the feature exists. Read the matching reference as you go (see the table in SKILL.md).

Legend: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low · [C] = conditional (only if feature present) · [O] = owner action · [A] = advise/judgement only

---

## RING 1 — In the code (find, explain, fix)

### Money & commerce — `payments-and-commerce.md`
- [ ] 7a 🔴 Price / total taken from the browser instead of looked up server-side
- [ ] 7a 🔴 Quantity / currency taken from the browser (negative qty, weak currency)
- [ ] 7b 🔴 Payment webhook not verified against the raw body signature
- [ ] 7c 🔴 Order fulfilled on the browser "success" redirect, not the verified webhook
- [ ] 22 🔴 **Simulated / fake / demo payment path** shipped (marker in a money/membership path) — *propose, don't auto-wire; safe action = make it fail closed*
- [ ] 24 🔴 Double-spend race on money / points / stock / single-use codes — *propose + test under load*
- [ ] 7  🟠 Coupon / gift-card abuse (stacking, reuse, negative discount)
- [ ] 7  🟠 Refund logic (refund > paid, refund someone else's order, points→cash)
- [ ] 6  🔴 Card fields (`cardNumber`, `cvv`) on your own server — should never exist
- [ ] 7  🟡 Idempotency / duplicate orders on double-submit
- [ ] 7  🟡 Inventory decrement missing → overselling

### Access control & auth — `access-control-and-auth.md`
- [ ] 2  🔴 IDOR — one customer can read/modify another's data by changing an ID
- [ ] 3  🔴 Admin protected only in the UI, not enforced server-side
- [ ] 1  🔴 Passwords stored unhashed or with broken hashing (must be bcrypt/scrypt/Argon2)
- [ ] 28 🔴 Reset token not expiring / guessable / not account-scoped / reusable
- [ ] 28 🔴 Email/password change with no re-authentication or new-email verification
- [ ] 28 🟠 Recovery flow bypasses customer 2FA; no notification to old email on change
- [ ] 4  🟠 No rate limiting on login / reset
- [ ] 33 🟠 Abuse/rate-limiting beyond login — expensive endpoints, scraping, **card-testing** (🔴 impact), inbox/SMS bombing; provider fraud tools (Stripe Radar) [O]
- [ ] 34 🟡 Account enumeration — login/signup/reset reveal whether an email has an account
- [ ] 3  🔴 Default or hardcoded credentials

### Secrets & configuration — `secrets-and-configuration.md`
- [ ] 5  🔴 Secret key in code, repo, git history, or the browser bundle (`NEXT_PUBLIC_` trap)
- [ ] 5  🔴 `.env` tracked in git

### Injection & input — `injection-and-input-validation.md`
- [ ] 8  🔴 SQL injection — string-built queries instead of parameterised
- [ ] 8  🔴 XSS — `dangerouslySetInnerHTML` / user content rendered as code
- [ ] 8  🔴 Mass assignment — raw request body spread into a DB write (admin-escalation)
- [ ] 8  🟠 Validation only in the browser, not re-checked server-side

### Data exposure & headers — `data-exposure-and-headers.md`
- [ ] 9  🔴 Over-fetching — whole records (esp. user/account) sent to the browser
- [ ] 9  🔴 Debug / test / internal endpoints left exposed
- [ ] 9  🟠 Verbose errors / stack traces returned to the browser
- [ ] 10 🔴 Wildcard `*` CORS on data endpoints
- [ ] 10 🟠 Dev mode in production
- [ ] 10 🟡 Missing security headers (CSP, HSTS, etc.) — CSP may need tuning [A]

### Dependencies — `dependencies.md`
- [ ] 11 (severity per `npm audit`) Known-vulnerable packages — safe updates applied, major flagged [A]
- [ ] 11 Outdated / abandoned packages; typo-squat check

### Cross-cutting lenses — `security-principles.md`
- [ ] 23 🔴 Fail-open controls — any control that lets people through when misconfigured/erroring (apply everywhere: auth, CAPTCHA, age, payment verify, rate limit)
- [ ] — Interface-vs-reality: any UI claim (paid, verified, consented, referenced) the code doesn't actually do

### Business logic — `business-logic-abuse.md`
- [ ] 27 🟠 Map refund/cancel/order-edit/loyalty/referral/coupon sequences; ask the owner the structured questions; confirmable gaps → rate on impact (often 🔴) [A]

### Backend beneath the app (code side) — `backend-and-infrastructure.md`
- [ ] 43 🔴 Background jobs / cron / queue trigger endpoints unauthenticated (anyone can fire "process all orders")
- [ ] 44 🟠 Non-payment webhooks (shipping, email, inventory) not signature-verified
- [ ] 45 🔴 Serverless state leakage (per-user data in shared scope) / personalised page CDN-cached → one user sees another's data
- [ ] 46 🟠 Logging hygiene — card numbers / passwords / tokens / PII written to logs
- [ ] 47 🟠 Expensive/unbounded queries — no pagination/limit, mass-export dumps whole table
- [ ] 38 🟠 App connects to DB with least privilege (not admin/superuser) [code+owner]
- [ ] 41 🟠 Server-to-server keys scoped (e.g. Stripe restricted keys) and rotated [code+owner]
- [ ] 49 🟠 [C] GraphQL: introspection off in prod, query depth/cost limited, field auth — *skip if no GraphQL*
- [ ] 50 🔴 [C] XML parsing (XXE) / unsafe deserialization — *skip if backend parses no XML / deserializes no untrusted data*

### Conditional — `uploads-and-ssrf.md`, `ai-feature-security.md`
- [ ] 29 [C] File uploads: stored-executable 🔴 / public confidential files 🔴 / no size limit 🟠 / filename trust 🟠 — *skip if no uploads*
- [ ] 30 [C] SSRF: server fetching user URLs reaching internal/metadata 🔴 / unconstrained fetch 🟠 / open redirect 🟡 — *skip if no server-side URL fetch*
- [ ] 32 [C] AI features (chatbot/AI search/etc.): prompt injection — 🔴 if the AI can take actions or read other users'/secret data, 🟠 if it can leak its prompt / damage brand — *skip if no AI features; limit blast radius, enforce action limits in code*

### Client-side & third-party scripts — `client-side-skimming.md`
- [ ] 31 Script skimming (Magecart): audit scripts on checkout/account pages; checkout-scoped CSP allow-list; SRI where feasible; real payment iframe — 🟠 (PII/phishing) rising to 🔴 if card/overlay in play
- [ ] 36 [C] **Affiliate/ad monetisation** (only if the site runs affiliate/ad click-throughs): ad/affiliate scripts kept OFF checkout/account pages + CSP-blocked there (§31); affiliate redirect uses a fixed destination list, not a user param (§30); ad cookies wait for consent (§26); disclosure present [O/A]

---

## RING 2 — Owner accounts & habits (write plain steps) — `owner-actions.md`
- [ ] 12 🔴 [O] Owner 2FA on GitHub, Vercel, Stripe — surface every time, assume off until confirmed
- [ ] 13 🔴 [O] Rotate any leaked key (remove is not enough — regenerate + re-enter in Vercel)
- [ ] 14 🟠 [O] Secrets discipline (only `.env.local` + Vercel; `.env` in `.gitignore`)
- [ ] 15 [O] Login habits — never log in via email links
- [ ] 16 🟠 [O] Confirm each fix actually deployed to the live site
- [ ] 35 🟠 [O] Email/domain anti-spoofing (SPF/DKIM/DMARC) records set; remove DNS for unused services (subdomain takeover)
- [ ] 37 🔴 [O] Database NOT exposed to the public internet — restrict to app network / IP allow-list
- [ ] 39 🟠 [O] Encryption in transit (SSL to DB) and at rest enabled
- [ ] 40 🟠 [O] Backups on, stored privately, and a restore actually TESTED
- [ ] 42 🔴 [O] Preview/staging deployments don't leak production secrets/data; preview URLs protected
- [ ] 48 🟠 [O] CI/CD: secrets scoped & masked, deploy hooks protected, no source maps/secrets in prod build
- [ ] 52 🟠 [O] Team/contractor access — access list, individual (not shared) accounts, least privilege, team-wide 2FA, offboarding that revokes + rotates (🔴 if known orphaned access)
- [ ] 55 🔴 [O] Domain: 2FA on registrar account; 🟠 transfer-lock on; 🟠 auto-renew + backup payment (expiry)
- [ ] — [O] Light note: no breach-detection/logging; offsite backups

---

## RING 3 — Decisions & outside reality (advise, point onward) — `regulated-goods-and-legal.md`
- [ ] 25 🔴 [A] Regulated-goods age check: enabled, server-enforced, not falsely claimed (legal sufficiency = get advice)
- [ ] 26 🔴 [A] Cookie consent actually enforced (code-checkable); 🟠 company details, real returns policy, placeholder legal pages
- [ ] 17 🟠 [A] UK GDPR duties — privacy policy, data minimisation, deletion, 72h breach rule (awareness, not legal advice)
- [ ] 18 🟠 [A] Customer-facing 2FA — recommend, keep distinct from owner 2FA
- [ ] 19 [A] Third-party tools/plugins — list, keep short, can't audit someone else's service
- [ ] 20 [A] Drift over time — an audit is a snapshot → rely on the automation layers
- [ ] 21 [A] Professional penetration test before taking serious money — this audit doesn't replace it
- [ ] DAST [A/advanced] Optional: attack-test the RUNNING site (OWASP ZAP / Nuclei) on a sandbox or staging copy only — never production, dummy credentials only. Catches live-behaviour/config issues code review can't. See `references/dast-running-site.md`. (Not the check for old dependencies — that's the scanners.)
- [ ] 51 [A] Deep network/infrastructure (WAF, DDoS, segmentation, runtime hardening) — confirm host provides it; specialist for the deep end
- [ ] 54 [A] Incident-readiness plan prepared BEFORE launch — shutdown levers, contacts, 72h ICO trigger, customer-notification, investigate-ability
- [ ] 53 (lens) AI-build posture applied across the whole audit — assume AI-generated, trust nothing finished, verify AI-chosen dependencies (concrete 🔴 check in dependencies §4)

---

## The boundary rule — do NOT fold these into the security report
Flag placeholder/broken/claimed-but-unreal code **only** in security/money/access/data/legal paths. Explicitly out of scope (note in one line at most, never audit): functional bugs (dead forms, fake wishlist), accessibility (focus rings, WCAG), performance (N+1, indexes), ops/deploy reliability (broken DB URL, migrations, site down).

## Output location & automation — offer at the end — `delivery-and-automation.md`
- [ ] 🚧 GATE (surface on first scan, blocker): dedicated **security-alerts email** set up + all sources routed to it (Dependabot, Actions failures, optional error-monitoring) — `notifications-and-alerts.md`. Security setup isn't "done" until alerts reach a human.
- [ ] Layer 0 Dependabot — owner enables alerts + security updates in repo settings; skill adds findings-free `.github/dependabot.yml` (continuous "old code" watch)
- [ ] Dependency scan run during the audit via deep-scan (OSV-Scanner) and treated as a pre-deploy gate — happens regardless of owner level
- [ ] All reports/scan output written to gitignored `.security-audit/` in the PROJECT root — never the skill folder, never pushed
- [ ] `.security-audit/` added to the project `.gitignore`
- [ ] Layer 1 pre-commit hook generated in `.security-audit/automation/` (local, gitignored) + linked into git hooks
- [ ] Layer 2 self-contained GitHub workflow at `.github/workflows/security-scan.yml` (the ONLY committed file; no findings; doesn't write output back)
- [ ] Layer 3 (this audit) — on-demand deep pass, reports saved local-only
