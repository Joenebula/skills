# Self-hosting the build (non-Vercel: cPanel / Node host / VPS)

Same app, hosted yourself. This reference covers shipping the app to any host that runs a long-lived Node process — a cPanel "Setup Node.js App", a managed Node host, or a plain VPS — instead of Vercel. Read it when the target is NOT Vercel.

The key idea: **you BUILD LOCALLY and ship a self-contained bundle.** Nothing on the host compiles your app. Your laptop produces a finished Node server plus its static output, you upload that, and the host just runs it. The trade-off vs. Vercel: you give up auto-deploy-on-push and get a manual **build → bundle → upload → restart** loop instead. The first-time wiring is below; once it's wired, the ongoing release discipline (verify → gate → ship → confirm) is owned by [[releasing]] — follow that for every subsequent deploy.

> Prerequisite: the rest of the bootstrap (GitHub repo, Supabase project, schema migrations, seed, admin-bootstrap migration) is done elsewhere in this skill. This file is only the "host it yourself" slice. If anything below is ambiguous for your specific host, stop and ask — see [[ask-dont-guess]].

---

## 1. BUILD MODE: produce a standalone server

Next.js can emit a **self-contained server** that carries its own minimal `node_modules`, so the host doesn't need your full dependency tree or a build step. Turn it on in `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for self-hosting. Produces .next/standalone/server.js.
  // Skipped on Vercel, which manages its own output — so the same repo deploys both ways.
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
```

- `output: 'standalone'` makes `next build` write `.next/standalone/` containing **`server.js`** (a ready-to-run Node HTTP server) plus a trimmed `node_modules` with only what the server actually needs.
- The `process.env.VERCEL ? undefined : 'standalone'` guard means Vercel builds still use Vercel's own output. Keep both paths working from one repo.

Build it:

```bash
npm ci        # clean install from package-lock.json
npm run build # next build → emits .next/standalone/ and .next/static/
```

After this you should have `.next/standalone/server.js`. If you don't, `output: 'standalone'` isn't taking effect — confirm `VERCEL` is unset in your local shell.

---

## 2. CRITICAL — bake env at build time

`NEXT_PUBLIC_*` variables are **inlined into the JavaScript at BUILD time**, not read at runtime. Whatever values are present when `npm run build` runs are **compiled into the bundle permanently**. The host's environment panel can NOT change them after the fact.

So you must **build locally with your PRODUCTION public values present.** Put them in `.env.local` (which `next build` reads) before you build:

```bash
# .env.local — the PUBLIC values must be your real production values, because they get baked in.
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-turnstile-site-key>   # if you use Cloudflare Turnstile
```

- These four are safe to compile in — the anon key and Turnstile *site* key are public by design, the URL and site URL are not secret.
- If you build with a localhost `NEXT_PUBLIC_SITE_URL`, your production bundle will point links, redirects, and OAuth callbacks at localhost. Wrong public values are the #1 self-host footgun. Build for production with production public values.

**Server-only secrets are NOT baked in.** Never put `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` in the compiled output — they're read from the host's runtime environment (step 6). Keep them out of `.env.local` if that file ever risks being committed; they belong only on the host. See [[engineering-standards]] for the secret-handling rules.

---

## 3. BUNDLE: package the standalone output into one archive

The standalone `server.js` does **not** include the static assets or any data files your app reads at runtime — you assemble those next to it yourself. Collect three things into the folder you'll ship:

1. **`.next/standalone/`** — the server (`server.js`) + its minimal `node_modules` + a copy of `package.json`.
2. **`.next/static/`** — the compiled client JS/CSS. Copy it to **`.next/standalone/.next/static/`** so the server can serve it from the path it expects.
3. **Any bundled assets the app reads from disk** — `public/`, plus things like email templates or seed/data files **if** your app reads them via `fs` at runtime. (Better: embed those at build time instead of reading them at runtime — see the gotcha in step 8. If they're already inlined as imports, you don't need to ship them as files at all.)

A small build script assembles and tars it so the bundle is reproducible:

```bash
#!/usr/bin/env bash
# scripts/bundle.sh — run AFTER `npm run build`. Produces deploy.tar.gz.
set -euo pipefail

OUT=.next/standalone

# 2) static output must sit inside the standalone tree
mkdir -p "$OUT/.next"
cp -r .next/static "$OUT/.next/static"

# 3) public assets (and any other files the app reads at runtime)
[ -d public ] && cp -r public "$OUT/public"

