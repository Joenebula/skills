# Data exposure, headers & privacy

This file covers the ways a site quietly hands out more than it should — APIs returning too much, error messages that leak internals, missing security headers, over-permissive CORS — plus the PII/card-handling and UK GDPR basics that matter for a shop with customers.

## Contents
1. APIs returning too much data (High)
2. Verbose errors / stack traces in production (Medium)
3. Missing security headers (Medium)
4. Over-permissive CORS (High)
5. PII and card-data handling (High/Critical)
6. UK GDPR basics for a shop (owner-facing)

---

## 1. APIs returning too much data — 🟠 High

The endpoint returns whole database records, including fields the client never needs and shouldn't see — password hashes, other users' details, internal flags, admin notes, tokens.

Red flags:
- Returning a full user object (`return user`) that includes `passwordHash`, `resetToken`, `role`, internal IDs.
- A "list" endpoint returning every user/order rather than just the caller's.
- Joins that pull related records belonging to other people.

**What an attacker does:** reads the raw JSON response (visible in browser dev tools → Network) and harvests password hashes or other customers' PII the UI never displays.

**Fix — return only the fields the client needs (an explicit allow-list / select):**
```js
// Prisma: select only safe fields
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }, // never passwordHash, tokens, role
});
```
Shape a response DTO deliberately; don't hand back the database row. Combine with the ownership checks in `references/access-control-and-auth.md` so list endpoints are scoped to the caller.

**Verify:** inspect actual API responses in dev tools. No hashes, tokens, other users' data, or internal-only fields should appear — even if the UI doesn't show them.

---

## 2. Verbose errors / stack traces in production — 🟡 Medium

When something breaks, the site returns the full error, stack trace, or database message to the user. These leak file paths, library versions, query structure, and sometimes secrets — a roadmap for an attacker.

**Fix:** in production, return a generic message ("Something went wrong") with a reference ID, and log the detail server-side only. Ensure the framework is in production mode (Next.js does this automatically on Vercel for the built app, but check custom error handlers and API routes that echo `error.message` or `error.stack` back to the client). Turn off client-visible debug output; don't ship source maps that expose server code.

**Verify:** trigger an error (bad input, wrong ID) and confirm the response is generic, with no stack trace, file paths, or SQL.

---

## 3. Missing security headers — 🟡 Medium

Security headers are instructions to the browser that add layers of protection. They don't fix a specific bug but meaningfully reduce the damage of others (XSS, clickjacking, protocol downgrade). AI sites usually ship none.

Worth setting:
- **Content-Security-Policy (CSP)** — restricts where scripts/styles/images can load from; the strongest defence-in-depth against XSS. Start in report-only mode, then enforce, because a too-strict CSP can break the site — tune it.
- **Strict-Transport-Security (HSTS)** — forces HTTPS.
- **X-Content-Type-Options: nosniff** — stops the browser guessing content types.
- **X-Frame-Options: DENY** (or CSP `frame-ancestors 'none'`) — stops your site being framed for clickjacking.
- **Referrer-Policy: strict-origin-when-cross-origin** — limits URL leakage.
- **Permissions-Policy** — disables device features (camera, mic, geolocation) you don't use.

**Fix (Next.js) — set them once in `next.config.js`:**
```js
// next.config.js
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Add Content-Security-Policy once tuned to the site's real script/style sources
];
module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

**Verify:** load the deployed site, check response headers (dev tools → Network → the document → Headers), or run it through a headers checker. The above should be present; CSP added once tuned.

---

## 4. Over-permissive CORS — 🟠 High

**CORS** controls which *other* websites' JavaScript may call your API. Misconfigured, it lets any site make authenticated requests on your users' behalf.

Red flags:
```js
res.setHeader('Access-Control-Allow-Origin', '*');                 // any site
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);  // reflects any origin
// combined with Access-Control-Allow-Credentials: true → serious
```
Reflecting the caller's origin *and* allowing credentials effectively disables the protection — any malicious site can call your API with the victim's cookies.

**Fix:** allow only the specific origins you control (your own front-end domains) from an allow-list; don't reflect arbitrary origins; only enable credentials for trusted origins. If your front-end and API are the same site (typical for Next.js), you often don't need cross-origin access at all — don't open it.

**Verify:** the API doesn't return `Allow-Origin: *` (or reflect any origin) for authenticated endpoints.

---

## 5. PII and card-data handling — 🟠 High / 🔴 Critical

**Card data (Critical):** as covered in `references/payments-and-commerce.md` §6 — raw card numbers/CVV must never touch your server, logs, or database; use the processor's hosted/embedded fields so you only ever hold a token. Storing CVV is prohibited. If any card field reaches your backend, that's Critical.

**Personal data (PII) — names, emails, addresses, order history, phone numbers:**
- **Collect only what you need**, keep it only as long as you need it.
- **Don't log PII** in plaintext application logs (especially not alongside anything sensitive).
- **Encrypt in transit** (HTTPS everywhere — Vercel gives this) and rely on your database provider's encryption at rest.
- **Limit who/what can read it** — the access-control checks in the auth reference are what stop PII leaking between customers.
- **Don't expose PII in URLs** (they end up in logs, browser history, referrer headers) — use POST bodies / authenticated lookups.

**Verify:** logs contain no card data and no bulk PII; card fields never reach the server; PII endpoints are access-controlled.

---

## 6. UK GDPR basics for a shop — owner-facing

The owner is UK-based, so UK GDPR / Data Protection Act 2018 applies to customer data. This isn't code, but it's part of "not getting the data stolen / staying compliant", so include it as owner to-dos when a site handles customer data. Keep it practical, and note you're flagging obligations, not giving legal advice:

- [ ] **Privacy policy** explaining what data you collect, why, and how long you keep it.
- [ ] **Lawful basis** for processing (for orders, usually "contract"; for marketing, "consent").
- [ ] **Consent for marketing** — no pre-ticked boxes; separate opt-in for marketing emails.
- [ ] **Data-subject rights** — a route for customers to request access to or deletion of their data.
- [ ] **Cookie/consent banner** if you use analytics or non-essential cookies.
- [ ] **Breach plan** — UK GDPR requires reporting certain personal-data breaches to the ICO within 72 hours; know who does that. (An IDOR leaking customer data, for instance, can be a reportable breach.)
- [ ] **Data minimisation** — don't store card numbers (the processor does); don't collect data you won't use.

Recommend the owner confirm specifics with the ICO's guidance or a professional — this is a checklist to raise awareness, not legal advice.

---

## Quick triage for a data-exposure review

1. Do API responses include hashes, tokens, or other users' data? — §1
2. Do production errors leak stack traces / paths / SQL? — §2
3. Are the core security headers set? — §3
4. Is CORS locked to your own origins (not `*`/reflected)? — §4
5. Does any card data or bulk PII reach the server or logs? — §5

§1 and §5 are where customer data actually escapes. Headers and errors (§2–§3) are quick, cheap hardening worth doing before launch.
