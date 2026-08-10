# Access control & authentication

This is the second place serious damage lives on an e-commerce site: the admin area, and whether one customer can reach another customer's data or an admin-only action. "Broken access control" is the number-one category on the OWASP Top 10 for a reason — it's easy to get wrong and devastating when wrong.

The core question for every protected page and every API route: **does the server check, on every request, that *this specific user* is allowed to do *this specific thing* — or is it relying on the browser to hide a button?** Hiding a button in the UI is not security; the request still exists and anyone can send it.

## Contents
1. Broken object-level access / IDOR (Critical)
2. Admin area protected only in the UI (Critical)
3. Authenticated but not authorised (High)
4. Weak or missing session / JWT handling (High)
5. Bad password storage (Critical)
6. No rate limiting on login / reset (High)
7. Default or hardcoded credentials (Critical)
8. Account recovery & email-change hijack (Critical)
9. Abuse & rate limiting beyond login (High)
10. Account enumeration (Medium)

---

## 1. Broken object-level access (IDOR) — 🔴 Critical

**IDOR** = Insecure Direct Object Reference. An endpoint takes an ID and returns the record for that ID *without checking the record belongs to the person asking*. Change the ID, see someone else's data.

Red flag — the query uses the ID from the URL but not the current user:
```js
// DANGEROUS: any logged-in user can read any order
export async function GET(req, { params }) {
  const order = await db.order.findUnique({ where: { id: params.id } });
  return Response.json(order);
}
```

**Plain English for the owner:** any logged-in customer can view *other* customers' orders — names, addresses, what they bought, sometimes partial payment info — just by changing the number in the web address. This is a data breach, and under UK GDPR it's reportable.

**Fix — scope every lookup to the current user (or require an admin):**
```js
export async function GET(req, { params }) {
  const session = await getSession(req);
  if (!session) return new Response('Unauthorised', { status: 401 });
  const order = await db.order.findFirst({
    where: { id: params.id, userId: session.user.id }, // ownership enforced in the query
  });
  if (!order) return new Response('Not found', { status: 404 });
  return Response.json(order);
}
```
Do this for **every** endpoint that takes an ID: orders, addresses, invoices, downloads, user profiles, uploaded files. Admins may legitimately bypass the ownership filter — but only after an explicit `isAdmin` check.

**Verify:** log in as customer A, note the ID of A's order, then as customer B request A's ID. B must get 404/403, never A's data.

---

## 2. Admin area protected only in the UI — 🔴 Critical

