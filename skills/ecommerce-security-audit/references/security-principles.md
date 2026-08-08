# Security principles — the lenses to apply everywhere

These aren't a single check; they're ways of looking that catch flaws the area-by-area list might miss. Apply them across the whole codebase.

## Contents
1. Fail-open vs fail-closed (the single most useful lens)
2. The server must not trust input (the through-line of the whole audit)
3. The interface must tell the truth (claims vs reality)

---

## 1. Fail-open vs fail-closed — "when in doubt, deny" — 🔴 Critical on a security boundary

Every security control — a login check, a CAPTCHA, an age gate, a payment verification, a rate limiter — can end up unable to do its job: a key isn't configured, a service is down, something errors. At that fork the code chooses, often without the builder realising a choice is being made:

- **Fail closed (safe):** if the check can't run, *nobody* gets through.
- **Fail open (dangerous):** if the check can't run, *everybody* gets through.

AI builders lean fail-open constantly, because during development fail-open is *convenient* — it stops the half-built control getting in the way. Then it ships, and a **misconfiguration silently becomes a missing defence**, with no error to alert anyone.

Red flags:
```js
// DANGEROUS: bot protection disables itself if the key is missing
if (!process.env.TURNSTILE_SECRET_KEY) return true;   // "verified" — protection gone
// DANGEROUS: control gated behind a flag that defaults permissive
const AGE_GATE_ENABLED = false;                        // waves everyone through
// DANGEROUS: error handler around a security check that proceeds on failure
try { await verify(token); } catch { /* continue as if it passed */ }
```

**What someone could do:** whatever the control was meant to prevent — create thousands of bot accounts, walk past an age check, reach admin — except they don't even need to *defeat* the control, just for it to be misconfigured, which happens by accident all the time.

**Fix:** invert the failure branch — missing config or an error means **deny**, and make it **loud** (log it, surface it) so a misconfiguration announces itself instead of silently disarming you.

**Caveat for customer-facing controls (payments especially):** failing closed when, say, a payment-verification service is down means blocking checkouts until it recovers — correct for security, but a business moment. Propose fail-closed and explain the trade-off rather than silently imposing it. For clear-cut cases (CAPTCHA disabling itself, an auth check that proceeds on error) it's an unambiguous fix.

**Verify:** with the relevant key unset or the service forced to error, the control **blocks** rather than allows.

This lens underlies several other items — the secrets model, the admin check, "make a fake path fail loudly" all fail closed. Check it *everywhere*, not just where a specific item names it.

---

## 2. The server must not trust input — the through-line

Almost every serious finding in this whole audit is one mistake wearing different clothes: **the server trusting something it should have checked itself.**

- The **price** from the browser (payments §1) — trust the product ID, look the price up server-side.
- The **payment "success" message** (payments §3) — prove it came from Stripe before believing it.
- The **form fields** (injection — mass assignment) — take only the fields you expect, never the raw body.
- The **filename / uploaded file** (uploads) — generate your own name, check the real content.
- The **URL** the server is asked to fetch (SSRF) — decide where the server is willing to go; don't fetch whatever arrives.

If you can name *what the server is trusting from the outside*, you can usually find the fix: **check it, on the server, against a source the user can't control.** One sentence captures the entire audit: *treat everything from outside as untrusted until your own server has checked it.*

---

## 3. The interface must tell the truth — claims vs reality — 🔴 when it hides a money/data/legal gap

A surprising share of these sites' problems is the **UI claiming something the code doesn't do**:

- A checkout that **confirms and credits points without charging** (payments §9).
- An **age gate that says "age verified at checkout"** when nothing verifies it (regulated goods).
- A **returns promise** at checkout with no returns policy or process behind it (legal).
- A **cookie banner** that says it respects the choice while tracking runs regardless (legal).
- Fabricated **reference numbers** shown to customers that match nothing in the admin system.

Whenever the interface asserts that something happened — payment taken, age checked, consent respected, order referenced — **confirm the code actually does it.** A false assurance is worse than silence: it's what makes an incident indefensible. Flag any UI promise the code doesn't deliver, especially around money, age, personal data, and legal rights.
