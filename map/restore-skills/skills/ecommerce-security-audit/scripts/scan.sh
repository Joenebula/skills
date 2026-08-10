#!/usr/bin/env bash
#
# scan.sh — fast, READ-ONLY triage for an e-commerce codebase.
#
# This is a STARTING POINT, not the audit. It greps for the highest-signal
# red flags and runs npm audit. It CANNOT see broken access control, price
# tampering, or unverified webhooks — those need a human read (see the
# reference files). A clean scan means "no obvious landmines", never "secure".
#
# Usage:  bash scan.sh /path/to/repo
#
# It changes nothing. It only reads files and runs npm audit.
# Uses plain `grep -E`, which works on Linux (GNU) and macOS (BSD) alike.

set -u

ROOT="${1:-.}"
if [ ! -d "$ROOT" ]; then
  echo "Path not found: $ROOT" >&2
  echo "Usage: bash scan.sh /path/to/repo" >&2
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"

# Exclude vendor/build dirs. We deliberately DO search hidden files (.env etc.)
# and do NOT respect .gitignore — a secret in a gitignored .env is exactly the
# kind of thing (e.g. a NEXT_PUBLIC_ secret) we want to see.
EXARGS=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
        --exclude-dir=build --exclude-dir=.git --exclude-dir=out \
        --exclude-dir=coverage --exclude-dir=.turbo --exclude-dir=.vercel)

search() { grep -rEniI "${EXARGS[@]}" -e "$1" "$ROOT" 2>/dev/null; }

FLAGS=0
section() { echo ""; echo "-- $1 --"; }
report() { # title, pattern, advice
  local title="$1" pattern="$2" advice="$3" hits
  hits="$(search "$pattern")"
  if [ -n "$hits" ]; then
    FLAGS=$((FLAGS+1))
    echo ""
    echo "  [!] $title"
    printf '%s\n' "$hits" | sed 's/^/      /' | head -40
    echo "      -> $advice"
  fi
}

echo "==================================================================="
echo " E-commerce security triage scan"
echo " Target: $ROOT"
echo " (read-only; this is a first pass, NOT the full audit)"
echo "==================================================================="

# ------------------------------------------------------------------ SECRETS
section "Exposed secrets (Critical if in client code / committed)"
report "Stripe SECRET key present in code/config" \
  "sk_(live|test)_[A-Za-z0-9]" \
  "Secret keys must never sit in code or ship to the browser. Move server-side and ROTATE the key. references/secrets-and-configuration.md §1."
report "Database connection string with credentials" \
  "(postgres(ql)?|mysql|mongodb([+]srv)?)://[^ :@]+:[^ @]+@" \
  "DB URLs are secrets. Keep in a server-only env var; rotate if committed/public. §1."
report "NEXT_PUBLIC_ name that is a secret (shipped to the browser!)" \
  "NEXT_PUBLIC_[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|TOKEN|DATABASE|DB_URL)" \
  "NEXT_PUBLIC_ is public. If it's a secret, drop the prefix, use it server-side, and ROTATE. Also eyeball any NEXT_PUBLIC_*API_KEY. §2."
report "Other framework public-env secret (VITE_/REACT_APP_)" \
  "(VITE_|REACT_APP_)[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|TOKEN)" \
  "Same trap as NEXT_PUBLIC_ — these ship to the browser. Don't put secrets behind them. §2."
report "Possible hardcoded credential in code" \
  "(api[_-]?key|secret[_-]?key|private[_-]?key|auth[_-]?token)[[:space:]]*[:=][[:space:]]*[\"'][A-Za-z0-9_-]{16,}" \
  "Looks like a hardcoded credential. Move to a server-only env var; rotate if it was public. (Can false-positive on long prop strings — verify.) §1, §5."

# --------------------------------------------------------------------- .env
section ".env / git hygiene (Critical if secrets are tracked)"
if [ -d "$ROOT/.git" ]; then
  TRACKED_ENV="$(cd "$ROOT" && git ls-files 2>/dev/null | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)"
  if [ -n "$TRACKED_ENV" ]; then
    FLAGS=$((FLAGS+1))
    echo ""
    echo "  [!] .env file is TRACKED in git (secrets exposed to anyone with repo access)"
    printf '%s\n' "$TRACKED_ENV" | sed 's/^/      /'
    echo "      -> Add .env* to .gitignore, run 'git rm --cached <file>', and ROTATE every secret ever committed. §3."
  else
    echo "  [ok] No .env file appears to be tracked in git."
  fi
  if [ -f "$ROOT/.gitignore" ] && grep -qE '(^|/)\.env' "$ROOT/.gitignore" 2>/dev/null; then
    :
  else
    echo "  [!] .gitignore doesn't obviously ignore .env* — confirm secrets can't be committed. §3."
  fi
