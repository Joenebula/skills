# Scanner toolchain — use the best tools available

This skill's own `scan.sh` is a deliberately lightweight, dependency-free first pass so it runs *anywhere*. But when the audit runs in a capable environment (a sandbox, or the owner's machine with tools installed), it should reach for **professional-grade scanners first** and fall back to `scan.sh` only when they're absent. `scripts/deep-scan.sh` does exactly this — detects what's installed, runs it, and prints install commands for what's missing.

**Why this matters for AI-built sites specifically:** the single most reliably catchable risk in AI-generated code is **old dependencies with published (known) vulnerabilities** — the AI pulls in a package version with a documented CVE. This is *exactly* what the dependency scanners below catch, mechanically and completely, and it should be **green before deployment**. (What they can't catch — price tampering, fake payment paths, IDOR, disabled controls — is the skill's own job; see the checklist.)

## The recommended free tools (all open-source), by job

**Dependencies / known CVEs — the top priority. Old vulnerable code lives here.**
- **OSV-Scanner** (Google/OpenSSF) — best cross-ecosystem coverage, queries the OSV database, catches *transitive* dependencies (80%+ of exploitable CVEs come from indirect deps you didn't install directly). `osv-scanner scan -r .`
- **`npm audit`** — ships with Node, quick baseline. `npm audit --audit-level=high`. Noisier and npm-only; use alongside OSV-Scanner, not instead.
- **Trivy** — all-in-one (dependencies + secrets + misconfig), good default if you install just one. `trivy fs --severity HIGH,CRITICAL .`
- **retire.js** — specifically vulnerable *front-end* JS libraries. `retire --path .`
- Note the database gap: NVD lags ~7 days behind new CVEs; tools that also read the **GitHub Advisory Database** and **OSV** surface issues faster — another reason to prefer OSV-Scanner over NVD-only tools.

**Code patterns (SAST):** **Semgrep** (community edition, free) with the OWASP rulesets. `semgrep scan --config p/owasp-top-ten --config p/security-audit --config p/secrets`. Catches injection, XSS, unsafe calls — overlaps and strengthens the skill's injection checks.

**Secrets:** **Gitleaks** (fast, great as a pre-commit hook) and/or **TruffleHog** (deeper, scans git history). Stronger than the built-in grep for leaked keys.

**Running-app testing (DAST):** **OWASP ZAP** — tests the *live* site the way an attacker would (not just source). Beyond a code audit's reach, closer to the pentest end — mention it, don't run it as part of a code review.

## Claude Code's own native security features — use them, they're complementary

If the owner is running in **Claude Code**, Anthropic ships security tooling that pairs well with this skill. Recommend enabling it; it does *not* replace the skill (it's general-purpose; the skill is e-commerce-specific), but it's a strong, free extra layer:

- **The `security-guidance` plugin** (free, all plans). Install in a Claude Code session: `/plugin install security-guidance@claude-plugins-official`. It reviews Claude's *own* code changes at three depths — a fast per-edit pattern check (no model call), an end-of-turn model review of the diff, and a deeper agentic review on commit/push — catching injection, unsafe deserialization, unsafe DOM APIs, IDOR, SSRF, and hardcoded secrets *as code is written*. Requires Claude Code ≥ 2.1.144 and Python ≥ 3.8. This is the ideal complement for a *non-developer generating code with AI*: it flags problems the moment the AI introduces them.
- **The `/security-review` slash command** (built in) — an on-demand comprehensive review of pending changes.
- **Claude Code's Code Review** (on pull requests) and, for Team/Enterprise/Max plans, **Claude Security** — a dashboard that scans a whole GitHub repo, validates findings adversarially, and suggests patches for approval. Worth knowing about if the owner scales up.

**How they relate to this skill (be honest):** the plugin and `/security-review` are *general* security review — they catch broad code-level flaws across any project. This skill adds the **e-commerce domain layer** they don't specialise in: price/total tampering, simulated payment paths, webhook verification, UK age-gate/selling-law, the plain-English owner report, and the owner/account (Ring 2/3) items no code tool can see. Use both: the native tools as an always-on general net, this skill for the shop-specific audit and the non-developer report.

## How the skill uses this (workflow)

In the mechanical-first-pass step, prefer `scripts/deep-scan.sh` (professional tools + baseline) over `scan.sh` alone. Everything runs **read-only** and, per the output rules, any saved output goes to the gitignored `.security-audit/scan-results/` — never pushed. Treat a clean dependency scan as a **pre-deployment gate**: known-CVE findings should be fixed (update the package) or consciously accepted before going live.

## Honest boundaries (unchanged)

More tools = a better *mechanical* pass, not a pentest. Even OSV-Scanner + Semgrep + Gitleaks + the native plugin, all green, still don't test the running app (that's ZAP/DAST) or replicate a skilled human chaining flaws (that's the pentest). And business-logic flaws remain the skill's reasoning job, not any scanner's. The value here is making the *catchable* layer — especially old vulnerable dependencies — as thorough as possible before deployment.
