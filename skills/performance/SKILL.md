---
name: performance
description: Invoke when a page, query, list, or asset feels slow or will grow — measure first, then fix the biggest cost. Paginate, avoid N+1, cache deliberately, and budget images and bundles. Optimise what you measured, never what you guessed.
---

# performance — measure first, fix the biggest cost

The one core truth: **you cannot optimise what you haven't measured, and the bottleneck is rarely where you'd guess.** Profile, find the dominant cost, fix that one thing, measure again. Speculative micro-tuning adds complexity and risk for nothing; one measured fix to the real bottleneck is the whole win.

## Law 1 — Measure before you touch anything

- Reproduce the slowness, **profile it**, and identify the **dominant** cost (a query, a render, an asset, a round-trip). Fix that first.
- Set a **budget** so "fast enough" is defined, not a feeling — page weight, time-to-interactive, query time, list size. Test against the budget.
- Re-measure after each change. If the number didn't move, revert the complexity.

## Law 2 — The data layer is the usual culprit

| Problem | Fix |
|---|---|
| **N+1 queries** | One query per row in a loop → batch into a single query / join / `IN` set. The most common server slowdown. |
| **Unbounded results** | Never load "all rows". Paginate or stream; a list that's fine at 100 rows dies at 100k ([[api-design]], [[data-grids]]). |
| **Missing indexes** | Filter/sort/join on an unindexed column → full scan. Index what you query by; verify with the query plan. |
| **Over-fetching** | Select the columns you use, not `*`; return what the caller needs ([[api-design]]). |
| **Repeated identical work** | Cache it (below). |

## Law 3 — Cache deliberately, invalidate honestly

- Cache the **expensive and stable** — but own the invalidation. A stale cache showing a wrong number is the data-reconciliation failure in [[engineering-standards]].
- Layer where it pays: in-memory, shared cache, CDN/edge for static + cacheable responses.
- A cached **count/KPI** must still reconcile to source on a defined cadence, or it's a silent lie ([[ask-dont-guess]]).

## Law 4 — Frontend weight and rendering

- **Images**: right-sized, modern formats, compressed, lazy-loaded below the fold, with explicit dimensions to avoid layout shift. Often the single biggest payload ([[responsive-design]]).
- **Bundles**: split by route, defer non-critical scripts, drop unused dependencies; ship to a phone what a phone needs, not the desktop bundle.
- **Virtualise** long lists/grids — render the visible window, not 10k rows ([[data-grids]]).
- Avoid layout thrash and needless re-renders; do expensive work off the critical path.

## Law 5 — Scale is a design decision, not a later patch

- Know the **growth axis** (rows, users, traffic) and design the slow paths for the *expected* size, not today's seed data.
- Long/heavy work → move it **off the request** into a job ([[background-jobs]]).
- Load-test the paths that will grow before they do; degrade gracefully under spikes ([[observability]]).

## Stand this up in a new project

- A **performance budget** in the definition of done; a check that flags regressions ([[regression-testing]]).
- **Pagination + virtualization** as defaults for any list, from the first one.
- Index review as part of [[data-modelling]] and [[code-review]].
- Real-user + synthetic monitoring so you see slowness before users complain ([[observability]]).

## Cross-links
- [[engineering-standards]] — the query-cap gotcha and the data-reconciliation rule for cached numbers.
- [[api-design]] — pagination, idempotency, and not over-fetching at the contract.
- [[data-grids]] — virtualization and server-side paging for large tabular data.
- [[background-jobs]] — move heavy work off the request path.
- [[observability]] — measure real-world performance and catch regressions.