else
  echo "  [i] No .git directory here — can't check git tracking/history."
fi

# ------------------------------------------------------------- CARD DATA
section "Card data on your server (Critical — PCI)"
report "Card-number / CVV field names in code" \
  "card[_-]?number|cardnumber|cardno|[^a-z](cvv|cvc)[^a-z]" \
  "Raw card data must go browser->processor, never through your server/logs. Use Stripe/PayPal hosted or embedded fields. Storing CVV is prohibited. references/payments-and-commerce.md §6."

# ------------------------------------------------------------------ XSS
section "Cross-site scripting sinks (High)"
report "dangerouslySetInnerHTML" \
  "dangerouslySetInnerHTML" \
  "If the HTML comes from users, sanitise with DOMPurify or render as text. references/injection-and-input-validation.md §2."
report "innerHTML assignment (vanilla JS)" \
  "[.]innerHTML[[:space:]]*=" \
  "If assigned user input, this is XSS. Prefer textContent or sanitise. §2."

# --------------------------------------------------------- SQL INJECTION
section "SQL injection risk (Critical)"
report "queryRawUnsafe / executeRawUnsafe (raw string queries)" \
  "queryRawUnsafe|executeRawUnsafe" \
  "Unsafe raw queries with user input = SQL injection. Use parameterised/tagged queries or the ORM. §1."
report "SQL keyword next to string building" \
  "(SELECT|INSERT|UPDATE|DELETE|WHERE).*([\$][{]|[\"'][[:space:]]*[+])" \
  "Possible string-built SQL. Confirm it's parameterised, not concatenating request values. §1."

# --------------------------------------------------- MASS ASSIGNMENT
section "Mass assignment (High)"
report "Request body spread straight into a DB write" \
  "(data|values)[[:space:]]*:.*[.][.][.](req[.]body|request[.]body|[ {]body|await[[:space:]]+req[.]json)" \
  "Spreading the request body lets users set fields like role/price/balance. Accept an explicit allow-list of fields. §3."

# --------------------------------------------------------- CORS
section "CORS (High if combined with credentials)"
report "Wildcard or reflected CORS origin" \
  "Access-Control-Allow-Origin.*([*]|req[.]headers[.]origin)" \
  "Don't allow any origin (or reflect the caller's) for authenticated APIs. Allow-list your own domains. references/data-exposure-and-headers.md §4."

# ------------------------------------------------ WEAK PASSWORD HASHING
section "Password hashing (Critical if these hash passwords)"
report "MD5/SHA used near 'password' (too weak for passwords)" \
  "(md5|sha1|createHash[(][\"'](md5|sha1|sha256)).{0,80}password|password.{0,80}(md5|sha1|createHash)" \
  "Passwords need bcrypt/scrypt/Argon2, not MD5/SHA. Confirm and fix. references/access-control-and-auth.md §5."

