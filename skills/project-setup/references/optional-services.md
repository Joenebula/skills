# Optional Services & Their Keys

Optional third-party services for the GitHub + Supabase + Vercel + Next.js stack. Read this when you want to switch on a feature that needs an outside provider — captcha, transactional email, scheduled jobs, or a third-party data API. Each service here is **optional**: it **unlocks** a feature and **degrades gracefully** when its key is absent. Set the key only when you want the feature. A missing optional key must **never** crash the app.

> This file covers the OPTIONAL layer. The required core wiring — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` — lives in the parent `SKILL.md`. For the ongoing verify → gate → ship → confirm release loop (and where prod env vars get set on the host), see [[releasing]]. This file owns FIRST-TIME wiring of each optional service.

## The mental model (read once)

Every optional service follows the same shape:

1. **A NAME** lives in `.env.local.example` (committed, no value) so the next person knows the key exists.
2. **A VALUE** is set in **two** places: `.env.local` (your machine, for `npm run dev`) **and** the host's environment (Vercel → Project → Settings → Environment Variables, for production). `.env.local` is git-ignored; never commit a real value.
3. **A GUARD** in code — an `isConfigured` / `enabled` check — reads the key and either runs the feature or returns a clean "not configured" no-op.
4. With the key set, the feature **lights up**. With it absent, the app **still works**.

Naming rule for the stack: `NEXT_PUBLIC_*` is shipped to the browser (safe to expose — public site keys only); everything else is **server-only** and must **never** be prefixed `NEXT_PUBLIC_`. A service-role / secret key in a `NEXT_PUBLIC_*` var is a leak.

> ### THE ENV MODEL — the gotcha that bites everyone
> `NEXT_PUBLIC_*` values are **inlined into the browser bundle at BUILD time**, not read at runtime — so changing a public optional key (e.g. a Turnstile **site** key) requires a **rebuild/redeploy** to take effect. Server-only secrets are read at **RUNTIME** from the host's encrypted env, so changing one takes effect on the next request with no rebuild.

---

## 1. Spam captcha — Cloudflare Turnstile

**What it does.** A privacy-friendly CAPTCHA that gates your public-facing forms (contact, signup, waitlist) against bots. The browser renders a widget that produces a token; your server verifies that token with Cloudflare before honouring the submission.

**Create account → get keys (click-by-click):**
1. Go to **dash.cloudflare.com** and sign in (free account is enough).
2. In the left sidebar, open **Turnstile**.
3. Click **Add site** (a.k.a. **Add widget**).
4. Give it a name, add your domain(s) — include `localhost` for local dev — and pick the **Managed** widget type.
5. Click **Create**. Cloudflare shows two keys: a **Site Key** (public) and a **Secret Key** (server).

**Env vars + where each goes:**

| Var | Visibility | Goes in | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (browser) | `.env.local` **and** host env | Rendered in the form widget |
| `TURNSTILE_SECRET_KEY` | Server-only secret | `.env.local` **and** host env | Server verifies the submitted token |

`.env.local`:
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

**Graceful when absent.** With **both** keys blank, server-side verification is **skipped** (the submission is treated as a pass), so **local dev works with no Cloudflare account at all**. Your baseline defences still apply regardless: a **honeypot** field (a hidden input bots fill but humans don't) plus **rate-limiting**. Turn Turnstile on for production by setting both keys; leave them blank in dev if you don't want the widget. The verification helper should short-circuit to "pass" when `TURNSTILE_SECRET_KEY` is unset — never throw.

---

## 2. Transactional email — Resend

**What it does.** Sends your app's own transactional mail (confirmations, outcome notifications, alerts) from a sender on a domain you control.

**Create account → verify domain → get key (click-by-click):**
1. Go to **resend.com** and sign up.
2. Left sidebar → **Domains** → **Add Domain**. Enter `your-domain.com`.
3. Resend shows **DNS records** (SPF / DKIM, and usually a return-path / MX). Add them at your DNS provider, then click **Verify**. (Verification is what lets you send *from* that domain; without it you can only send from Resend's sandbox.)
4. Left sidebar → **API Keys** → **Create API Key**. Name it, choose **Sending access**, **Create**, and copy the key **now** — it's shown once.

**Env vars + where each goes:**

| Var | Visibility | Goes in | Used for |
|---|---|---|---|
| `RESEND_API_KEY` | Server-only secret | `.env.local` **and** host env | Authenticates send calls |
| `EMAIL_FROM` | Server config | `.env.local` **and** host env | The verified `From:` address |

`.env.local`:
```bash
RESEND_API_KEY=
EMAIL_FROM="<Your App> <noreply@your-domain.com>"
```
`EMAIL_FROM` **must** be on a domain you've verified in Resend, or sends will be rejected.

**Graceful when absent.** With `RESEND_API_KEY` unset, the app's email helper is a **no-op** — it returns a "skipped" result and the surrounding flow (signup, an approval action, etc.) completes normally without throwing. The user simply doesn't get that app-sent email.

**Important distinction:** Supabase **auth** emails — magic-link, signup confirmation, password reset — are sent by **Supabase independently** of Resend (configured in Supabase → Authentication → Email). So sign-in and account flows keep working even with no Resend key. Resend is only for **your app's own** transactional mail.

---

## 3. Scheduled jobs / cron — a shared secret

**What it does.** Lets the host's scheduler hit your cron endpoints (e.g. nightly data refresh, cleanup) on a timetable, while keeping those endpoints **closed to the public**. The protection is a shared secret: the scheduler sends it, the endpoint checks it.

**Get the key (no account — you generate it):**
```bash
openssl rand -hex 32
```
Copy the output. (Any long random token works — this is just a value you and the scheduler both know.)

**Env var + where it goes:**

| Var | Visibility | Goes in | Used for |
|---|---|---|---|
| `CRON_SECRET` | Server-only secret | `.env.local` **and** host env | Authorises cron requests |

`.env.local`:
```bash
CRON_SECRET=
```

**Define the schedule (Vercel).** Add a `crons` array to `vercel.json` at the repo root — each entry is a `path` and a standard cron `schedule`:
```json
{
  "crons": [
    { "path": "/api/cron/<your-job>", "schedule": "0 4 * * *" }
  ]
}
```
On deploy, Vercel registers the schedule and, at each tick, calls the path with the `CRON_SECRET` as a **Bearer header**. Your endpoint compares it and runs, or refuses.

**Graceful when absent — and why this one is *strict*.** Unlike the others, a cron endpoint with **no** `CRON_SECRET` configured (or a mismatched one) must refuse with **`401 Unauthorized`**. That's the **safe** default: an unsecured cron path is a publicly-triggerable side effect. "Degrades gracefully" here means "stays locked", not "runs anyway".

**Invoke a job manually** (to test, or to run off-schedule):

- Bearer header (mirrors how the scheduler calls it):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/<your-job>
```
- Quick browser check via a `?key=` query param (only if your endpoint also accepts the secret as a query param — handy for an eyeball test, but a header is preferred since query strings land in logs):
```
https://your-domain.com/api/cron/<your-job>?key=<your-cron-secret>
```

