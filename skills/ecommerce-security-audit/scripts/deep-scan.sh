#!/usr/bin/env bash
# deep-scan.sh — run the BEST scanners available, fall back to the built-in scan.sh.
# Read-only. Detects professional tools and runs whichever are present; for any that
# are missing, prints the install command. Always runs scan.sh as the baseline so you
# get a result even on a bare machine.
#
# Usage:  bash deep-scan.sh [path]     (default path: current dir)
#
# The point: on a capable environment (a sandbox, or your machine with tools installed)
# this gives a professional-grade mechanical pass — especially for OLD/VULNERABLE
# DEPENDENCIES, which are the most reliably catchable pre-deployment risk. It does NOT
# replace the skill's human-grade review of business logic (price tampering, fake
# payment paths, IDOR, disabled controls) — run the full audit for that.

set -u
ROOT="${1:-.}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ran=0; missing=()

hr(){ printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "Deep security scan of: $ROOT"
echo "(professional tools first; built-in scanner as the floor)"

# ---------- 1. DEPENDENCIES / KNOWN CVEs  (the top priority for AI-built code) ----------
hr "Known-vulnerable dependencies (old code with published CVEs)"

if [ -f "$ROOT/package.json" ] && have npm; then
  echo "-> npm audit (high+):"; ( cd "$ROOT" && npm audit --audit-level=high ) || true; ran=1
else
  [ -f "$ROOT/package.json" ] && missing+=("npm (ships with Node.js)")
fi

if have osv-scanner; then
  echo "-> OSV-Scanner (Google OSV database, cross-ecosystem, incl. transitive deps):"
  ( osv-scanner scan -r "$ROOT" 2>/dev/null || osv-scanner -r "$ROOT" ) || true; ran=1
else
  missing+=("osv-scanner  → https://github.com/google/osv-scanner (best dependency/CVE coverage)")
fi

if have trivy; then
  echo "-> Trivy (dependencies + secrets + misconfig, high/critical):"
  trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --no-progress "$ROOT" || true; ran=1
else
  missing+=("trivy        → https://github.com/aquasecurity/trivy (all-in-one scanner)")
fi

if have retire; then
  echo "-> retire.js (vulnerable front-end JS libraries):"; ( cd "$ROOT" && retire --path . ) || true; ran=1
else
  missing+=("retire       → npm i -g retire (vulnerable JS libraries)")
fi

# ---------- 2. CODE PATTERNS (SAST) ----------
hr "Code-pattern analysis (injection, XSS, unsafe calls)"
if have semgrep; then
  echo "-> Semgrep (OWASP Top 10 + security-audit + secrets rulesets):"
  semgrep scan --config p/owasp-top-ten --config p/security-audit --config p/secrets \
    --error --quiet "$ROOT" || true; ran=1
else
  missing+=("semgrep      → pip install semgrep  (SAST; run: semgrep scan --config p/owasp-top-ten)")
fi

# ---------- 3. SECRETS ----------
hr "Secret detection (keys/tokens in code or git history)"
if have gitleaks; then
  echo "-> Gitleaks:"; ( gitleaks dir "$ROOT" --no-banner 2>/dev/null \
     || gitleaks detect --source "$ROOT" --no-banner 2>/dev/null ) || true; ran=1
else
  missing+=("gitleaks     → https://github.com/gitleaks/gitleaks (secret scanning + pre-commit)")
fi

# ---------- 4. BASELINE (always) ----------
hr "Built-in baseline scan (always runs)"
if [ -f "$HERE/scan.sh" ]; then bash "$HERE/scan.sh" "$ROOT" || true; ran=1
else echo "  (scan.sh not found next to this script)"; fi

# ---------- summary ----------
hr "Summary"
[ "$ran" = 1 ] && echo "Ran the tools available in this environment." \
              || echo "No scanners could run."
if [ ${#missing[@]} -gt 0 ]; then
  echo ""
  echo "For a STRONGER pass, install any of these and re-run (all free):"
  for m in "${missing[@]}"; do echo "   • $m"; done
  echo ""
  echo "Top pick for your worry (old/vulnerable dependencies): osv-scanner + 'npm audit'."
fi
cat <<'NOTE'

REMEMBER: these tools catch pattern-based and known-CVE problems well — that is exactly
the "old code with known vulnerabilities" risk, and these should be GREEN before you
deploy. They do NOT catch the e-commerce business-logic flaws (price tampering, fake/
simulated payment paths, unverified webhooks, IDOR, disabled age gates). Run the full
skill audit (checklists/audit-checklist.md) for those.
NOTE