# ----------------------------------- SIMULATED / FAKE PAYMENT PATHS
section "Simulated / fake / demo code in sensitive paths (Critical)"
# Markers anywhere:
MARKER='simulated|["'\'' ]demo["'\'' ]|mock|fakepayment|fake_payment|placeholder|[^a-z]stub[^a-z]|dummy|"for now"|test.?mode'
# Only alarm loudly when a marker sits in a money/auth/access path. We surface the
# marker hits, then separately point at payment/checkout/membership/auth files to read.
report "Placeholder/simulated markers (check the ones in money/auth code)" \
  "$MARKER" \
  "A 'mock' in a test file is fine; the SAME marker in checkout/membership/auth code means a security control that isn't real -> free goods/memberships. references/payments-and-commerce.md §9. Make a fake path FAIL CLOSED; wiring the real gateway is the owner's decision."
report "Order/payment marked paid without a clear gateway call" \
  "status[[:space:]]*[:=][[:space:]]*[\"'](simulated|demo|test|paid|complete|active)[\"']" \
  "Confirm this status is only ever set AFTER a verified payment (see webhook §3), never optimistically. §9."
SENSITIVE_FILES="$(search "$MARKER" | grep -iE 'checkout|payment|subscribe|membership|tier|billing|order|auth|admin' | cut -d: -f1 | sort -u | head -20 || true)"
if [ -n "$SENSITIVE_FILES" ]; then
  echo ""
  echo "  [i] OPEN THESE — placeholder markers in money/auth/access files (highest priority):"
  printf '%s\n' "$SENSITIVE_FILES" | sed 's/^/        /'
fi

# ---------------------------------------------- FAIL-OPEN CONTROLS
section "Fail-open controls (Critical on a security boundary)"
report "Security control that skips/allows when a key is missing" \
  "if[[:space:]]*[(]![[:space:]]*process[.]env[.][A-Z0-9_]*(SECRET|KEY|TOKEN)" \
  "If a control (CAPTCHA, verify, auth) returns/continues when its key is unset, a misconfig silently removes protection. Make it FAIL CLOSED (deny + log). references/security-principles.md §1."
report "Control gated behind a flag defaulting to disabled/open" \
  "(AGE_GATE|GATE|AUTH|SECURITY|VERIF|PROTECT)[A-Z_]*[[:space:]]*=[[:space:]]*(false|0|\"\")" \
  "A security control hardcoded off waves everyone through. Confirm it defaults SECURE (fail closed). §1."

# ------------------------------------------------------- WEBHOOK HINT
section "Payment webhook (Critical — needs a human read)"
WEBHOOK_FILES="$(search "stripe|webhook" | grep -iE 'route[.](t|j)s|webhook|/api/' | cut -d: -f1 | sort -u | head -20 || true)"
if [ -n "$WEBHOOK_FILES" ]; then
  echo ""
  echo "  [i] Possible webhook/payment files -- OPEN THESE and confirm the signature is"
  echo "      verified against the RAW body (constructEvent / await req.text()), and that"
  echo "      orders are fulfilled ONLY from the verified webhook. This scanner cannot"
  echo "      verify that for you. references/payments-and-commerce.md §3-§4:"
  printf '%s\n' "$WEBHOOK_FILES" | sed 's/^/        /'
fi

# ----------------------------------- THIRD-PARTY SCRIPTS (skimming hint)
section "Third-party scripts on your pages (Magecart/skimming — human read)"
EXT_SCRIPTS="$(search "<script[[:space:]][^>]*src=[\"']https?://" | grep -viE 'localhost|127[.]0[.]0[.]1' | head -20 || true)"
if [ -n "$EXT_SCRIPTS" ]; then
  echo ""
  echo "  [i] External <script> tags load third-party code into your pages. On CHECKOUT and"
  echo "      ACCOUNT pages this is a skimming risk (a compromised vendor can read what customers"
  echo "      type). Confirm each is necessary and trusted, and that a checkout CSP allow-lists"
  echo "      scripts. references/client-side-skimming.md :"
  printf '%s\n' "$EXT_SCRIPTS" | sed 's/^/        /'
fi
CSP_PRESENT="$(search "Content-Security-Policy")"
if [ -z "$CSP_PRESENT" ]; then
  FLAGS=$((FLAGS+1))
  echo ""
  echo "  [!] No Content-Security-Policy found anywhere"
  echo "      -> Without a CSP, an injected or compromised third-party script runs freely. A"
  echo "         checkout script-src allow-list is the strongest skimming defence. Add via"
  echo "         next.config.js headers. references/client-side-skimming.md, data-exposure-and-headers.md."
fi

report "Redirect destination from a URL parameter (open redirect / affiliate click-through)" \
  "redirect[(][^)]*(req[.](query|body)|searchParams[.]get|[^a-z]params[.])" \
  "A redirect target from a user-supplied parameter (common in affiliate links) can disguise a phishing link on your own domain. Redirect only to a fixed allow-list of known targets. references/uploads-and-ssrf.md (open-redirect)."

# --------------------------------------------- AI FEATURES (conditional hint)
section "AI features present? (prompt injection — conditional)"
AI_HINT="$(search "openai|anthropic|@ai-sdk|langchain|generateText|chat[.]completions|createChatCompletion|assistant" | cut -d: -f1 | sort -u | head -15 || true)"
if [ -n "$AI_HINT" ]; then
  echo ""
  echo "  [i] Looks like this site may embed an AI feature. If so, review prompt injection:"
  echo "      map what data/actions the AI can reach, enforce any limits (refund/discount caps)"
  echo "      in CODE not the prompt, and keep secrets/other users' data out of its context."
  echo "      references/ai-feature-security.md :"
  printf '%s\n' "$AI_HINT" | sed 's/^/        /'
else
  echo "  [ok] No obvious AI-feature libraries detected (skip AI review if the site has none)."
fi

# ------------------------------------------------ BACKEND SURFACES
section "Backend surfaces (jobs, logging, GraphQL, XML — human read)"
JOB_FILES="$( { search "cron|/jobs/|scheduled|queue|setInterval" | grep -iE 'route[.](t|j)s|/api/' | cut -d: -f1; \
  find "$ROOT" -type f \( -path '*cron*' -o -path '*/jobs/*' -o -path '*worker*' \) \
    -not -path '*/node_modules/*' -not -path '*/.next/*' 2>/dev/null; } | sort -u | head -12 || true)"
if [ -n "$JOB_FILES" ]; then
  echo ""
  echo "  [i] Possible background-job / cron endpoints — CONFIRM each requires a secret/verified"
  echo "      trigger (else anyone can fire it). references/backend-and-infrastructure.md #43:"
  printf '%s\n' "$JOB_FILES" | sed 's/^/        /'
fi
report "Sensitive data possibly written to logs" \
  "(console[.](log|error|info)|logger[.])[^;]*(password|cvv|card[_-]?number|secret|token|authorization)" \
  "Don't log passwords/cards/tokens/PII — the log store becomes a soft target (and card data is a PCI issue). Redact before logging. references/backend-and-infrastructure.md #46."
report "GraphQL present — check introspection & query limits in production" \
  "graphql|introspection|ApolloServer|makeExecutableSchema" \
  "If GraphQL: disable introspection in prod, add query depth/cost limits, enforce field auth. references/backend-and-infrastructure.md #49."
report "XML parsing / unsafe deserialization (XXE / RCE risk)" \
  "xml2js|libxml|DOMParser|node-serialize|unserialize|[^a-z]eval[(]" \
  "If parsing XML: disable external entities (XXE). Never deserialize untrusted data into live objects. Prefer JSON + validation. references/backend-and-infrastructure.md #50."
report "Personalised page marked publicly cacheable (cross-user leak)" \
  "Cache-Control[^\"']*public" \
  "If an authenticated/personalised route is CDN-cached as 'public', one user's page can be served to another. Mark account/order/cart routes private/no-store. references/backend-and-infrastructure.md #45."

# ----------------------------------------------------- DEPENDENCIES
section "Dependencies"
if [ -f "$ROOT/package.json" ]; then
  if command -v npm >/dev/null 2>&1; then
    echo ""
    echo "  Running 'npm audit' (production) -- reads only, installs nothing:"
    ( cd "$ROOT" && npm audit --omit=dev 2>/dev/null | tail -25 ) || echo "      (npm audit needs a lockfile / installed deps to run fully)"
  else
    echo "  [i] npm not available here -- run 'npm audit' yourself. references/dependencies.md §1."
  fi
  if [ -f "$ROOT/package-lock.json" ] || [ -f "$ROOT/pnpm-lock.yaml" ] || [ -f "$ROOT/yarn.lock" ]; then
    echo "  [ok] Lockfile present."
  else
    echo "  [!] No lockfile found -- commit one and install with 'npm ci'. §3."
  fi
else
  echo "  [i] No package.json at the target root."
fi

# ------------------------------------------------------------- SUMMARY
echo ""
echo "==================================================================="
if [ "$FLAGS" -eq 0 ]; then
  echo " No obvious red flags from the automated patterns."
else
  echo " $FLAGS red-flag categor(y/ies) above need a human look."
fi
cat <<'EOF'

 IMPORTANT: this scan cannot see the most damaging e-commerce flaws --
   - prices/quantities trusted from the browser
   - payment webhooks not verified against the raw body
   - orders fulfilled before payment is confirmed
   - one user able to read another user's data (IDOR)
   - admin API routes with no server-side auth check
   - double-spend races on money/points/stock
   - password-reset / email-change account takeover
   - business-logic abuse (refund-after-ship, points kept on cancel)
   - whether an age gate is actually enforced server-side
 It also can only HINT at simulated/fake payment paths and fail-open
 controls -- the marker might be harmless (a test file) or catastrophic
 (fake checkout). A human must read the flagged money/auth files.

 And it CANNOT see backend configuration that lives in dashboards, not code:
   - whether your database is exposed to the public internet
   - whether the app connects with a least-privilege DB user
   - encryption at rest, and whether backups are tested
   - whether preview/staging deployments leak production data/secrets
 Those are owner checks -- see backend-and-infrastructure.md (Ring 2).
 Do the manual review in checklists/audit-checklist.md for all of these.
===================================================================
EOF
exit 0
