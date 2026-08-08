# scripts/

## scan.sh — read-only triage scanner

A fast first pass that greps for the highest-signal red flags and runs `npm audit`.
Portable (`grep -E`, Linux + macOS). **Changes nothing.**

```bash
bash scan.sh /path/to/repo
```

**Catches:** exposed secret keys, `NEXT_PUBLIC_`/`VITE_` secrets, `.env` tracked in
git, card fields on your server, `dangerouslySetInnerHTML`/`innerHTML`, string-built
SQL, raw-body mass assignment, wildcard/reflected CORS, weak password hashing, and —
newly — **simulated/fake/demo markers in money/auth paths** and **fail-open controls**
(a check that allows when its key is missing, or a security flag hardcoded off).

**Hints, doesn't decide:** the simulated-path and fail-open checks point you at files
to read. A marker can be harmless (a test file) or catastrophic (fake checkout) — a
human must read the flagged money/auth files. The scanner surfaces the sensitive files
for exactly this reason.

**Cannot catch** (needs the manual review in `../checklists/audit-checklist.md`):
price tampering, unverified webhooks, IDOR, missing server-side admin auth, double-spend
races, password-reset/email-change takeover, business-logic abuse, and whether an age
gate is actually enforced server-side.

A clean scan means "no obvious landmines," never "secure." Expect some false positives —
verify each hit.

## Automation files (generated on request)

The three-layer automation (a git pre-commit hook and a GitHub Actions workflow) is
described in `../references/delivery-and-automation.md`, which contains the ready-to-use
`pre-commit.sh` and `.github/workflows/security-scan.yml` to generate for the owner.
