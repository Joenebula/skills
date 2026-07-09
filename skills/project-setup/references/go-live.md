# Going live safely

How to take a Next.js + Supabase app on Vercel from "it deploys" to "it's safely public" — the first-time cutover. Read this when your build is green in CI and you're about to point a real domain at it and let real users in. For the *repeatable* release loop on every change after launch, see [[shipping]]; this file covers the one-time wiring you do once.

---

## 0. Launch-readiness audit — check EVERY area (do this FIRST)

The gauntlet in §1 proves the build *ships*. This proves the site is actually *finished*. The expensive launch failure isn't a broken build — it's going live with whole areas unbuilt, unwired, or still on placeholder copy, and hearing about it from users. **Sweep every area below. Any miss is a NO-GO, not a "fix it after launch."**

Go area by area — a quick click-through hides exactly the gaps that bite. Each line links the skill that owns it.

**Completeness — the "missing parts" that bite hardest**
- [ ] **Every linked page exists and renders** — no 404 from a nav/footer/CTA link, no half-built or stub page, no `/coming-soon` standing in for a real page.
- [ ] **No placeholder content anywhere** — no Lorem ipsum, no "Your Company" / "[Product]", no TODO/FIXME copy, no sample/dummy text or images left in.
- [ ] **Every control is wired** — every button, link, form, toggle and menu item does something real: no dead control, no `href="#"`, no no-op handler, no "Save" that doesn't persist, no copy promising a feature that isn't built. *(The whole-site version of `feature-completeness-auditor` — run it across the site, not just a diff.)*
- [ ] **Real data, not fixtures** — no demo/seed rows shown as real; every count / stat / KPI reconciles with its true source (→ [[engineering-standards]] data-reconciliation); a zero-data view shows a real empty-state.
- [ ] **Empty / loading / error states exist everywhere** — no infinite spinner, no blank region, no raw stack trace or `undefined` shown to a user.

**Flows that must work end-to-end**
- [ ] **Forms** — validate inline (→ [[design-system]]), submit, persist, show success AND error, send their email, with spam protection on. (→ [[forms-and-input]])
- [ ] **Auth** — sign-up, sign-in, sign-out, password/magic-link reset, email verification, session survives a reload, protected routes redirect anon users. (→ [[security]])
- [ ] **Payments** (if any) — live keys set, one real end-to-end test transaction, webhooks verified, refund + receipt paths work. (→ [[payments]])
- [ ] **Email deliverability** — every transactional mail actually sends, from a verified domain, links use the canonical host, lands in the inbox (SPF/DKIM/DMARC) not spam, with unsubscribe where required.

**The site as a product**
- [ ] **Responsive** — every page on phone / tablet / desktop: no horizontal overflow, no broken layout, ≥44px tap targets, the mobile nav opens and works. (→ [[responsive-design]])
- [ ] **Accessibility** — labels on inputs, alt text on images, AA contrast, a full keyboard path, visible focus. (→ [[accessibility]])
- [ ] **SEO** — a real per-page `<title>` / meta / OG (not one global default), a canonical tag, `sitemap.xml`, `robots.txt`, a favicon, a social-share preview image, structured data where it helps. (→ [[seo]])
- [ ] **Performance** — images sized + compressed, no multi-MB payloads, no console errors/warnings, acceptable LCP/CLS. (→ [[performance]])
- [ ] **Custom 404 + 500 pages** — branded, with a way back home (not the framework default).
- [ ] **Legal / compliance** — privacy policy, terms, cookie/consent banner, a contact route, accessibility statement, an age gate if the content needs one. (→ [[privacy-and-compliance]])
- [ ] **Content correctness** — real brand name + spelling, real contact details, correct pricing, licensed real images, no test/staging content.

**Operations — you can see it and recover it**
- [ ] **Analytics + error monitoring + uptime** installed and actually recording — verify one real event lands and one real error lands. (→ [[observability]])
- [ ] **Security** — every write gated server-side (not just hidden in the UI), no secret / service-role / API key in the client bundle, security headers set, rate-limiting on public POSTs, HTTPS-only. (→ [[security]])
- [ ] **Config / env** — every prod env var set in the host, no dev/debug flag on, no `console.log` leaking data, no test accounts left enabled.
- [ ] **Backups + rollback** — a DB backup exists from *before* launch, and you know the one-click rollback path. (→ [[infrastructure]])

> Forcing function: open the sitemap (or the route list) and visit **every** URL, then on each page click **every** control. The first time anyone does this should be the audit — not launch day.

### The audit prompt — hand this to Claude / an agent

Paste this to run the sweep instead of doing it all by hand. Read-only; it returns a GO / NO-GO.

