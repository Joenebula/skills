# Owner actions — the things only the owner can do (Ring 2)

For everything here the skill **cannot click the buttons** — these live in the owner's accounts and habits, not the code. The skill's whole job is to write clear, numbered, plain-language steps. Every report ends with a "Things only you can do" section carrying whichever of these are live. Be honest that these are the difference between a clean audit and an actually-secure business: a green Ring 1 with 2FA off (item 12) or a fix never deployed (item 16) is still wide open.

---

## Item 12 — Your own 2FA (GitHub, Vercel, Stripe) — 🔴, always

The single highest-value action on the whole list. The skill can't see whether it's on, so it treats it as **assumed off until you confirm** and surfaces it first among owner tasks every time.

Why: a leaked or reused password alone is the most common real break-in. 2FA means a stolen password isn't enough — they'd need your phone too.

Steps for each of GitHub, Vercel, Stripe:
1. Log in → account/security settings.
2. Turn on two-factor authentication (authenticator app preferred over SMS).
3. Save the backup/recovery codes somewhere safe (not in the code, not in the repo).

---

## Item 13 — Rotate a leaked key — 🔴 whenever a secret was found where it shouldn't be

The skill can *remove* a key from code, but **cannot regenerate it** — that's the provider's dashboard. State plainly: removing a leaked key is **not enough** — it may already have been copied, so it must be **rotated**.

Steps:
1. Log into the provider (Stripe/PayPal/etc.).
2. Roll/regenerate the exposed key.
3. Paste the new value into Vercel → Settings → Environment Variables (correct environment).
4. Redeploy so the site picks up the new key.

---

## Item 14 — Secrets discipline — 🟠 standing practice

The habit that stops item 13 recurring: secrets live **only** in local `.env.local` and Vercel's settings — never typed into code, never committed. The skill checks the code/repo side; the habit side is the owner's:
1. Never paste a key into a file to "test quickly."
2. Keep `.env.local` (and `.env`) listed in `.gitignore`.
3. When in doubt whether something is secret, treat it as secret.

---

## Item 15 — Login habits (phishing) — awareness

The purely human one no code can touch. A convincing fake email ("unusual login on your GitHub, click to secure") leads to a lookalike page that pockets your password.
1. **Never log in via a link in an email** — type the address yourself or use a saved bookmark.
2. Keep 2FA on (item 12) so a stolen password alone still fails.

---

## Item 16 — Confirm fixes actually deployed — 🟠 standing step

A fix does nothing until it's uploaded *and* live, and a later change can quietly undo it. "Fixed" in the report means "fixed in the code" — there's a gap between that and "fixed on the live site."
1. Push the change.
2. Let Vercel deploy.
3. Re-run the quick scan / re-check the specific fix on the live site.

This gap is exactly why the automation (see `delivery-and-automation.md`) exists — it turns "fixed once" into "stayed fixed."

---

## Item 17b — Email & domain spoofing (SPF/DKIM/DMARC) — 🟠 [O], mostly outside the code

Mostly DNS/account-level, not code — so an owner item with plain steps. Without the right DNS records, **anyone can send emails that look like they come from your shop's domain**, to phish your customers ("your order has a problem, click here"). The three records that prove an email genuinely came from you:

- **SPF** — lists which servers may send email as your domain.
- **DKIM** — cryptographically signs your emails so they can't be forged.
- **DMARC** — tells receiving mail servers what to do with email that fails the above (and can report attempts).

Steps (plain):
1. Ask whoever sends your shop's email (e.g. your email/newsletter provider — Resend, Google Workspace, etc.) for their SPF/DKIM setup instructions.
2. Add the DNS records they give you at your domain registrar/DNS provider.
3. Add a DMARC record, starting in "monitor" mode, then tighten it.
4. Send a test and check it passes (many providers show a green tick; tools like a "mail tester" confirm).

**Related — subdomain takeover:** if you ever point a subdomain (e.g. `shop.yourdomain.com`) at a service and later stop using that service *without removing the DNS record*, someone else can claim that service and take over the subdomain — serving their content on your domain. Owner habit: remove DNS records for services you no longer use.

**Verify:** a mail-testing tool shows SPF, DKIM, and DMARC passing for your domain; no DNS records point to services you've stopped using.

---

## Checking for "old code" (vulnerable dependencies) — 🟠 [O], mostly automatic

"Old code" mostly means the ready-made packages your site is built from being outdated versions with *known* security holes. This is one of the few security problems you can almost fully *solve*, because there's a published list of exactly which versions are unsafe — so it's a lookup, not guesswork. Two things, and the first runs itself:

**1. Turn on GitHub Dependabot (continuous, automatic — the highest-value five-minute action).** Once on, GitHub watches your dependencies for you: the moment a package you use has a newly-found vulnerability, it alerts you, and it can open a ready-made fix (a pull request bumping the package to the safe version) automatically. You don't run anything — it runs forever. This also solves "drift": packages don't go bad on a schedule, they go bad whenever a new hole is found, and Dependabot watches continuously.
- Steps: on your repo → **Settings → Code security** (may be under "Advanced Security") → turn on **Dependabot alerts** and **Dependabot security updates**. That's the important toggle — alerts tell you, security updates hand you the fix.
- The skill can also add a `.github/dependabot.yml` file for routine version updates (see `delivery-and-automation.md`). It's findings-free and safe to commit.

**2. A thorough scan before each deploy (the skill does this for you — no skill level needed).** Whenever the audit runs, it runs the strongest dependency scanner available (OSV-Scanner, which catches the indirect dependencies `npm audit` misses) and treats a clean result as a **pre-deployment gate**. So even if you never touch a tool, the tough check happens as part of the audit. You just get told, in plain English, "these packages are out of date and unsafe — here's the fix."

**Honest note on fixing:** finding an old vulnerable package is solved; *applying* the update is usually easy (Dependabot's fix PRs, or `npm audit fix`), but a big "major version" jump can occasionally change how a package behaves and break something — so the safe ones apply freely, and the bigger ones want a quick check that the site still works afterward.

---

## Light awareness note — observability & backups (not a code finding)

Include as a single plain note in the owner section, not a Ring 1 finding:

- **You currently can't tell if you've been breached.** With no logging/error-tracking, an attack or outage is invisible until damage shows. A basic error/logging service is worth adding so problems surface early. (Security-relevant, but not itself a vulnerability.)
- **Backups.** Make sure customer/order data is backed up offsite. A ransomware-style event or a bad deploy is survivable with backups and catastrophic without.

Keep this to a couple of lines — it's awareness, and it sits at the edge of this skill's remit (ops, not code).
