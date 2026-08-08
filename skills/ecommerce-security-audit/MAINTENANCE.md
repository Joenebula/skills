# Maintaining this skill

**Last reviewed: 2026-07-10.** (Update this date every time the skill is refreshed. If it's more than ~6 months old, the skill is due a review.)

## Read this first — the honest limitation

**This skill cannot update itself, and cannot tell when it's out of date.** It's a static set of text files. It does exactly what these files say, unchanged, until a human edits them. Nothing here reaches out, checks anything, or rewrites itself. So keeping it current is a *process a human runs* (the owner brings it to Claude; Claude does the refresh) — never something the skill does on its own. Do not mistake it for self-maintaining.

The good news: the things this skill checks change at very different speeds, and most barely move. A refresh is short because only a small part actually goes stale.

## What changes fast vs slow (spend refresh effort accordingly)

- **Fast — already handled live, nothing to update here:** dependency vulnerabilities. `npm audit`, OSV-Scanner, and the weekly GitHub run (see `references/delivery-and-automation.md`) pull these fresh every time from an always-current database. The skill doesn't hardcode which packages are vulnerable — it runs a tool that looks it up. This is the model: *call something live rather than freeze what you know.* **Also recheck `references/scanner-toolchain.md` each review** — the best scanners and Claude Code's own native security features (the `security-guidance` plugin, `/security-review`, Claude Security) evolve fast; confirm the recommended tools and install commands are still current.
- **Medium — the main thing that needs a human check:** platform specifics. Stripe/PayPal API details, Next.js patterns, where Vercel puts settings. These shift every several months and can quietly make a reference-file detail stale. **AI-feature security (`references/ai-feature-security.md`) belongs here too and moves faster than most** — prompt-injection defences are an unsolved, actively-evolving area; revisit it whenever the site's AI features change or every review. **The AI-build lens (item 53 — dependency hallucination / typo-squat attacks against AI-suggested packages, in `dependencies.md` §4) is likewise fast-moving** — the attacks evolve with the AI coding tools; revisit it every review.
- **Slow (years) — and deliberately offloaded to a human:** UK law (GDPR, age verification, consumer-contract rules). The skill points to the ICO and a solicitor rather than reciting law *precisely so this doesn't go stale in a text file.* Don't try to encode current law here.
- **Near-timeless — rarely touch:** the core principles (server-side pricing, webhook verification, access control, fail-closed, don't-trust-input). These are the spine and don't rot.

## When to refresh — the trigger list (event-driven, not calendar-dependent)

Refresh when any of these happens — don't wait for a date:
- The weekly GitHub scan flags something new or unfamiliar.
- The site adds or changes a payment provider, or bumps a major dependency (e.g. a Next.js major version).
- A relevant breach is in the news, or a Stripe/PayPal security notice lands in the owner's inbox.
- A new site is about to launch, or traffic/money steps up meaningfully.
- **Backstop:** if none of the above has happened in ~3–6 months, refresh anyway, and update the "Last reviewed" date above.

For triggers to work, the owner's notifications must actually be on — GitHub Actions email notifications, and Stripe/PayPal security emails. (This ties into the owner-actions checklist.)

## Where to check — the authoritative live sources

A refresh checks the skill against these rather than working from memory:
- **OWASP** — the OWASP Top 10 and the OWASP Cheat Sheet Series. Industry-standard, continuously updated, maps almost one-to-one onto what this skill checks. The primary source for the security content. (owasp.org)
- **Stripe / PayPal security & integration docs** — the live source of truth for payment specifics (webhook verification, Payment Intents, current API).
- **ICO** (Information Commissioner's Office, ico.org.uk) — authoritative for the UK data-protection / cookie-consent side. For anything legally load-bearing, this points onward to the ICO or a solicitor, not to this file.
- **Dependencies** — already handled live by `npm audit`; nothing to check manually.

When refreshing, Claude can web-search these to catch changes since the last review — that's the point of naming them: an agreed, authoritative place to check against.

## The refresh checklist (the steps to actually run)

1. Note the current "Last reviewed" date and what's changed since (use the trigger that prompted this, if any).
2. Re-read each `references/*.md` against its authoritative source above; flag anything drifted (especially payment/platform specifics).
3. Confirm the scanner patterns in `scripts/scan.sh` still match how current code is written (framework idioms change).
4. Check the automation files in `references/delivery-and-automation.md` still reflect current GitHub Actions / git-hook syntax.
5. Sanity-check that the core principles and reporting rules are unchanged (they usually are).
6. Apply updates, **bump the "Last reviewed" date at the top of this file**, and repackage the skill.
7. Reinstall the repackaged skill (updating replaces the old version — keep the same name).

## The honest boundaries (unchanged by any refresh)

Keeping this current makes it a *better smoke alarm* — it does not turn it into a penetration test. The staleness fix and the "get a pentest before serious money" recommendation are separate and both stay true. And a refresh still can't see outside the code (accounts, dashboards, whether a fix deployed) — those remain owner actions.
