# Injection & input validation

"Injection" is when user-supplied text gets treated as *code or commands* instead of *data* — because the code glued the input directly into a query, a page, or a command. The fix is almost always the same idea: keep data as data, use the safe interface the tool provides, and validate input on the server. This file covers the injection types that hit e-commerce sites, plus mass assignment and file uploads.

## Contents
1. SQL injection (Critical)
2. Cross-site scripting / XSS (High)
3. Mass assignment (High)
4. No server-side validation (High)
5. File upload flaws (High)
6. SSRF — server-side request forgery (Medium)
7. Command injection (Critical, rarer)

---

## 1. SQL injection — 🔴 Critical

The database query is built by gluing user input into a string. An attacker sends input containing SQL and it runs against your database.

Red flag — string concatenation / interpolation into a query:
```js
// DANGEROUS
db.query("SELECT * FROM users WHERE email = '" + email + "'");
db.query(`SELECT * FROM orders WHERE id = ${req.query.id}`);
```
Input like `' OR '1'='1` turns the query into something that matches everything; more advanced payloads dump or destroy data.

**What an attacker does:** reads every user and order, extracts password hashes, or drops tables. Full database breach.

**Fix — use parameterised queries or an ORM, so input is always data:**
```js
// Parameterised (driver escapes the value)
db.query('SELECT * FROM users WHERE email = $1', [email]);

// ORM (Prisma) — safe by construction
db.user.findUnique({ where: { email } });
```
If using Prisma raw queries, the tagged-template form `prisma.$queryRaw\`... ${x}\`` is parameterised and safe; `prisma.$queryRawUnsafe(string)` is **not** — treat any `Unsafe`/string-built raw query as a red flag.

**Verify:** the codebase builds queries with parameters/ORM, never by concatenating request values. The scan script flags string-built SQL and `queryRawUnsafe`.

---

## 2. Cross-site scripting (XSS) — 🟠 High

User-supplied content is rendered into a page as HTML, so an attacker's `<script>` runs in other users' browsers — stealing sessions, rewriting the page, or (on a shop) skimming card data entered on the page.

React escapes text by default, which prevents most XSS — **until** someone uses `dangerouslySetInnerHTML` (or an equivalent) with unsanitised content. That's the thing to hunt for.

Red flags:
```jsx
<div dangerouslySetInnerHTML={{ __html: userSuppliedContent }} />   // DANGEROUS
element.innerHTML = userInput;                                       // DANGEROUS (vanilla JS)
```
Common on product reviews, descriptions, seller/store bios, support messages, or anything markdown/HTML rendered from users.

**Fix:**
- Prefer rendering as **text**, not HTML (`{content}` in JSX escapes it).
- If HTML is genuinely needed (rich text), **sanitise** it first with a vetted library (DOMPurify) and allow only a safe subset of tags.
```jsx
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```
- A strong **Content-Security-Policy** header is a valuable second layer (see `references/data-exposure-and-headers.md`).

**Verify:** every `dangerouslySetInnerHTML`/`innerHTML` either renders trusted-only content or passes through sanitisation. Try entering `<img src=x onerror=alert(1)>` into a review/description; it must render inert, not execute.

---

## 3. Mass assignment — 🟠 High

The server takes the whole request body and writes it straight into the database, so a user can set fields they shouldn't — like `role: "admin"`, `isVerified: true`, `price`, or `balance`.

Red flag — spreading the request body into a create/update:
```js
// DANGEROUS: user controls every column, including role
await db.user.update({ where: { id }, data: { ...req.body } });
await db.user.create({ data: req.body });
```

**What an attacker does:** adds `"role":"admin"` (or `"balance":100000`) to a normal profile-update request and grants themselves privileges or money.

**Fix — accept only an explicit allow-list of fields:**
```js
const { name, email } = req.body;               // only what the user may change
await db.user.update({ where: { id }, data: { name, email } });
```
Never let the client decide privilege, price, balance, ownership, or verification fields — set those server-side.

**Verify:** update endpoints pick specific fields, not `...req.body`. Try sending an extra `"role":"admin"` field; it must be ignored.

---

## 4. No server-side validation — 🟠 High

Validation done only in the browser (required fields, formats, min/max) is trivially bypassed — the attacker skips the form and calls the API directly. If the server doesn't re-validate, it accepts anything: malformed data, oversized payloads, out-of-range numbers, wrong types.

**Fix:** validate and sanitise **on the server** for every endpoint — type, format, length, range, allowed values. A schema validator (Zod, Yup, Valibot) makes this reliable and readable:
```js
const schema = z.object({
  email: z.string().email(),
  quantity: z.number().int().positive().max(100),
});
const data = schema.parse(await req.json()); // throws on bad input
```
Client validation stays for UX, but the server is the authority.

**Verify:** bypass the form (curl/dev tools) and send invalid data; the server must reject it.

---

## 5. File upload flaws — 🟠 High

If the site accepts uploads (product images, avatars, review photos), common holes:
- **No type/size limits** — huge files, or non-images, get through. Fix: validate MIME type *and* extension, cap size, ideally re-encode images server-side.
- **Attacker-controlled filenames / path traversal** — a name like `../../something` writes outside the intended folder. Fix: generate your own random filename; never trust the client's.
- **Executable content served back** — an uploaded HTML/SVG/script served from your domain can run in visitors' browsers (a form of XSS). Fix: store uploads on separate blob storage, serve with correct non-executable content types, and don't serve user SVGs inline.
- **Storing on the serverless filesystem** — on Vercel the filesystem is ephemeral and read-only in places; uploads belong in blob/object storage (Vercel Blob, S3, Cloudinary), not the function's disk.

**Verify:** try uploading a non-image and an oversized file; both should be rejected. Confirm stored filenames are server-generated and uploads live in blob storage.

---

## 6. SSRF — server-side request forgery — 🟡 Medium

If your server fetches a URL supplied by the user (an "import from URL" feature, an image proxy, a user-set webhook), an attacker can point it at internal addresses (cloud metadata endpoints, internal services) to pull secrets or reach things not meant to be public.

**Fix:** only fetch user-supplied URLs if you must; then allow-list the domains/schemes, block private/internal IP ranges and metadata addresses, and disable redirects to them. If you're only fetching your own known services, don't accept a URL from the user at all.

**Verify:** the app doesn't fetch arbitrary user URLs, or does so only against an allow-list.

---

## 7. Command injection — 🔴 Critical (rarer on these sites)

If the server runs a shell command built with user input (image processing via a CLI, calling out to system tools), injected input can run arbitrary commands on the server.

Red flag: `exec('convert ' + userInput)` / passing user input into a shell string.

**Fix:** avoid shelling out; use a library instead. If you must run a command, use the argument-array form that doesn't invoke a shell (`execFile('convert', [safeArg])`) and validate inputs strictly. Never build a shell string from user input.

**Verify:** no shell commands are built from request data.

---

## Quick triage for an injection/input review

1. Are DB queries parameterised / ORM, never string-built? — §1
2. Any `dangerouslySetInnerHTML`/`innerHTML` with unsanitised user content? — §2
3. Any `...req.body` written into the database? — §3
4. Is input validated server-side, not just in the browser? — §4
5. Are uploads type/size-checked, renamed, and stored off the function disk? — §5

§1 and §3 tend to be the fastest routes to a database breach or privilege escalation. Start there.
