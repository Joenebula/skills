---
name: email-and-notifications
description: Use when sending transactional email, building in-app notifications, or authoring message templates — send off the request path, exactly once per event, from a verified domain, honour preferences, and never fire a real send from dev. A sent message cannot be unsent.
---

# email-and-notifications — outward-facing, exactly once, honestly

The one core truth: **a notification is an outward-facing action — once sent it cannot be unsent, and a double-send, a spam-foldered receipt, or a broken `{{name}}` merge field is a trust breach delivered straight to the user.** Sends are deliberate, idempotent, consented, rendered correctly, and never fired from a dev machine.

Sends run as jobs ([[background-jobs]]); consent and unsubscribe are [[privacy-and-compliance]]; the provider is an integration like any other ([[integrations]]).

## Law 1 — Transactional vs marketing: two lanes, never blurred

- **Transactional** (receipt, verification, reset, security notice) is part of the service — it sends regardless of marketing consent, and contains no marketing.
- **Marketing** requires **consent and a working unsubscribe**, honoured immediately ([[privacy-and-compliance]]). Smuggling promotion into a receipt poisons the transactional lane's deliverability and trust.
- One **shared send service**, two lanes with different rules — not two ad-hoc code paths.

## Law 2 — Async and exactly once

- Sends leave the request path: the request **enqueues, the job sends** ([[background-jobs]], [[performance]]).
- Every send carries an **idempotency key** per (event, recipient, message type) — a retried job, a redelivered webhook, or a double-fired order event produces **one** receipt, not three ([[payments]], [[integrations]]).
- Transient failure retries with backoff; permanent failure **dead-letters visibly** ([[observability]]). An email that silently never sent is the worst outcome — the user is waiting on a reset link that isn't coming.

## Law 3 — Templates render true

- **One layout**, built from the brand's tokens and spelling ([[design-system]]) — not a bespoke design per message.
- **Every merge field resolves.** A shipped "Hi {{first_name}}" or a blank where the order total goes is broken-promise copy ([[ask-dont-guess]]). Missing data has a defined fallback, decided per field.
- **Links are absolute** and built from the canonical site URL — a localhost or preview URL in a production email is the classic env-var miss ([[project-setup]]).
- Provide the **plain-text alternative**; render-test the templates (email clients are hostile); localise like any other user-facing string ([[internationalization]]).
- The copy claims only what happened: "Your order shipped" sends when it *ships*, not when it's created.

## Law 4 — Deliverability and environments

- Send from a **verified domain** (SPF, DKIM, DMARC) with a sensible from-address — or land in spam regardless of content.
- **Handle bounces and complaints**: a suppression list that is actually consulted before every send; repeated hard bounces stop sending.
- **NEVER send real email from dev/test.** Sandbox/capture mode by default outside production — messages go to a log, a capture inbox, or an allowlisted test recipient (the [[payments]] sandbox rule, applied to mail). A test run that emails real customers is an incident.
- Provider keys are environment-scoped ([[project-setup]]); a missing key **disables sending gracefully and honestly** — it never crashes the flow that tried to send, and never pretends it sent ([[observability]], [[integrations]]).

## Law 5 — In-app notifications and preferences

- **Preferences persist AND are honoured** — a notification toggle that saves but doesn't change what's sent is the settings-don't-persist anti-pattern wearing a new hat ([[ask-dont-guess]]). The send service consults preferences at send time.
- **Read/unread state is real** and survives reload; the unread **count reconciles** with its source, never a capped guess ([[engineering-standards]]).
- Notification fan-out (notify N followers) is a job with bounded batches, not an inline loop on the request ([[background-jobs]]).

## The must-pass regression checks

Per [[regression-testing]] / [[preflight]], any change touching messaging must keep these green:

1. **One event → one send** — replay/redeliver the trigger; assert a single message.
2. **Preference honoured** — opted-out recipient receives nothing; assert the absence.
3. **Suppression consulted** — a bounced/unsubscribed address is skipped.
4. **No real sends outside production** — the capture/sandbox mode is asserted, not assumed.
5. **Merge fields resolve** — the rendered output contains no `{{…}}` residue and no empty critical slot.

## Stand this up in a new project

- **One send service** — template rendering, idempotency, suppression, preference check, sandbox mode — built once; every feature sends through it ([[engineering-standards]] change-once).
- **Capture mode wired before the first real send**, and domain verification before launch.
- A **preference model** from the first notification type, not retrofitted at the tenth.

## Cross-links
- [[background-jobs]] — queued sends, retries, dead-letter alerts, scheduled digests.
- [[privacy-and-compliance]] — consent, unsubscribe, and what may be sent to whom.
- [[payments]] / [[storefront]] / [[loyalty]] / [[auth-and-accounts]] — the receipts, resets, and lifecycle messages that flow through this.
- [[integrations]] — the email provider as a fail-soft, key-aware integration.
- [[observability]] — send outcomes logged; silent non-delivery is the worst failure.
- [[ask-dont-guess]] — honest copy, resolved merge fields, no faked "sent" states.
