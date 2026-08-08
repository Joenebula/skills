---
name: integrations
description: Use when connecting a third-party service — CRM, email, webhooks, or two-way sync. Decide who owns each field, make every sync idempotent, verify inbound webhooks, and degrade gracefully when the other side is down. Their uptime is not yours.
---

# integrations — own the field, sync idempotently, fail soft

The one core truth: **the other system will be slow, down, or out of sync — your job is to keep working anyway and never corrupt data when the two disagree.** A naive integration that trusts the third party, fires on every change without dedup, and crashes when the API is unavailable creates infinite loops, duplicate records, and outages you didn't cause but now own.

Sync jobs run via [[background-jobs]]; field ownership is a [[data-modelling]] decision; erasure must propagate ([[privacy-and-compliance]]).

## Law 1 — Decide field ownership and conflict rules first

- For every shared field, name the **system of record** — who wins when they disagree. Without this, a two-way sync ping-pongs forever.
- **Conflict resolution** is explicit: last-write-wins by timestamp, source-of-truth always wins, or merge — chosen per field, not hoped for.
- **Map fields deliberately** (their schema ↔ yours); don't assume names or shapes match — verify by reading their API.

## Law 2 — Idempotent, loop-safe sync

- Every sync operation is **idempotent** — keyed by a stable external id so re-running or redelivery doesn't duplicate ([[background-jobs]]).
- **Break the echo**: a change you received from them must not immediately sync back as your change (track origin, or suppress the round-trip). This is the classic two-way-sync infinite loop.
- **Reconcile periodically**: a scheduled full compare catches drift that event-by-event sync missed ([[engineering-standards]] reconciliation rule).

## Law 3 — Inbound webhooks are untrusted until verified

| Rule | Why |
|---|---|
| **Verify the signature** | an unsigned webhook is forgeable — reject it. |
| **Idempotent processing** | providers redeliver; process each event id once. |
| **Respond fast, work async** | ack quickly, queue the real work; a slow handler causes retries/duplicates ([[background-jobs]]). |
| **Tolerate out-of-order / replay** | events arrive late or twice; don't assume order. |

## Law 4 — Outbound calls fail soft

- **Never let a third party take you down.** Wrap every outbound call: timeout, retry with backoff, circuit-break, and a **graceful fallback** when it's unavailable ([[observability]]).
- **Key-aware fallback**: a missing/invalid API key disables *that* feature cleanly with an honest message — the rest of the app keeps working ([[observability]]).
- **Rate-limit respect**: honour their limits; queue and throttle rather than hammer ([[background-jobs]]).
- **Never block a user request** on a slow external call — do it async where possible ([[performance]]).

## Law 5 — Secrets, data, and honesty

- Integration secrets are **environment-scoped**, never committed ([[project-setup]]).
- **Propagate compliance**: erasure/rectification must reach synced third parties ([[privacy-and-compliance]]).
- An integration that's **not wired** is disabled/labelled, never a faked "connected" badge.

## Stand this up in a new project

- A **sync abstraction**: idempotent operations, field-ownership map, conflict rules, origin-tracking — built once per integration, not ad-hoc per call site.
- A **signed-webhook receiver** + **outbound client** with timeout/retry/circuit-breaker/fallback as shared infrastructure.
- A **reconciliation job** and an integration **health/status** surface ([[observability]]).

## Cross-links
- [[background-jobs]] — idempotent sync, async webhook processing, scheduled reconciliation, rate-limit-respecting queues.
- [[observability]] — key-aware fallbacks, circuit-breaking, integration health and alerts.
- [[data-modelling]] — field ownership and the source-of-truth decision.
- [[privacy-and-compliance]] — propagate erasure/rectification to third parties.
