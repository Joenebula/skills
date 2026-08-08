# Testing the running site (DAST) — sandbox / staging only

This is the one layer a *code* review can't reach: how the site actually **behaves when attacked in real time**. A code audit reads the source; DAST (Dynamic Application Security Testing) acts like an attacker with no access to the source — it throws real requests at the running site and watches what comes back. That catches things that only exist once everything is assembled and running: a security header missing on the *real* server (not in the code), an error page that leaks information under a malformed request, an endpoint exposed in production nobody realised was reachable, auth that behaves differently live than the code implies, a deployed-environment misconfiguration.

**Honest scope — read before using this:**
- **This is NOT the fix for "old / vulnerable dependencies."** Those are caught precisely by the dependency scanners (`osv-scanner`, `npm audit` — see `scanner-toolchain.md` and `dependencies.md`), which read your actual package versions against the CVE database. DAST is the *live-behaviour* layer, a different job. Don't reach for DAST to catch old code.
- It is **automated** attacking — it finds common, known live issues, not a skilled human probing your specific business logic. It sits on the ladder *below* a professional pentest.

---

## ⚠️ Safety rules — these are absolute, state them every time

A DAST tool **actively attacks** the target: it submits forms, hammers endpoints, and sends injection payloads. That has real consequences. Therefore:

1. **Only ever run it against a site you own.** Scanning someone else's site is illegal.
2. **NEVER run it against the live production shop.** An active scan can create junk/real orders, send real emails to customers, corrupt data, trip Stripe/PayPal fraud alarms, or knock the site over.
3. **Run it against a throwaway copy in a sandbox, or an isolated staging deployment** — never anything customers are using.
4. **Use dummy / test credentials only.** The copy under test must NOT talk to your real database, real Stripe/PayPal, or real email provider. Point it at test keys (Stripe test mode), a disposable database, and mocked/sandboxed external services — so an attack scan touches nothing real.

If those four can't be satisfied, do not run DAST. A code review with the scanners is still valuable on its own.

---

## The tools (both free, open-source)

- **OWASP ZAP** — the standard. Two modes:
  - **Baseline scan** (mostly passive — crawls and checks headers/config, does *not* aggressively attack): the safe place to start.
  - **Full/active scan** (submits attack payloads): only on a throwaway copy with dummy services.
- **Nuclei** — fast, template-based; thousands of checks for known live vulnerabilities and exposures. Good complement to ZAP.

---

## How to run it safely in a sandbox (the recommended path)

The idea: stand up a *disposable copy* of the site inside an isolated environment, attack that, throw it away. Nothing real is touched.

**1. Get the site running against fake services.**
```bash
# in the sandbox, from the project copy
npm install
# create a throwaway .env.local with TEST/DUMMY values only:
#   STRIPE_SECRET_KEY=sk_test_...        (Stripe TEST mode, not live)
#   DATABASE_URL=<a disposable/local database, e.g. a local Postgres or SQLite>
#   email/other providers -> point at a mock or a dummy value
npm run build && npm run start &     # or `npm run dev`
# confirm it's serving, e.g. on http://localhost:3000
```
If the site can't reach a database it won't respond usefully — a disposable local database (or a seeded test one) is usually needed. This standing-up step is the main effort; scanning itself is quick.

**2. Start safe — a ZAP baseline scan (Docker is easiest):**
```bash
docker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t http://localhost:3000
```
This is largely passive: it spiders the site and reports missing headers, cookie flags, information disclosure, and obvious issues — low risk even so, but do it against the copy, not production.

**3. Then, if warranted, an active scan on the throwaway copy only:**
```bash
docker run -t ghcr.io/zaproxy/zaproxy zap-full-scan.py -t http://localhost:3000
```
Active scanning *attacks* — hence throwaway-copy-with-dummy-services only.

**4. Optionally, Nuclei for known-exposure templates:**
```bash
nuclei -u http://localhost:3000
```

---

## Turning the output into the owner report

DAST output is **noisy and needs interpretation** — many findings are false positives or low value, and the raw report is hard for a non-developer to act on. That's exactly the gap this skill fills: take the raw ZAP/Nuclei output and translate the *real* findings into the same plain-English report (`templates/security-report.html`), applying the six reporting rules — severity-rated, plain-English first, numbered fix steps, honest about reach. Discard the noise; explain the genuine issues.

Save raw output to the gitignored `.security-audit/scan-results/` (dated) — never pushed, same as everything else.

---

## Honest boundaries (say these plainly)

- **A sandbox run tests your code *as it runs*, not your actual deployed production environment.** Some of DAST's highest-value findings are about the real deployment (a header missing on the real Vercel server, a production-only misconfiguration) and may not reproduce on a local sandbox copy. Sandbox DAST catches a lot — application-level live behaviour, how forms respond to attack, error handling — but for deployment-specific issues, an isolated *staging* deployment is closer to the truth.
- **Even ZAP on a perfect staging copy is automated attacking, not a pentest.** It finds common, known live issues; it doesn't replicate a skilled human chaining your specific flaws.

## The full ladder (where this sits)

1. **Dependency + code scanners** (`scanner-toolchain.md`) — old vulnerable code, secrets, injection patterns. *Runs on a folder of code, zero risk.*
2. **This skill's logic review** (`checklists/audit-checklist.md`) — the 55 e-commerce-specific items + plain-English report.
3. **DAST on a sandbox/staging copy** (this file) — how the live site behaves under attack. *Own, non-production target only.*
4. **Professional penetration test** — the determined human. Still the ceiling; nothing here replaces it before taking serious money.

Each catches what the one before cannot. Offer DAST as an **opt-in advanced step**, not part of the default code audit, precisely because of the safety rules and the setup it needs.
