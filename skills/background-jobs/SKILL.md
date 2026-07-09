---
name: background-jobs
description: Invoke when work should happen off the request — scheduled tasks, queues, async processing, retries, and lifecycle automation. Make every job idempotent, retry-safe, and observable; a job that silently fails or double-charges is worse than no job.
---

# background-jobs — idempotent, retry-safe, observable

The one core truth: **a background job runs unattended, so it must be safe to run twice and loud when it fails.** Anything slow, scheduled, or triggered-by-time belongs off the request path — but the moment work leaves the user's sight, "it failed silently" and "it ran twice" become the default failure modes unless you design them out.

Heavy work moves here from the request ([[performance]]); failures surface through [[observability]].

## Law 1 — What belongs off the request

Move work out of the user's request when it is slow, periodic, or fan-out:
- **Slow/heavy**: report generation, bulk import/export, image processing, large emails.
- **Scheduled**: nightly digests, retention purges ([[privacy-and-compliance]]), points/credit expiry ([[commerce]]), sale activation, subscription renewals.
- **Reactive**: send-on-event, sync-on-change ([[integrations]]), abandoned-flow follow-ups.

The request returns fast and enqueues; the job does the work.

## Law 2 — Idempotent, always

- A job may run **more than once** (retry, redelivery, overlap). Design every job so a second run is a **no-op**, not a double-effect.
- Use an **idempotency key / processed-marker** so "send the email", "charge the card" ([[commerce]]), "award the points" happen **once** even if delivered twice.
- Guard against **overlap**: a long job that's still running when the next tick fires must not stomp itself (a lock or a "skip if running").

## Law 3 — Retry, back off, and dead-letter

| Concern | Rule |
|---|---|
| **Transient failure** | Retry with **exponential backoff** + jitter — don't hammer a struggling dependency. |
| **Permanent failure** | Stop after N attempts; move to a **dead-letter** queue for inspection, don't retry forever. |
| **Poison message** | One bad item must not block the whole queue — isolate and continue. |
| **Partial progress** | A batch job records what it finished so a retry resumes, not restarts. |

## Law 4 — Observable and bounded

- **Log every run** (started, finished, item counts, outcome) with a correlation id ([[observability]]).
- **Alert on**: failure rate, stuck/overdue schedules, growing queue depth, dead-letter growth. A job that quietly stops is the worst case.
- **Bound resource use**: page through large data sets (don't load all rows — the cap gotcha in [[engineering-standards]]); throttle so a job doesn't exhaust the database or a rate-limited API.

## Law 5 — Scheduling discipline

- Schedules are **declared and versioned**, not set by hand in a console.
- **Time zones and DST**: a "daily at 9am" job needs a defined zone; UTC for storage, explicit zone for intent ([[internationalization]]).
- A **missed run** (downtime) has a defined behaviour — catch up, or skip — never undefined.

## Stand this up in a new project

- A **queue + worker** (or scheduler) chosen for the stack; a single **job-runner pattern** every job follows (idempotency key, retry policy, logging) — built once, reused.
- A **dead-letter + alerting** path from the first job.
- A **catalogue of scheduled jobs** with their cadence, zone, and owner, kept current ([[engineering-standards]] Stage 12).

## Cross-links
- [[performance]] — move heavy/slow work off the request path.
- [[observability]] — structured run logs and alerts on failed/stuck/dead-lettered jobs.
- [[integrations]] — sync and webhook-driven jobs; idempotency on redelivery.
- [[commerce]] — charge/refund jobs must be exactly-once via idempotency keys.
- [[email-and-notifications]] — queued sends, digests, and fan-out run here, exactly once.
- [[privacy-and-compliance]] / [[commerce]] — retention purges, points expiry, lifecycle automation.
