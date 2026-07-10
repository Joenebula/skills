---
name: project-setup
description: Use when standing up or onboarding to a GitHub + Supabase + Vercel + Next.js web app — gives you the bootstrap order, where every API key goes, and how to boot locally first with zero keys before wiring any service.
---

# Project setup — first-time wiring (local-first)

## Read this first — the one truth

**Get it running LOCALLY first, with zero keys. Then wire one service at a time.**

This stack is built so every external dependency **degrades gracefully**: an `isConfigured` guard makes each service optional, so a missing key never blocks boot. You will see the whole app working — on a bundled demo/fixture fallback — *before* you create a single account. Only after that do you connect GitHub, then Supabase, then Vercel, each in its own step, verifying as you go.

This skill covers **first-time wiring only**. The repeatable verify → gate → ship → confirm release loop lives in [[releasing]] — once you're set up, that's the lane you live in.

The phases, in order:

0. Run it locally (no accounts, no keys)
1. Source control — GitHub
2. Database & auth — Supabase
3. Wire local env — `.env.local`
4. Hosting & deploy — Vercel
5. Verify it's live

---

> ## HARD RULE — secret hygiene (non-negotiable)
> - **`.env.local` holds your real keys, is gitignored, and is NEVER committed.** It exists only on your machine.
> - **Commit a `.env.local.example` template** — variable names with blank values — so the next person knows exactly what to fill. Update it whenever you add a key.
> - **A service-role / secret key is a master password.** It is **server-only**, **NEVER** prefixed `NEXT_PUBLIC_`, and never shipped to the browser. Public keys (`NEXT_PUBLIC_*`) are safe in the browser *by design* — that's what the prefix means.
> - **If a secret ever lands in git history or the browser bundle, rotate it immediately** (revoke + reissue in the provider's dashboard, then update `.env.local` and the host). A leaked secret is compromised the moment it's exposed, even if you delete the commit. (Ties to the security gating in [[engineering-standards]].)

---

## Step 0 — Run it locally first (before creating ANY account)

You do not need GitHub, Supabase, or Vercel to see the app run. Do this first so you have a known-good baseline.

1. Open a terminal in the project root.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser.

It boots with **zero keys** via a bundled demo/fixture fallback. You can click through pages and see real layout and content.

**Expected in demo mode:** no database writes, no real auth/sign-in. That's correct — there's no Supabase yet. You're confirming the app *renders and runs* before wiring anything. If `npm run dev` fails here, fix that before going further (it's an environment/install problem, not a keys problem).

---

## Step 1 — Source control (GitHub)

This is what your host deploys from. Create a **private** repo and push your code.

**With GitHub Desktop (no command line):**
1. GitHub Desktop → **File → Add local repository** → pick the project folder.
2. **Publish repository** → name it `<your-app>` → tick **Keep this code private** → **Publish**.

**With the CLI:**
1. On **GitHub.com → New repository**. Name it `<your-app>`, choose **Private**, do **not** add a README/.gitignore (the project already has them). Create.
2. Connect and push:
   ```
   git remote add origin https://github.com/<you>/<your-app>.git
   git push -u origin main
   ```

Confirm the files appear on GitHub. Vercel (Step 4) imports from here.

---

## Step 2 — Database & auth (Supabase)

1. Create a free account at **supabase.com** → **New project**.
   - Name it `<your-app>`.
   - Pick a **region near your users** (lower latency).
   - **SAVE the database password** somewhere safe — you can't see it again, and you'll need it for direct DB access.