The admin pages are hidden from normal users in the front-end (the menu link doesn't show, or a React check hides the page), but the **admin API routes themselves have no server-side check**. Anyone who knows or guesses the URL — `/admin`, `/api/admin/orders`, `/dashboard` — can hit them directly.

**What an attacker does:** navigates straight to the admin API, reads all orders and customers, changes prices, issues refunds to themselves, or deletes data. Full shop compromise.

**Fix — enforce admin on the server, at the route/data layer, not just in the page:**
```js
// Every admin route handler / server action starts with this
const session = await getSession(req);
if (!session || session.user.role !== 'admin') {
  return new Response('Forbidden', { status: 403 });
}
```
In Next.js, middleware can gate `/admin/*` as a first line, but middleware alone is not enough — **each admin data route still needs its own check**, because APIs can be called without ever loading a page. See `references/nextjs-and-vercel-notes.md`.

**Verify:** while logged out (or as a normal customer), request an admin API route directly (browser address bar or curl). It must return 401/403, not data.

---

## 3. Authenticated but not authorised — 🟠 High

A subtler version of §2: the route checks the user is *logged in*, but not that they have the *right* to this action. So any customer can call an "admin" or "other user" action simply because they have an account.

Example: `/api/user/[id]/make-admin` checks for a session but not that the caller is already an admin — so any user promotes themselves. Or an "edit order status" route any logged-in user can call.

**Fix:** separate authentication (are you logged in?) from authorisation (are you allowed to do *this*?). Check role/ownership on every sensitive action, not just presence of a session.

**Verify:** as a normal customer, call a privileged action. It must be refused.

---

## 4. Weak or missing session / JWT handling — 🟠 High

If the site uses tokens (often a **JWT** — a signed string that proves who you are) or cookies for login, common problems:

- **Weak or hardcoded signing secret** — a short/guessable/committed JWT secret lets an attacker forge a token and become anyone, including admin. Fix: a long random secret from an env var; rotate if it was ever committed.
- **`alg: none` accepted / algorithm not pinned** — some libraries accept an unsigned token if told to. Pin the algorithm (e.g. HS256/RS256) on verify.
- **No expiry** — tokens valid forever; a leaked one never dies. Fix: short expiry plus refresh.
- **Sensitive data in the token** — JWT contents are readable by anyone (only *tamper-proof*, not secret). Don't put anything private in there.
- **Cookies not hardened** — session cookies should be `HttpOnly` (JavaScript can't read them, blunting XSS theft), `Secure` (HTTPS only), and `SameSite=Lax`/`Strict` (blunts cross-site request forgery). Fix: set all three.
- **Roll your own auth** — hand-built login/session is a frequent source of holes. Prefer a vetted library (NextAuth/Auth.js, Clerk, Lucia, Supabase Auth) over bespoke code.

**Verify:** confirm the signing secret isn't in the repo, tokens expire, and session cookies carry HttpOnly+Secure+SameSite (visible in browser dev tools → Application → Cookies).

---

## 5. Bad password storage — 🔴 Critical (if the site stores passwords)

If the site manages its own passwords, they must be **hashed with a slow, salted algorithm** — bcrypt, scrypt, or Argon2. Storing plaintext, or hashing with MD5/SHA-1/plain SHA-256, means a database leak exposes every customer's password (and people reuse passwords everywhere).

Red flags: passwords stored as-is; `md5(password)`; `crypto.createHash('sha256')` used for passwords; a `password` column that's human-readable.

**Fix:** bcrypt (cost ≥ 12) or Argon2id; store only the hash; never log passwords.
```js
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);       // on signup
const ok = await bcrypt.compare(attempt, storedHash); // on login
```
Or sidestep it entirely with a managed auth provider so you never store passwords at all.

**Verify:** inspect the user table — the password column must be an unreadable bcrypt/Argon2 hash (bcrypt starts `$2a$`/`$2b$`), never readable text or a short hex digest.

---

## 6. No rate limiting on login / password reset — 🟠 High

With no limit on login attempts, attackers brute-force passwords or run "credential stuffing" (trying leaked email+password pairs) at speed. Same for password-reset and OTP endpoints.

**Fix:** rate-limit login, signup, password-reset, and OTP by IP and by account. On Vercel the common pattern is Upstash rate-limiting; any store works. Add small lockouts/backoff after repeated failures, and consider CAPTCHA on repeated failures. Don't reveal whether the *email* or the *password* was wrong (that confirms which accounts exist).

**Verify:** hammer the login endpoint; after a handful of failures it should start refusing/slowing.

---

## 7. Default or hardcoded credentials — 🔴 Critical

An admin account with a default password (`admin`/`admin`, `test`/`test`), or credentials hardcoded in the source, is game over. AI scaffolds sometimes seed a demo admin.

**Fix:** remove seeded/demo accounts before launch; force a strong unique admin password; enable 2FA on admin if available. Never hardcode credentials in source.

**Verify:** confirm no default/demo admin remains and no credentials are in the code.

---

## Quick triage order for an auth/admin review

1. Can one user reach another user's data by changing an ID? — §1
2. Are admin *routes* (not just pages) checked server-side? — §2
3. Do sensitive actions check *permission*, not just *login*? — §3
4. Are passwords hashed with bcrypt/Argon2 (or not stored at all)? — §5
5. Is login rate-limited, and are there any default admin creds? — §6, §7

§1 and §2 are the ones most likely to leak your customers' data or hand over the shop. Start there.

---

## 8. Account recovery & email-change hijack — 🔴 Critical

Items 1 and 6 cover storing and guessing passwords. This covers **going around** the password — the "forgot password" and "change email" flows, which exist precisely to let someone in *without* the current password, and are therefore the easiest door to a takeover if built carelessly. Guard them at least as hard as login.

**Password reset abuse.** The dangers, each 🔴 if present:
- Token that **doesn't expire** — a link leaked or logged months ago still works.
- Token that's **guessable** rather than long and random.
- Token **not tied to one account** — used to reset someone else's password.
- Token **reusable** after use, or reset that doesn't invalidate old sessions.
- A reset endpoint **triggerable for any email** with any of the above.

**Email-change — the quiet hijack.** If a logged-in session can change the account email **without re-entering the current password** and **without verifying the new address**, then anyone with a moment at a logged-in screen (shared computer, hijacked session, an XSS from the injection reference) swaps the email to their own — and now *they* own the account, because all future resets go to *their* inbox. The original owner is locked out silently.

```js
// DANGEROUS: email changed with no re-auth and no verification of the new address
await prisma.user.update({ where: { id: session.userId }, data: { email: req.body.email } });
```

**Recovery must respect 2FA.** If you add customer 2FA but reset doesn't require the second factor, reset becomes the way to skip 2FA entirely.

**What an attacker could do:** take over customer accounts — read order history and addresses, place orders, drain points; for a trade account, reach confidential wholesale pricing.

**Fix (auth flow — propose first, don't auto-rewrite):** reset tokens must be long, random, single-use, account-scoped, and short-lived; changing email or password must require re-authentication; a new email must be verified before it takes effect; notify the *old* address on change so a hijack isn't silent; recovery must respect 2FA. If the site uses a managed auth provider (e.g. Supabase), much of this is configuration — check it's set safely rather than assuming the provider handles it.

**Verify:** an expired or already-used reset link is rejected; a reset link for account A cannot set account B's password; changing the email prompts for the current password and confirms the new address; the old address receives a change notification.

**Note the functional-vs-security distinction:** a reset flow being *broken* (no landing page, link goes nowhere) is a functional bug, out of this skill's scope. Whether reset can be *abused to take over an account* is the security question — that's this item.

---

## 9. Abuse & rate limiting beyond login — 🟠 High (broadens item 6)

Item 6 covered rate-limiting *login*. That's too narrow — the real risk is **any expensive or abusable endpoint with no throttle**. Read every public endpoint and ask "what happens if someone calls this 10,000 times fast?"

- **Card testing — the costly e-commerce one.** Fraudsters use your checkout to test stolen card numbers in bulk (tiny auth attempts to see which cards work). This racks up processor fees and can get your payment account flagged or suspended. 🔴 impact if your checkout allows rapid repeated payment attempts.
- **Scraping** your full catalogue and pricing (competitors), or hammering an expensive search/filter endpoint (cost + slowdown).
- **Enumeration and brute force** on any ID, code, or token endpoint (gift-card balance checks, coupon validation, order-status lookups).
- **Inbox/SMS bombing** — an endpoint that sends email/SMS (password reset, "notify me", contact) with no throttle can be abused to spam a victim using your shop as the weapon.

**Fix:** rate-limit by IP and by account on sensitive/expensive endpoints; add short delays or CAPTCHAs on abuse-prone actions; cap or debounce email/SMS-sending endpoints.

**Owner action (fraud tools):** your payment provider's fraud tooling — **Stripe Radar** or PayPal's equivalent — is part of the card-testing defence and is configured in their dashboard, not your code. List it as an owner to-do: turn on and tune the provider's fraud rules.

**Verify:** rapid repeated calls to a sensitive endpoint get throttled/blocked; a burst of payment attempts is rate-limited; the provider's fraud rules are enabled.

---

## 10. Account enumeration — 🟡 Medium

A privacy leak: if login, signup, or password-reset responds **differently for "this email has an account" vs "it doesn't"** — a different message, a different response time, a different status — an attacker can check a list of stolen emails against your shop to learn which ones have accounts, then target those customers with convincing phishing ("your RumbaClaat order…").

Red flags: "No account with that email" vs "Wrong password" (distinguishes existence); signup saying "email already registered"; reset saying "sent" for real accounts but erroring for unknown ones.

**Fix:** make these responses **identical whether or not the account exists** — e.g. reset always says "if that email has an account, we've sent a link"; login gives one generic "email or password is incorrect"; signup handles "already registered" without confirming it to an attacker (e.g. send a "you already have an account" *email* rather than showing it on screen).

**Verify:** the response (text, status, and roughly timing) for a known vs unknown email is indistinguishable on login, signup, and reset.
