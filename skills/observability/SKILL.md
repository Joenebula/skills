---
name: observability
description: Invoke when adding error handling, logging, monitoring, or a failure path — log with structure and context, degrade gracefully, alert on what matters, and never fail silently. If you can't see it happening, you can't fix it.
---

# observability — if you can't see it, you can't fix it

The one core truth: **a failure you can't observe is a failure you'll find out about from a user.** Production will break in ways you didn't predict; the question is whether you see it, understand it, and recover — or whether it fails silently and rots. Log with intent, surface health, and make every failure path deliberate.

Errors must never leak secrets/PII/stack traces to users; the contract's error shapes are [[api-design]].

## Law 1 — Never fail silently

- Every failure does **something visible**: a logged error with context, a user-facing fallback, an alert — never a swallowed exception and a blank screen.
- **Empty/zero is ambiguous** — distinguish "genuinely none" from "failed to load" from "not permitted". A zeroed metric that should have data is the data-not-loaded anti-pattern.
- A caught error you can't handle is **re-raised or reported**, not discarded.

## Law 2 — Structured logging with context

- Log **structured** (key-value/JSON), not prose strings — so you can search and aggregate.
- Every log line carries **context**: a request/correlation id, the actor (not their secrets), the operation, the outcome. A trace across services shares the id.
- **Right levels**: error (needs attention), warn (suspicious), info (key events), debug (off in prod). Don't log a flood; don't log nothing.
- **Never log** secrets, tokens, passwords, full PII, or card data ([[privacy-and-compliance]]).

## Law 3 — Degrade gracefully

| Situation | Behaviour |
|---|---|
| **A dependency/integration is down** | Catch, fall back, keep the rest of the page working — the key-aware fallback ([[integrations]]). |
| **A missing API key/config** | Disable that feature cleanly with an honest message, don't crash the app. |
| **Partial data** | Show what you have + a clear state for what failed, not a total blank. |
| **An unexpected error** | A friendly error boundary, not a stack trace; the detail goes to the logs. |

Graceful degradation is the difference between "one widget is unavailable" and "the whole page is down".

## Law 4 — Monitor and alert on what matters

- **Health checks** for the app and its critical dependencies.
- **Error tracking** that captures the exception, context, and frequency — and groups them so a spike is obvious.
- **Alert on symptoms users feel** (error rate, latency, failed jobs, queue depth) — not on every log line. An alert that fires constantly gets ignored ([[background-jobs]] for job-failure alerts).
- Track the **KPIs that prove the system is doing its job**, distinct from product analytics ([[analytics-dashboards]]).

## Stand this up in a new project

- A **logging helper** and an **error boundary/handler** wired once, used everywhere — structured + context by construction.
- **Error tracking + health checks + alerting** from early, not after the first incident.
- A **correlation id** threaded through requests and jobs so you can follow one flow end-to-end.
- Make "what happens when this fails?" a required question in [[reviewing-code]] and the build pipeline ([[engineering-standards]]).

## Cross-links
- [[privacy-and-compliance]] — what you may and may not log/retain about people.
- [[integrations]] — key-aware fallbacks when a third party is down.
- [[background-jobs]] — alert on failed/stuck jobs and dead-letter growth.
- [[api-design]] — consistent error envelopes behind the contract.