# one self-contained archive, contents at the archive root for a clean extract
tar -C "$OUT" -czf deploy.tar.gz .
echo "Wrote deploy.tar.gz"
```

```bash
npm run build && bash scripts/bundle.sh
```

You now have **`deploy.tar.gz`**: a complete, runnable app. Untarred, its entry point is `server.js` at the root.

> Asset note: if your app reads files at runtime (email templates, static markup, seed JSON), prefer embedding them into the bundle at build time so they ride along as code instead of loose files — e.g. a webpack `asset/source` rule that loads them as strings, or Next's `outputFileTracingIncludes` to trace extra files into the output. Embedded assets work on any host with no filesystem read and can't go missing from the archive.

---

## 4. UPLOAD + EXTRACT to the host folder

1. Decide the app folder on the host, e.g. `~/apps/<your-app>` (cPanel home is usually `/home/<cpuser>/`).
2. Upload `deploy.tar.gz` there via the host **File Manager** or **SFTP** (FileZilla, `scp`, `rsync`).
3. Extract **into that folder** so `server.js` lands at its root:

   ```bash
   mkdir -p ~/apps/<your-app>
   tar -xzf deploy.tar.gz -C ~/apps/<your-app>
   ```

   In cPanel File Manager: upload the archive, right-click → **Extract**, then confirm `server.js` is at the top level of the app folder (not nested inside an extra directory).

For a **redeploy**, extract over the same folder so the new `server.js` and `.next/` replace the old ones, then restart (step 7). Wipe stale files if your bundle's shape changed.

---

## 5. CREATE A NODE APP on the host

On cPanel: **Setup Node.js App → Create Application** (a plain VPS equivalent is a `systemd` service or a `pm2` process running `node server.js`).

- **Node.js version:** pick the version that **matches your local build** (e.g. the major you built with). A standalone bundle's `node_modules` was resolved for your build-time Node; a mismatched runtime can fail to load native deps.
- **Application root:** the folder you extracted into, e.g. `apps/<your-app>`.
- **Application URL:** your domain / subdomain.
- **Application startup file:** **`server.js`** (the standalone entry — NOT `npm start`, NOT `next start`; the standalone server is invoked directly).

Save. Don't start it yet — set the secrets first (step 6).

---

## 6. SET SERVER-ONLY ENV in the host UI

In the Node app's **"Environment variables"** panel (cPanel: the *Detected configuration files / Environment variables* section of the app; VPS: the `systemd` unit's `Environment=` lines or a `pm2` ecosystem file), add the server-only values:

| Variable | Why |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side privileged Supabase access — **never** public, never baked in |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server verification (if you use Turnstile) |
| `RESEND_API_KEY` | Resend transactional email (if you send email) |
| `EMAIL_FROM` | the From address your app sends as, e.g. `you@example.com` (if you send email) |
| `CRON_SECRET` | shared secret your scheduled/cron routes check (if you use cron) |
| `NODE_ENV` | set to `production` |
| `HOSTNAME` | set to `0.0.0.0` **if** the host needs the server to bind all interfaces (some passenger/proxy setups require it; omit if the host injects its own bind) |
| `PORT` | only if the host doesn't inject one — the standalone server honours `PORT`, and most managed Node hosts set it for you |

- The **`NEXT_PUBLIC_*`** values are already compiled in (step 2). You do **not** need to re-set them here; setting them again is harmless but won't change the baked-in values — to change those you must rebuild.
- Obtain each value from its source dashboard (Supabase → Project Settings → API for the service-role key; Cloudflare Turnstile for the secret; Resend for the API key). **Never paste a real secret value into the repo, a commit, or this skill** — only into the host's runtime env panel. Treat secret rotation per [[engineering-standards]].

---

## 7. START / RESTART the app

- First run: click the host's **Run / Start** button (cPanel Node app: **Start App**; VPS: `systemctl start <your-app>` or `pm2 start server.js`).
- **Restart** after any redeploy or env change: the host's **Restart** button, or on Passenger-style hosts **touch the restart trigger**:

  ```bash
  mkdir -p ~/apps/<your-app>/tmp && touch ~/apps/<your-app>/tmp/restart.txt
  ```

  Passenger reloads the worker on the next request after `tmp/restart.txt` changes.

- Verify it came up: load `https://your-domain.com`, and confirm a server route works (an API endpoint, a sign-in). Check the host's app log if it doesn't.

**The redeploy loop, every time:**

```
edit → npm run build → bash scripts/bundle.sh → upload deploy.tar.gz → extract over app folder → restart
```

This is the manual cost of self-hosting (no push-to-deploy). Run the full release gate from [[releasing]] before each one, and the behavioural/regression checks from [[regression-testing]] before you call it shipped — "it built" is not "it works."

---

## 8. GOTCHA — read-only / limited runtime filesystem

Many self-hosts (and all serverless) give the running app a **read-only or ephemeral filesystem**: `fs.writeFile` either throws `EROFS` / `EACCES` or silently writes to disk that's wiped on the next restart/redeploy. Code that "saves a file" works on your laptop and fails or loses data in production.

Rules:

- **Don't `fs.write` user-editable content at runtime.** Anything a user or admin edits (uploaded content, settings, generated docs) must be **persisted to the database** (your Supabase tables / Storage), not to local disk.
- **Ship defaults as inlined imports**, not as files read at runtime. Bake static defaults (email templates, seed/data files, fixed markup) into the bundle as imported strings/modules so the bundler embeds them — then production never depends on a runtime read that the host may forbid. (This is also why step 3 prefers embedding over shipping loose files.)
- **Reads of bundled, never-changing files** are usually fine; it's *writes* and *user-mutable* state that break. When in doubt, push it to the database.

This is the canonical runtime-filesystem rule — see the runtime-filesystem gotcha in [[engineering-standards]] for the full statement and the database-not-disk pattern, and [[design-system]] for how user-editable content surfaces in the UI without disk writes.

---

## Quick checklist

- [ ] `output: 'standalone'` in `next.config.mjs` (guarded off for Vercel)
- [ ] `.env.local` has **production** `NEXT_PUBLIC_*` values **before** `npm run build`
- [ ] `.next/standalone/server.js` exists after build
- [ ] `.next/static` copied into `.next/standalone/.next/static`; `public/` and any read-at-runtime assets included
- [ ] `deploy.tar.gz` extracts with `server.js` at the folder root
- [ ] Node app created: root = app folder, startup file = `server.js`, Node version = build version
- [ ] Server-only secrets set in the host env panel (service-role, Turnstile/Resend/cron as used, `NODE_ENV=production`, `HOSTNAME=0.0.0.0` if needed)
- [ ] App started/restarted; homepage + one server route verified live
- [ ] No runtime `fs.write` of user content — it goes to the database

For everything that happens on every subsequent release (authorized deploys, verify→gate→ship→confirm, exit codes), follow [[releasing]]. This reference only stands the host up the first time.