```text
You are the pre-launch readiness auditor for this site. Audit it for "looks done but isn't" gaps before go-live. Be exhaustive and skeptical — your job is to find what's MISSING, not to confirm it's fine.

1. Enumerate EVERY route/page (from the router, the sitemap, and every nav/footer/in-page link) and EVERY user-facing affordance on each (buttons, links, forms, toggles, inputs, KPIs, lists).
2. For each, trace it to REAL behaviour: does the page render real content, and does each control reach a real handler/endpoint/persisted state that does what its label promises?
3. Flag every instance of these missing-part classes — with the location and the fix:
   - unbuilt / 404 / stub / "coming soon" page on a linked route
   - placeholder or Lorem/TODO copy, dummy images, "[Product]" / "Your Company"
   - dead control (no-op button, href="#", a setting that doesn't persist)
   - broken-promise copy (claims a capability that isn't wired)
   - fixture/demo data shown as real; a stat that doesn't match its source
   - missing empty / loading / error state; a raw error shown to users
   - broken link, or a link to localhost / staging / a preview deploy
   - a form that doesn't validate / persist / send; an auth flow that breaks
   - missing SEO (title/meta/canonical/sitemap/robots/OG), legal page, or custom 404/500
   - responsive break / overflow; accessibility miss (label / alt / contrast / keyboard / focus)
   - a secret in the client bundle; an unguarded write endpoint
4. For anything you cannot verify from the code or the live site, list it as UNVERIFIED — never assume it passes.

Return: a GO / NO-GO verdict, then a numbered, prioritised gap list (area · what's missing · where · the fix). NO-GO if any user-facing area is unbuilt, unwired, placeholder, or unverified.
```

---

## 1. Pre-deploy gauntlet

> **Do §0 (the launch-readiness audit) FIRST.** This gauntlet proves the build *ships* — not that every area exists; a green gauntlet on an incomplete site is still a NO-GO.

Run these in order. Stop at the first failure — do not "ship anyway and watch." The full per-release discipline (verify → gate → ship → confirm, authorized deploys, reading exit codes) lives in [[shipping]] and the test layers live in [[regression-testing]]; this is the first-launch checklist that points at them.

- [ ] **Typecheck.** `npm run typecheck` (or `npx tsc --noEmit`). Zero errors.
- [ ] **Production build — watch the REAL exit code.** Run `npm run build`. A prod build catches what dev never does: env vars baked at build time, server/client boundary mistakes, route export errors.
  - Do **NOT** pipe the build into a pager or `tee`/`head` that swallows the status. `npm run build | tail -n 40` reports the exit code of `tail`, not of the build — a failed build can look "green." If you must capture output, check `$?` (bash) / `$LASTEXITCODE` (PowerShell) immediately after, or use `set -o pipefail`. The build is good only when the process itself exits `0`.
- [ ] **Deploy to the host** (Vercel: push to the production branch, or `vercel --prod`). Wait for the deployment to report **Ready**.
- [ ] **Live smoke pass against the deployed URL** (not localhost — the real domain). Confirm each:
  - [ ] Key pages return **200** (home, a main listing/browse page, sign-in; an admin route should 200-or-redirect, not 500).
  - [ ] At least one **API route answers** with the expected shape (e.g. `GET https://your-domain.com/api/health` or a public data route → JSON, 200).
  - [ ] **SEO basics resolve**: `https://your-domain.com/sitemap.xml` and `https://your-domain.com/robots.txt` both return 200 with the right content type (not your app's 404 HTML).
  - [ ] **Canonical redirect works**: hit the *non-canonical* host and confirm a **301** to the canonical one (see §2).
- [ ] **Confirm the NEW build is actually serving** before you call it live. A deploy can succeed while the CDN/host still serves the previous build, or you're staring at a cached page. Verify with a versioned marker that changes every build:
  - A health/version route — e.g. `GET /api/health` returning `{ "commit": "<sha>", "builtAt": "<iso>" }` sourced from `process.env.VERCEL_GIT_COMMIT_SHA` (Vercel injects this) — and check the SHA matches the commit you just shipped, **or**
  - A build marker embedded at build time you can grep in the served HTML.
  - Hard-refresh / curl with cache-busting (`curl -sS "https://your-domain.com/api/health?_=$(date +%s)"`) so you're not reading a cached response.

> Static-green ≠ live-working. The build compiling tells you nothing about whether the deployed URL serves the right bytes. Always finish on a check against the real URL.

---

## 2. Domain & canonical host

A canonical host is the ONE address everything points at. Get this wrong and Google sees two sites, your share/OG images break, and email unsubscribe links 404.

**Add the domain (Vercel):**
- [ ] Vercel → your project → **Settings → Domains → Add**. Enter `your-domain.com` (and `www.your-domain.com`).
- [ ] Follow Vercel's DNS instructions at your registrar/Cloudflare: an **A record** (or `ALIAS`/`ANAME`) for the apex and a **CNAME** for `www`. If DNS is on Cloudflare, set those records to **DNS only (grey cloud)** initially so Vercel can issue the TLS cert; you can re-proxy after.
- [ ] Wait for Vercel to show the domain as **Valid Configuration** with a green TLS cert.

**Pick ONE canonical host and 301 the other to it:**
- [ ] Decide: apex (`your-domain.com`) **or** `www.your-domain.com`. Either is fine — just pick one and be consistent everywhere.
- [ ] In Vercel → Domains, set the **other** host to **Redirect** → the canonical one (Vercel issues a 301). Result: every visit lands on exactly one host.
- [ ] Re-run the canonical check from §1: the non-canonical host must 301 to the canonical one.

**Make `NEXT_PUBLIC_SITE_URL` EXACTLY match the canonical host:**
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` (the canonical, with scheme, **no trailing slash**) in Vercel → **Settings → Environment Variables**, **Production** scope.
- [ ] This one value drives **canonical `<link>` tags, the sitemap URLs, OG/share image URLs, and links in transactional emails** (verification, password reset, unsubscribe). A mismatch — apex vs www, http vs https, a stray trailing slash — silently creates duplicate URLs and broken share/unsubscribe links.
- [ ] **`NEXT_PUBLIC_*` is inlined at BUILD time, not read at runtime.** Setting it in the dashboard does nothing to an already-built deployment. Set it first, **then trigger a fresh production build** so it gets baked in. Any time you change a `NEXT_PUBLIC_*` value, you must rebuild — re-running the same deployment won't pick it up.

> While you're in the env-var screen, sanity-check the rest of the production set is present and scoped to Production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only — never `NEXT_PUBLIC_`), and any optional-service keys you've enabled (`RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `CRON_SECRET` if you run cron routes). The full meaning/sourcing of each is in the parent SKILL.md's env section and `references/optional-services.md` — here you're only confirming they exist in Production before the canonical build.

