# Secrets & configuration

"Secrets" are the keys and passwords that let your site act as itself: the Stripe secret key, the database URL, API keys for email/SMS/AI services, the JWT signing secret. If any of these leak, an attacker can charge cards, read/wipe your database, or impersonate your site. AI-built sites leak secrets in three predictable ways — this file covers all three, plus how to clean up after a leak.

## Contents
1. Secret keys shipped to the browser (Critical)
2. The `NEXT_PUBLIC_` trap (Critical)
3. `.env` committed to git / secrets in git history (Critical)
4. Environment variables misconfigured on Vercel (Medium)
5. What to do after a secret has leaked (owner actions)

---

## 1. Secret keys shipped to the browser — 🔴 Critical

Anything referenced in front-end/client code ends up in the JavaScript bundle that every visitor downloads. A secret used there is public. The classic case is the **Stripe secret key** (`sk_live_...` / `sk_test_...`) used in client code, when only the **publishable key** (`pk_...`) belongs in the browser.

Red flags:
- `sk_live_`, `sk_test_`, or any `*_secret_*` string in a component, page, or anything that runs in the browser.
- A database connection string, or an email/SMS/AI provider key, imported into client code.
- API calls from the browser that include a secret key in the headers.

**Rule of thumb:** publishable/public keys (`pk_...`, publishable map/analytics keys) are fine client-side. **Secret keys, database URLs, and signing secrets must only ever run on the server** — in API routes, server actions, or server components — never in client code.

**What an attacker does:** copies your Stripe secret key from the page source and uses it to create charges, issue refunds to themselves, or pull your customer/payment data via Stripe's API. With a leaked database URL, they connect directly to your database.

**Fix:** move all secret usage to server-only code. In Next.js, call the payment processor from a route handler / server action, keep the secret in a server env var (no `NEXT_PUBLIC_` prefix), and have the browser talk only to *your* server, which holds the secret. Then **rotate the leaked key** (section 5) — moving it isn't enough once it's been public.

**Verify:** build the site and search the built client bundle for secret patterns (the scan script does this: greps built output / source for `sk_live`, `sk_test`, connection strings). Also open the deployed site, view source / dev tools, and confirm no secret is present. If a secret is in the bundle, it's not fixed until it's both removed *and* rotated.

---

## 2. The `NEXT_PUBLIC_` trap — 🔴 Critical

In Next.js, any environment variable whose name starts with **`NEXT_PUBLIC_`** is deliberately baked into the browser bundle so client code can read it. This is correct for genuinely public values (publishable Stripe key, public site URL) — and a disaster for secrets. A very common AI mistake is naming a secret `NEXT_PUBLIC_STRIPE_SECRET_KEY` or `NEXT_PUBLIC_DATABASE_URL` "so the code can access it", which publishes it to the world.

Red flags:
```
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_...   # ← secret, but public. Disaster.
NEXT_PUBLIC_DATABASE_URL=postgres://...      # ← secret, but public. Disaster.
NEXT_PUBLIC_OPENAI_API_KEY=sk-...            # ← secret, but public. Disaster.
```

**Fix:** drop the `NEXT_PUBLIC_` prefix for anything secret, and use the variable only in server code. Keep the prefix *only* for values that are safe for anyone to see:
```
STRIPE_SECRET_KEY=sk_live_...                 # server-only ✓
DATABASE_URL=postgres://...                    # server-only ✓
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # public, safe ✓
```
Then rotate anything that was previously exposed (section 5).

**Verify:** grep the codebase and `.env*` files for `NEXT_PUBLIC_` followed by anything ending in `SECRET`, `KEY`, `TOKEN`, `PASSWORD`, `URL` that points at a private resource. The scan script flags `NEXT_PUBLIC_` names that look secret. A single `NEXT_PUBLIC_*_SECRET_*` is a red alert.

> Other frameworks have the same concept under a different name — Vite exposes `VITE_*`, Create React App exposes `REACT_APP_*`. Same trap: those prefixes ship to the browser, so never put secrets behind them.

---

## 3. `.env` committed to git / secrets in git history — 🔴 Critical

The `.env` file holds secrets and must **never** be committed. If it's tracked in the repo, everyone with repo access (and everyone, if the repo is public) has the keys. Worse: even after deleting it, the secrets remain in **git history** and are still retrievable.

Red flags:
- `.env`, `.env.local`, `.env.production` tracked in git (not in `.gitignore`).
- Secrets visible anywhere in `git log` / past commits.
- A public repo (e.g. on GitHub) containing any of the above.

**Fix:**
1. Add `.env*` to `.gitignore` (keep only a `.env.example` with **empty** placeholder values as documentation).
2. Remove the file from tracking: `git rm --cached .env`.
3. **Assume every secret ever committed is compromised and rotate all of them** (section 5). Scrubbing history (e.g. `git filter-repo`/BFG) is good hygiene but does *not* substitute for rotation — the keys may already be copied.

**Verify:** `git ls-files | grep -E '^\.env'` returns nothing; a search of history for secret patterns comes up clean; and the exposed keys have been rotated. The scan script checks whether `.env` is tracked.

---

## 4. Environment variables misconfigured on Vercel — 🟡 Medium

On Vercel, env vars are set per environment (Production / Preview / Development) in the dashboard, not committed. Two issues to check:

- **Secrets scoped too broadly** — production secrets exposed to Preview deployments means every preview URL (often shareable/less protected) can use live keys. Prefer separate keys per environment (test keys for preview, live keys for production).
- **Missing on the server / present in the wrong place** — a secret that must be server-only should not be duplicated into a `NEXT_PUBLIC_` variable "to make it work" (see §2).

**Fix:** set secrets in Vercel's Environment Variables with the correct environment scope; use test/live key separation; never paste live secrets into preview if avoidable. This is an owner action in the Vercel dashboard — give clear numbered steps.

**Verify:** confirm production uses live keys server-side only, and preview uses test keys.

---

## 5. What to do after a secret has leaked — owner actions

Moving a key out of client code or out of git does **not** un-leak it — if it was ever public, treat it as known to attackers and **rotate** (replace) it. Give the owner a clear checklist:

- [ ] **Stripe secret key** — roll it in the Stripe dashboard (Developers → API keys → roll), update the server env var, redeploy. Check Stripe for unexpected charges/refunds.
- [ ] **Database URL / password** — rotate the database credentials, update the env var.
- [ ] **Email / SMS / AI provider keys** — regenerate in each provider's dashboard, update env vars. Check for unexpected usage/billing.
- [ ] **JWT / session signing secret** — replace it (this logs everyone out, which is the point — old forged tokens die).
- [ ] **Webhook signing secret** — reissue if exposed.
- [ ] Remove the secret from client code / git, add `.env*` to `.gitignore`, and **redeploy** so the old bundle is gone.
- [ ] If the repo was public, assume everything in it is compromised and rotate broadly.

Rotation is the step people skip and the one that actually closes the hole. Emphasise it.

---

## Quick triage for a secrets review

1. Any `sk_`, connection string, or provider key in client code / the built bundle? — §1
2. Any `NEXT_PUBLIC_` (or `VITE_`/`REACT_APP_`) name that's actually a secret? — §2
3. Is `.env` tracked in git, or are secrets in git history? — §3
4. Are Vercel env vars scoped correctly (test vs live)? — §4
5. For anything exposed: has it actually been rotated? — §5

Exposed secrets are among the fastest ways a site gets drained, and the scan script catches the obvious ones — but rotation (§5) is what finishes the job.