2. Go to **Project Settings → API** and copy **three** values:

   | In Supabase | Goes into env var |
   |---|---|
   | **Project URL** (`https://<project-ref>.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon / public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

   The `<project-ref>` is the subdomain in the Project URL — you'll reuse it below.

3. **Apply your schema.** Open the Supabase **SQL editor** and run your migration files **in order, lowest-numbered first** (`0001_…`, `0002_…`, …), then your **seed**. Paste each file's contents, run, confirm success, move to the next.
   - Your migrations and seed should be **idempotent** (safe to re-run) and **non-destructive** — do **not** uncomment any "wipe"/`DROP`/`TRUNCATE` block that may be present for a clean reset.

   > ### GOTCHAS — call these out before you run
   > - **Enum migration runs alone.** A migration containing `ALTER TYPE … ADD VALUE` (adding an enum value) **must run on its own, outside a transaction** — Postgres won't let a new enum value be used in the same transaction it's added. Run that file by itself.
   > - **Set YOUR email in the admin-bootstrap migration first.** Before running the migration that bootstraps the first admin, edit it so **your** email is the seeded admin (or set the env allowlist your project uses for this). Then you become admin on first sign-in. Get this wrong and no one can administer the app.

4. *(Optional)* Generate typed DB bindings:
   ```
   supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
   ```

When unsure of migration order, or whether a step is destructive, **stop and check — do not guess** (see [[ask-dont-guess]]).

---

## Step 3 — Wire local env (`.env.local`)

1. Copy the template:
   ```
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and paste the three Supabase values from Step 2:
   - `NEXT_PUBLIC_SUPABASE_URL=` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` → anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY=` → service_role secret
3. Set:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. **Restart `npm run dev`** (env changes are read at startup, not hot-reloaded).

Now the app runs against your **live database**, auth works (sign in with the email you bootstrapped), and you're **admin**. Everything else in `.env.local.example` is optional — leave blanks blank for now (see the key map below and `references/optional-services.md`).

---

## Step 4 — Hosting & deploy (Vercel)

1. Log into **vercel.com** → **Add New → Project** → **Import** your GitHub repo. Vercel **auto-detects Next.js** — accept the defaults.
2. Open **Project Settings → Environment Variables** and add **EVERY** variable (public **and** server-only) for **Production** (and **Preview**, so preview deploys work too):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`  ← the **production** URL, not localhost
   - any optional-service keys you've enabled (see `references/optional-services.md`)
3. **Deploy.** After this, Vercel **auto-deploys on every push to `main`**.
4. **Settings → Domains:** add `your-domain.com`. Pick a **canonical** host (apex `your-domain.com` *or* `www.your-domain.com`) and **301-redirect** the other to it. Details in `references/go-live.md`.

---

## Step 5 — Verify it's live

**Locally, before you deploy** — catch errors on your machine, not in production:
```
npm run typecheck
npm run build
```
Watch the **real exit code** — a build can print warnings and still fail, or fail and scroll past. Green both = safe to deploy.

**After deploy — live smoke pass:**
- Key pages load on `https://your-domain.com`.
- An API route answers (not a 500).
- Auth works end-to-end: request a magic link / sign-in email, click it, land signed-in.

**"Pushed" ≠ "live."** Confirm the *new* build is the one actually serving (check the deployment hash/timestamp in Vercel), not a stale cache. This verification pairs with [[regression-testing]]; the full release discipline is [[releasing]].

---

> ## THE ENV MODEL — two gotchas that bite everyone
> 1. **`NEXT_PUBLIC_*` are inlined into the browser bundle at BUILD time** — not read at runtime. So the **build** must have the correct **production** public values, and changing one requires a **rebuild/redeploy** to take effect.
> 2. **Server-only secrets are read at RUNTIME** from the host's secure env (Vercel's encrypted store). They are never bundled and never exposed to the browser.
>
> **Which keys block boot:** only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are needed to leave demo mode. Everything else is **optional and graceful** — a missing key disables just that one feature.

---

## The API-key / secrets map (core)

| Variable | Public/Secret | Where to get it | Where it goes | Without it |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase → Settings → API → Project URL | `.env.local` + Vercel (Prod+Preview) | App stays in demo mode (no DB) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → Settings → API → anon/public | `.env.local` + Vercel (Prod+Preview) | App stays in demo mode (no auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → Settings → API → service_role | `.env.local` + Vercel (Prod+Preview) — **server-only** | Admin/server-side privileged operations fail |
| `NEXT_PUBLIC_SITE_URL` | Public | You set it (`http://localhost:3000` dev / `https://your-domain.com` prod) | `.env.local` + Vercel | Canonical URLs, sitemap, OG, email links break |
| *captcha / email / cron / data-APIs* | mixed | — | — | See `references/optional-services.md` (e.g. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` + `EMAIL_FROM`, `CRON_SECRET`) — each is optional and degrades gracefully |

> **Never print a secret VALUE** anywhere — in code, logs, commits, or chat. Only variable **names** and how to obtain them. The names above are stack conventions, not secrets.

---

## Where to go next

- **Optional services** (captcha, transactional email, cron jobs, external data APIs) → `references/optional-services.md`
- **Going live + soft-launch / feature flags** (domains, canonical redirect, gating a public launch) → `references/go-live.md`
- **A non-Vercel host** (self-hosting the Next.js app) → `references/self-hosting.md`

## Cross-links

- [[releasing]] — the repeatable release loop (verify → gate → ship → confirm; authorized deploys; exit codes). This skill is first-time wiring only; that one is every release after.
- [[engineering-standards]] — security gating, secret handling, code quality bars.
- [[regression-testing]] — proving "it still works", not just "it compiles", before and after deploy.
- [[ask-dont-guess]] — when migration order, a destructive step, or a key's destination is unclear, stop and confirm.
- [[design-system]] — build UI from documented tokens/components once the app is wired.

---

**Keep this current:** when the stack or its keys change, update **this skill and `.env.local.example` together** — they must always agree on the variable set.