---

## 3. Soft-launch with feature flags

Don't open every surface at once. Gate each risky area behind a flag you can flip **without a redeploy**, so launch is a sequence of small, reversible steps instead of one big-bang reveal.

**The pattern:**
- One **boolean per surface**, stored in your database (a single `feature_flags` row, or a small key→bool table — your schema, your call). Stored in the DB, not in env vars, precisely so flipping one needs **no rebuild and no redeploy**.
- A server-side read of those flags gates both the **UI** (don't render the surface) and the **route/action** (refuse the write) — never trust the client alone. Gating discipline and the can-do-X capability check belong to [[engineering-standards]]; reuse it, don't reinvent a parallel check.
- An **admin panel toggle** for each flag. Flipping it takes effect on the next request — no deploy.

**Staged enable order (start narrow, widen as each is verified):**
- [ ] **On at launch:** public **browse/read** surfaces, **member account** sign-up/sign-in, **waitlist** capture.
- [ ] **Off at launch, flip ON one at a time after testing each in production:** any user-generated **write** surfaces — submissions/contributions, moderation tools, claims, role grants, community features.
- [ ] After flipping each ON, exercise it live (submit a real item, moderate it, etc.) before flipping the next. If one misbehaves, flip it back OFF — no rollback deploy needed.

**Optional: private-preview flag (lock the site while you test in prod).**
- [ ] A `private_preview` boolean. When ON, only **allow-listed emails** may sign in / past the gate; everyone else sees a "coming soon" wall.
- [ ] **The admin/owner is always exempt** from the gate — otherwise you can lock yourself out and have no way to turn it back off. Test the exemption *before* you flip preview on.
- [ ] This lets you run the full live smoke + flip-on sequence above against the real domain with real infra, while the public still can't get in.

---

## 4. First hour live

You've flipped the gate open. Stay at the keyboard.

- [ ] **Admin panel open** in a tab, on the flags screen — so killing a misbehaving surface is one click, not a deploy.
- [ ] **Watch host logs**: Vercel → your project → **Logs** (Runtime/Functions). Look for 500s, unhandled rejections, Supabase auth errors, email send failures.
- [ ] **Watch analytics / real-time**: Vercel Analytics or your analytics tool — confirm real traffic is hitting real pages, not a wall of 404s on assets (a sign of a bad `NEXT_PUBLIC_SITE_URL` or asset-path mismatch).
- [ ] **Spot-check the email path**: trigger one real transactional email (sign-up/verify) and confirm it arrives, the **links use the canonical host**, and it's not in spam (check SPF/DKIM on the `EMAIL_FROM` domain if it is).
- [ ] **Keep a rollback ready** — three levers, in order of speed:
  1. **Flip the flag OFF** (fastest, surface-scoped, no deploy) — for "feature X is broken."
  2. **Promote the previous deployment**: Vercel → **Deployments** → the last-known-good → **⋯ → Promote to Production** (instant, whole-site) — for "the whole build is bad."
  3. **Revert the commit + redeploy** (`git revert <sha>` → push) — the durable fix; do this after an instant lever has stopped the bleeding.
- [ ] If you ship a hotfix in this window, it still goes through [[shipping]]'s release loop — don't push straight to production unverified just because you're in a hurry. A panicked unguarded push is how the first hour becomes the first day.

---

## See also
- [[shipping]] — the repeatable release loop you'll use for every change after this first cutover (verify → gate → ship → confirm, authorized deploys, exit-code discipline).
- [[regression-testing]] — the test layers behind the smoke pass in §1.
- [[engineering-standards]] — the server-side gating / capability check your feature flags should reuse.
- [[ask-dont-guess]] — when a canonical-host or flag decision is ambiguous, confirm before flipping, don't guess.
- [[design-system]] — for the "coming soon" wall and the admin flags panel UI, build from the documented components and tokens.