---

## 4. Third-party data APIs — optional enrichment / link-out

**What it does.** Pulls in or links out to an external provider — e.g. a data/catalogue API for enrichment, a media API for embeds, or a maps service. Each is independent and optional.

**Create account → get token (generic pattern):**
1. Sign up at the provider and open its **developer console** / **API** / **Credentials** section.
2. Create an **API key** / **token** (often under a named "app" you register).
3. Copy it. These are almost always **server-only secrets** — keep them off the browser (no `NEXT_PUBLIC_` prefix).

**Env vars + where each goes.** Use a clear, provider-named var and put the value in **`.env.local` and the host env**:
```bash
# examples — name per provider
<PROVIDER>_API_TOKEN=
<PROVIDER>_API_KEY=
```

**Guard usage behind an `isConfigured` / `enabled` check** so the integration only activates when its key is present:
```ts
const enabled = Boolean(process.env.PROVIDER_API_TOKEN);
if (!enabled) return null; // inert: skip enrichment, render without it
```

**Graceful when absent.** With the token unset, that integration is **inert / stubbed** — the enrichment is skipped, the link-out is hidden, and the app works normally on its own data.

**No-key APIs.** Some public APIs need **no** key but expect a descriptive **`User-Agent`** / contact string instead (e.g. `"<your-app> (you@example.com)"`) so the provider can identify and contact you. Set that string rather than a secret — but still gate the call behind a config check and handle the provider being down without crashing.

---

## THE GENERAL RULE — adding any new optional key

Whenever you add a new optional integration, follow this exact sequence:

1. **Add the NAME** (no value) to `.env.local.example` with a one-line comment: what it's for, where to get it, and what happens when it's blank.
2. **Set the VALUE** in **`.env.local`** (dev) **and** the **host env** (prod — Vercel → Settings → Environment Variables).
3. **Guard the feature** behind an `isConfigured` / `enabled` check that reads the key.
4. **The feature lights up.** With the key present it runs; with it **absent it degrades gracefully** — a no-op, a stub, a skipped send, or (for privileged triggers like cron) a safe `401`. It must **never crash**.

This is the contract from [[engineering-standards]] (graceful degradation: a missing optional dependency is an expected state, not an error) and [[ask-dont-guess]] (surface an honest "not configured" state rather than faking success or silently half-working). Forms gated by any of these keys still follow [[design-system]] for their validation and "not configured" messaging, and every key change is verified through [[regression-testing]] before it ships via [[releasing]].
