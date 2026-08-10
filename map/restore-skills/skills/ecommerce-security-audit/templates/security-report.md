# Security report template

Fill this in for the owner. Obey the six reporting rules: plain-English first, step-by-step, every finding rated, secrets model stated, owner 2FA surfaced, honest about reach. Delete guidance in (parentheses) as you go. Keep it calm and specific — doom helps no one.

---

# Security review — {site name}

**Date:** {date}
**What I looked at:** {repo / pages / scope}
**What this is:** a review of your site's code for security holes, in plain English, with fixes.

## The honest headline (read this first)
(2–4 sentences: overall state, how many Critical items, and the single most important thing to do today. Then the standing caveat:)
This review reliably catches the common, high-impact flaws — but it is **not a full penetration test**, and it can't see inside your GitHub/Vercel/Stripe accounts. For anything outside the code I've given you steps. For a shop taking real money, a professional pentest is still worth doing before you scale — this makes that cheaper, it doesn't replace it.

---

## 🔴 Critical — do not go live until these are fixed
(For EACH finding, use this shape. Plain-English block first; the developer detail is a separate, clearly-marked box underneath.)

### C1. {Plain title — e.g. "Card checkout takes no money but creates real orders"}
- **What it is:** {plain English, no jargon}
- **What someone could do:** {a concrete scenario — "any customer can check out with Card and receive a real, fulfillable order and loyalty points without paying"}
- **Status:** {✅ Fixed for you  /  ⏳ Proposed — needs your OK (money/auth code)  /  🔧 Needs a decision from you}
- **What only you can do (if anything):** {numbered steps — rotate a key, set a Vercel variable, decide disable-vs-wire}
- **How you'll know it's fixed:** {the concrete check — "checking out with Card no longer creates a paid order"}

> **Developer detail (skip if you don't read code):** {file:line, the pattern, the exact fix, commit ref}

(Repeat C2, C3…)

---

## 🟠 High — fix before real traffic
(Same shape, briefer.)

## 🟡 Medium — fix soon
(Same shape, brief.)

## ⚪ Low / hardening — worth doing
(One line each is fine.)

---

## Things only you can do (outside the code)
(Ring 2 — numbered, plain. Always include 2FA even if nothing else.)

1. **Turn on two-factor authentication (2FA)** on GitHub, Vercel, and Stripe. I can't see whether it's on, so I'm treating it as **off until you confirm** — this is the single most valuable thing on this list. {steps}
2. **Rotate any leaked keys** listed above — removing them isn't enough, they must be regenerated: {steps}
3. **Keep secrets in `.env.local` and Vercel only** — never in the code or the repo.
4. **Never log in via a link in an email** — type the address or use a bookmark.
5. **After fixes: push, let Vercel deploy, and re-check** — a fix isn't real until it's live.

**Secrets, the rule:** a secret key belongs only on your computer (`.env.local`) and in Vercel's settings — never in the code, the repository, git history, or the browser. If one is found in the wrong place, it's removed **and** must be regenerated (assume it was already copied).

*Awareness (not urgent):* you currently have no way to tell if you've been breached (no logging) — worth adding a basic error/logging service. And make sure customer/order data is backed up offsite.

---

## Decisions & outside help (Ring 3)
(Only include what applies. These need your judgement or a human professional — I flag them, I don't certify them.)

- **Age verification (regulated goods):** {state of the gate in code}; whether your *method* is legally sufficient is a question for your licensing authority — not something I can certify.
- **Legal pages / company details / returns / cookies:** {gaps found}. I flag what's missing or inconsistent; making the content legally correct is a job for a human — worth an hour with someone who does UK e-commerce law before launch.
- **Customer 2FA:** {recommendation} — a business trade-off, your call. (Distinct from your own 2FA above.)
- **Third-party tools:** {list}; keep this short — I can't vouch for someone else's service.
- **Pentest:** recommended before you're taking serious money.

---

## Keeping it secure over time (automation)
(Offer the three layers.)
An audit is a snapshot — your site is clean today, not three changes from now. I can set up:
1. A **pre-upload check** on your computer that blocks you from ever committing a secret.
2. A **weekly + on-every-change GitHub check** that **emails you** if something's caught.
3. This **deep review**, run before a launch or whenever the above flags something.

Want me to generate 1 and 2? They're a one-time setup and I'll give you plain steps.

---

## Before / after
| Finding | Was | Now |
|---|---|---|
| {C1} | 🔴 Critical | ✅ Fixed |
| {C2} | 🔴 Critical | ⏳ Awaiting your OK |
