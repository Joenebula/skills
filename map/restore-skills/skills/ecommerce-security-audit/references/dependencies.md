# Dependencies & supply chain

Modern sites are built on hundreds of third-party packages (npm). Any one of them can have a known security hole, and if your site uses it, your site inherits the hole — no bug in *your* code required. This is easy to check and easy to fix, so it's low-effort, high-value hardening before launch.

## Contents
1. Known-vulnerable packages
2. Outdated or abandoned dependencies
3. Lockfile integrity
4. Suspicious / typo-squatted packages

---

## 1. Known-vulnerable packages — severity varies (up to Critical)

Packages with publicly disclosed vulnerabilities (CVEs) are catalogued; `npm audit` cross-references your installed versions against that database.

**Check:**
```bash
npm audit                 # lists known vulnerabilities by severity
npm audit --production    # focus on packages that ship to production
```

**Stronger check — prefer OSV-Scanner (catches transitive deps npm audit can miss):**
```bash
osv-scanner scan -r .     # Google/OpenSSF OSV database, cross-ecosystem
```
Over 80% of exploitable CVEs come from *transitive* (indirect) dependencies you never installed directly, so a tool that walks the full tree matters. OSV-Scanner also reads the OSV + GitHub Advisory databases, which surface new CVEs faster than NVD-only tools (NVD lags ~7 days). Run this via `scripts/deep-scan.sh`, which uses it automatically when installed (see `references/scanner-toolchain.md`). **This is the "old code with known vulnerabilities" check — it should be green before you deploy.**

Severity mirrors the finding: a Critical/High in a package that's actually reachable in your running site should be treated as a real finding, not noise. Judge by whether the vulnerable code path is used — a High in a build-only dev tool matters less than a High in something serving requests.

**Fix:**
```bash
npm audit fix             # safe, in-range upgrades
npm audit fix --force     # allows breaking upgrades — TEST afterwards, can break the build
```
For issues `audit fix` can't resolve, upgrade the specific package to a patched version, or replace it if it's unmaintained. **Always re-run the build and walk the checkout/login happy paths after dependency upgrades** — a bumped package can change behaviour.

**Verify:** `npm audit` reports no Critical/High in production dependencies (or each remaining one is documented as not-reachable/accepted with a reason).

---

## 2. Outdated or abandoned dependencies — 🟡 Medium

Even without a filed CVE, badly out-of-date or unmaintained packages accumulate risk and miss security patches. Payment, auth, and crypto libraries especially should be current.

**Check:**
```bash
npm outdated              # shows current vs latest
```
Pay closest attention to anything touching payments, authentication, session/JWT handling, and cryptography.

**Fix:** upgrade to current stable versions (mind major-version breaking changes — read the changelog, then test). Replace abandoned packages (no releases in a long time, archived repo) with maintained equivalents.

**Verify:** security-relevant packages are on current, maintained versions; the site builds and the core flows work after upgrading.

---

## 3. Lockfile integrity — ⚪ Low/Hardening

The lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`) pins exact versions so every install is identical and can't silently pull a different (possibly compromised) version.

**Check/fix:**
- A lockfile exists and is committed to the repo.
- CI/deploys use `npm ci` (installs exactly the lockfile) rather than `npm install` (which can drift).

**Verify:** the lockfile is present and committed; deploys install from it.

---

## 4. Suspicious / typo-squatted / AI-hallucinated packages — 🔴 High-to-Critical (item 53's concrete check)

Attackers publish malicious packages with names close to popular ones (e.g. a missing/extra letter) hoping for a typo in `package.json`. **The AI-build twist (item 53):** an AI can confidently *invent* a plausible-sounding package name that doesn't exist — and attackers now **register those hallucinated names with malicious code**, betting an AI will recommend them and someone will install them. So on an AI-built site this isn't a rare typo risk — it's a live path to installing malware the AI chose for you.

**Check (weight this harder on AI-generated projects):**
- Skim `package.json` for names that look *almost* like a well-known package but slightly off, or packages you don't recognise at all.
- For each unfamiliar package, **confirm it genuinely exists and is the real, widely-used one** — check its npm page for download counts, a real repo, an active maintainer, and a history. A package with almost no downloads, no repo, or a very recent first-publish that your app depends on for something important is a red flag.
- Be especially suspicious of a dependency that showed up because the AI added it, that you can't tie to a feature you asked for.

**Fix:** remove anything unrecognised, misspelled, or unverifiable; install the correct, verified package instead. If a suspicious package was ever installed, treat it like a leaked secret — assume it may have run code, and rotate anything it could have touched.

**Verify:** every dependency is a known, legitimately-named, maintained package that the project actually uses.

**Rating:** 🔴 if a hallucinated/typo-squatted/unverifiable package is present (potential malware); 🟡 for merely-outdated-but-real ones (§2).

---

## Quick triage for a dependency review

1. `npm audit` — any Critical/High in production deps? — §1
2. `npm outdated` — are payment/auth/crypto libs current? — §2
3. Is a lockfile committed and used for installs? — §3
4. Any oddly-named/unrecognised packages? — §4

Run §1 first; it's one command and surfaces the highest-value fixes. Re-test the build after any upgrade.
