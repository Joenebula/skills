# Next.js & Vercel specifics

Most AI-built commerce sites land on **Next.js hosted on Vercel** (v0, Cursor, Lovable, Bolt, Replit all lean this way). Next.js blurs the line between code that runs on the server and code that runs in the browser, which is exactly where AI-built sites leak secrets and skip auth checks. This file explains where the risky code lives so the audit looks in the right places. The vulnerabilities themselves are in the topic references — this is a map, not a separate checklist.

## First: which Next.js is it?

- **App Router** — code under `app/`. Uses Server Components, Route Handlers (`app/api/.../route.ts`), Server Actions, and `middleware.ts`. This is the current default and what most recent AI builds produce.
- **Pages Router** — code under `pages/`. Uses API Routes (`pages/api/*.ts`), `getServerSideProps`, `_app`.
- **Plain React + separate API** (Vite/CRA front-end calling an Express/other backend) — the front-end is entirely browser code; **treat everything in it as public** and audit the backend separately.

Identify this first; it determines where server-only code should be.

## The server/client boundary — the #1 source of leaks

The critical question for any file: **does this run on the server or in the browser?** Anything in the browser is public — every secret, key, and "hidden" check in it is visible to visitors.

- **Server Components** (App Router default) run on the server — safe for secrets and DB calls, *unless* the file is marked `'use client'`.
- **`'use client'`** at the top of a file makes it (and what it imports for the browser) client code — **no secrets here.** A frequent AI mistake: a secret or a direct DB call in a `'use client'` component, shipping it to the browser.
- **`NEXT_PUBLIC_` env vars** are deliberately exposed to the browser. Never a secret. See `references/secrets-and-configuration.md` §2 — this is the most common Next.js-specific leak.
- **Route Handlers / API Routes / Server Actions** run on the server — the correct home for secret keys, payment calls, and database access.

**Audit action:** grep for `'use client'` files, then check none of them contain secret keys, direct database access, or the `sk_`/connection-string patterns. Check every `NEXT_PUBLIC_` name isn't actually a secret.

## Server Actions — POST endpoints that look like function calls

Server Actions (`'use server'`) look like ordinary async functions but are really **public HTTP endpoints** the browser can call directly. AI code often assumes "this only runs when the user clicks the button", so it skips auth — but anyone can invoke the action without the UI.

**Audit action:** every Server Action that reads/writes data or does anything privileged must check authentication and authorisation *inside the action itself* (session present? correct role? owns this record?) — exactly as an API route would. Don't rely on the calling page being protected. See `references/access-control-and-auth.md` §2–§3.

## Route Handlers / API Routes — the real API surface

`app/api/.../route.ts` (App Router) and `pages/api/*.ts` (Pages Router) are your public API. Everything in the auth, access-control, injection, and data-exposure references applies here: ownership checks (IDOR), admin checks, parameterised queries, response field allow-lists.

**Pages Router webhook note:** to verify a Stripe webhook you need the *raw* body, so disable the body parser for that route:
```js
export const config = { api: { bodyParser: false } };
```
Then read the raw stream. In App Router use `await req.text()`. See `references/payments-and-commerce.md` §3 — getting this wrong is why webhook verification silently fails.

## Middleware — a gate, not the whole defence

`middleware.ts` runs before requests and is useful as a first line for gating `/admin/*` or redirecting unauthenticated users. But **middleware alone is not sufficient**:

- Its `matcher` config can miss routes, leaving them ungated.
- It typically shouldn't do heavy auth/DB work, so it's a coarse filter.
- **Every data route/action still needs its own server-side check** — defence at the data layer, not just at the edge.

**Audit action:** if middleware gates admin, confirm the matcher actually covers all admin routes *and* that each admin data route/action re-checks the role itself. A common hole: middleware protects the `/admin` *page* but `/api/admin/*` is reachable directly.

## Vercel / serverless specifics

- **Ephemeral filesystem** — serverless functions have a read-only/temporary disk. Don't store uploads or persistent data on it; use Vercel Blob/S3/a database. See `references/injection-and-input-validation.md` §5.
- **Env var scoping** — secrets are set per environment (Production/Preview/Development) in the Vercel dashboard, server-side. Keep live keys out of Preview; use test keys there. See `references/secrets-and-configuration.md` §4.
- **Concurrency** — many function instances run in parallel, so inventory/balance updates must be race-safe (atomic DB updates), not guarded by in-memory variables. See `references/payments-and-commerce.md` §7–§8.
- **HTTPS/HSTS** — Vercel serves HTTPS by default; still set HSTS and the other security headers via `next.config.js`. See `references/data-exposure-and-headers.md` §3.
- **Preview URLs** — preview deployments are real, reachable URLs. If they use live keys or expose an unfinished admin, that's a live exposure — scope keys and protect admin in preview too.

## Where to look, in order (Next.js site)

1. `'use client'` files and `NEXT_PUBLIC_*` — secret leaks to the browser.
2. `app/api/**/route.ts` / `pages/api/**` and Server Actions (`'use server'`) — auth, ownership, injection, over-exposed responses.
3. The webhook route — raw-body signature verification.
4. `middleware.ts` matcher vs the admin data routes — gate coverage.
5. `next.config.js` — security headers.
6. Upload handling and any inventory/balance updates — blob storage, race safety.

This map points you at files; apply the actual checks from the topic references once you're there.
