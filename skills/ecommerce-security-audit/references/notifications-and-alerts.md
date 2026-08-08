# Security notifications & alerts — set up the email (required gate)

The automation only protects the owner if its alerts actually *reach a human*. So before relying on any of it, one thing must be set up: **a dedicated email address that receives every security alert**, and every alert source routed to it. **The skill surfaces this as a required action the first time a scan is run, and treats it as a gate — don't consider the security setup "done" until it's in place.**

The email is "to be set up" — that's fine. Surface it as an **outstanding required action** in the first report (prominently), and keep flagging it until the owner confirms it's done. An automation nobody hears from is the most common way a small operator misses a breach.

## What the owner needs (plain steps)

**1. Create/choose a dedicated alerts email.** e.g. `security@theirdomain` or a clearly-labelled address they check. A dedicated one (not buried in a busy personal inbox) means security mail stands out and isn't missed. It can be a forwarding alias to their main inbox — the point is that it's distinct and monitored.

**2. Route each alert source to it.** These are the channels that actually deliver, and what each one tells you:

| Source | What it emails you about | How to point it at the address |
|---|---|---|
| **Dependabot alerts** | A package you use just got a known vulnerability + a ready-made fix (bug/security fixes) | GitHub → Settings → Notifications → set the notification email; enable Dependabot alerts/security updates in repo → Settings → Code security |
| **GitHub Actions (the weekly scan)** | The scheduled/every-push scan caught something (committed secret, etc.) | GitHub → Settings → Notifications → Actions → email to the address; ensure Actions failure notifications are on |
| **GitHub security advisories** | Security issues affecting your repos | Same GitHub notification settings |
| **Error/breach monitoring (optional but recommended)** | Runtime errors and signals something is wrong live — the closest thing to a "something's happening" alert | Add a free error-monitoring service (e.g. Sentry free tier) and set its alert email to the address |

**3. Confirm alerts actually arrive.** Send/trigger a test where possible (e.g. a Dependabot test alert, or check a recent Actions run notified you). An alert channel nobody has verified is a channel you can't trust.

## Honest note on what email alerts can and can't tell you

- **Dependency vulnerabilities and scan failures: yes, reliably emailed** (Dependabot, Actions). This covers most of the "old code / new vulnerability / secret committed" alerts the owner asked for.
- **"Bug fixes":** Dependabot's security-update PRs are exactly this — it emails you the fix to approve.
- **Runtime errors:** only if an error-monitoring tool (Sentry-type) is added — the scanners don't see the running site. This is why monitoring is recommended, not just scanning.
- **"Security breaches":** be honest — **no tool reliably emails "you have been breached" unless breach-detection/logging is in place.** Scanning tells you about *weaknesses*; detecting an active *breach* needs monitoring/logging (ties to the observability note in `owner-actions.md`). Set expectations: these alerts catch vulnerabilities and failures early; catching an active intrusion needs the monitoring layer, and even then isn't guaranteed. Don't let the owner believe silence means safety.

## The advanced option (only if asked)

To email a *specific custom address* directly from the weekly workflow (rather than via GitHub's notification settings), an email-sending Action can be added — but it needs SMTP credentials stored as GitHub secrets, which is more setup and more moving parts. For a non-developer, **routing GitHub's own notifications to the dedicated address (above) is simpler and just as effective** — prefer it unless the owner specifically wants direct custom-address delivery.

## How the skill enforces the gate

- On the **first scan/report**, surface a prominent "Set up your security alerts email" panel as an **outstanding required action** (the HTML report has a dedicated gate callout for this).
- In the checklist, the notifications item is marked a **blocker** — the security setup isn't complete until the address exists and sources are routed.
- Keep re-surfacing it on later runs until the owner confirms it's done. Then confirm which channels are wired.
