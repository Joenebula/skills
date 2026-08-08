# Delivery & automation — the three layers

A skill runs when the owner brings code to Claude; it can't sit in GitHub running on its own or send email by itself. But the *checks* can be automated by a separate mechanism. Three layers share the same underlying checks, each covering a different moment. Offer to set up layers 1 and 2; generate the files and give copy-paste steps in plain language.

**Be honest about the division of labour:** layers 1–2 are the "smoke alarm" — automatic, tireless, but only pattern-based (leaked keys, committed `.env`, card fields, obvious markers). The deep money-and-data flaws (price tampering, unverified webhooks, IDOR, disabled controls, logic abuse) still need layer 3, the on-demand Claude audit, because they need understanding, not pattern-matching.

## Where these files go (read the "Where everything is written" rule in SKILL.md first)

- **Nothing audit-generated is ever committed or pushed.** Reports and scan output live in the gitignored `.security-audit/` folder, local only.
- The **pre-commit hook (layer 1)** runs on the owner's machine and is **not committed** — it lives in `.security-audit/automation/` (gitignored) and is linked into git's hooks.
- The **GitHub workflow (layer 2)** is the **one deliberately committed file**, because it must be in the repo to run. It is written to be **self-contained and sensitive-data-free**: it contains no findings, doesn't depend on any other audit file being in the repo, and never writes reports or scan output back into the repo. It only runs generic checks and lets the job fail, which triggers GitHub's email.

---

## Layer 0 — Continuous dependency watching (GitHub Dependabot) — the tough "old code" check, automatic

The highest-value, lowest-effort automation for the "old vulnerable packages" risk, and it needs no skill from the owner. Two parts:

**(a) The settings toggles (the important bit — owner does this once):** on the repo → **Settings → Code security** → enable **Dependabot alerts** and **Dependabot security updates**. Alerts notify the owner the moment a package they use gets a known vulnerability; security updates auto-open a pull request bumping it to the safe version. Free on all repos. This is continuous — it watches forever, catching new vulnerabilities as they're disclosed, not just at scan time.

**(b) A `.github/dependabot.yml` file (the skill can generate this — findings-free, safe to commit)** for routine version updates so packages don't drift far behind:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```
Reveals nothing about the site's weaknesses (it just says "check npm weekly"), so it's fine to commit alongside the security-scan workflow.

**Why this pairs with the on-demand scan:** Dependabot is the *continuous alarm* (watches always, hands you fixes); the skill's `deep-scan.sh` (OSV-Scanner + `npm audit`) is the *thorough pre-deploy gate* run during an audit. Together they mean old vulnerable code is caught both continuously and before each launch — regardless of the owner's technical level.

---

## Layer 1 — Pre-upload check on the owner's computer (strongest for secrets; fully local)

Runs **every time the owner tries to commit**, and blocks the commit if it spots a secret or a `.env` file about to go out. A key that never leaves the machine never has to be rotated — this stops the fire before it starts. Nothing about it is pushed.

Create `.security-audit/automation/pre-commit.sh` in the project (this path is gitignored):

```bash
#!/usr/bin/env bash
# Blocks a commit that adds a secret or a .env file. Exit non-zero = commit blocked.
staged=$(git diff --cached --name-only)
if echo "$staged" | grep -Eq '(^|/)\.env(\.|$)'; then
  echo "BLOCKED: you're about to commit a .env file. Secrets must stay local."
  echo "Remove it:  git rm --cached <file>   and add it to .gitignore"
  exit 1
fi
if git diff --cached | grep -Eq 'sk_live_|sk_test_|pk_live_|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'; then
  echo "BLOCKED: a line you're committing looks like a secret key."
  echo "Move it to .env.local (kept out of git) and read it from there."
  exit 1
fi
exit 0
```

Owner steps (plain):
1. Make it runnable: `chmod +x .security-audit/automation/pre-commit.sh`.
2. Link it as the git hook (the link lives in `.git/`, which is never pushed): `ln -sf ../../.security-audit/automation/pre-commit.sh .git/hooks/pre-commit`.
3. From now on, a commit containing a secret or `.env` is stopped with a plain message. (If the project uses Husky, wire it there instead — check first.)

---

## Layer 2 — GitHub check: every push + weekly, with email (self-contained, nothing sensitive committed)

GitHub Actions is free and **already emails the owner when a check fails** — no email server to build. This is the **only** file that gets committed, and it's deliberately self-contained: it runs generic checks (a dependency audit and an inline secret grep) with **no dependency on any other audit file** and **no writing of reports or scan output back to the repo**. It reveals nothing about the site's weaknesses — it just runs and, if it finds a hard red flag, fails (which sends the email).

Create `.github/workflows/security-scan.yml`:

```yaml
name: security-scan
on:
  push:
  schedule:
    - cron: '0 8 * * 1'   # every Monday 08:00 UTC
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Dependency vulnerabilities (report only, never fails the build)
        run: npm audit --audit-level=high || true
      - name: Fail on committed secrets (this is what triggers the email)
        run: |
          if git grep -InE 'sk_live_|sk_test_|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}' -- . ':(exclude).github/*' ; then
            echo "::error::A secret appears to be committed in the repository."
            exit 1
          fi
      - name: Fail on committed .env
        run: |
          if git ls-files | grep -Eq '(^|/)\.env($|\.)' | grep -v '\.env\.example$'; then
            echo "::error::A .env file is tracked in git."
            exit 1
          fi
```

Owner steps (plain):
1. Put the file at `.github/workflows/security-scan.yml` and push it. (This is the *only* audit-related file that goes to GitHub — and it contains no findings about your site.)
2. GitHub runs it automatically on every push and every Monday.
3. If a check fails, **GitHub emails you** — log in, open the failed run, read what it caught.
4. Make sure Actions email notifications are on (GitHub → Settings → Notifications).

**Honest notes:** this catches committed secrets and (as a report) vulnerable dependencies. It does *not* catch price tampering, unverified webhooks, IDOR, or disabled controls — those are why layer 3 exists. And it deliberately does **not** run the full `scan.sh` in CI, so that no scan output or report is ever produced inside the repo — keeping the "nothing sensitive is pushed" rule intact.

---

## Layer 3 — On-demand deep audit (this skill)

The intelligent review: the flaws a script can never catch, the plain-English report, and the fixes. Run before a launch, or whenever layer 1 or 2 raises a flag. Its report is written to the gitignored `.security-audit/reports/` folder — local only, never pushed.

---

## How they fit

- **Layer 1** stops leaks at the door (best place — no rotation needed), entirely local.
- **Layer 2** watches the repo, emails weekly and on every change — one committed, findings-free file.
- **Layer 3** is the thorough reviewer called in when something's flagged or before going live, writing local-only reports.

Together they close the **drift** gap: an audit is a snapshot, so repetition keeps it honest — while nothing that describes the site's weaknesses ever leaves the owner's machine.
