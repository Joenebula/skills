---
name: analytics-dashboards
description: Use when building metrics, reports, KPIs, or a dashboard — define the metric precisely first, compute it from the authoritative source, and show it honestly. A number whose definition is fuzzy or whose source is a capped sample is worse than no number.
---

# analytics-dashboards — define the metric before you draw the chart

The one core truth: **a metric is only as trustworthy as its definition and its source** — and a confidently-displayed wrong number drives confidently-wrong decisions. Most dashboard failures are not chart bugs; they're a vague definition ("active users" — over what window?) or a count taken from a capped query. Pin the definition, compute from source, then visualise.

Every displayed number obeys the data-reconciliation rule in [[engineering-standards]]; the aggregates come from [[data-modelling]].

## Law 1 — Define each metric precisely, first

- Write the **exact definition**: what's counted, the **time window**, the filters, the unit, how edge cases are handled. "Revenue" = gross or net? incl. refunds? which currency? ([[internationalization]]).
- **Name it unambiguously** on the dashboard so two people read it the same way.
- Separate **product/business analytics** (orders, revenue, conversion, retention) from **system/operational metrics** (latency, error rate, job health — those live in [[observability]]).

## Law 2 — Compute from the authoritative source

- Every figure is an **exact `COUNT`/`SUM`/aggregate** from the source of truth — **never `array.length` of a capped page** (gotchas a & b in [[engineering-standards]]).
- For full-population stats, **page through** or aggregate in the database; don't sample a window and present it as a total.
- **Reconcile**: ship a check that the displayed number equals its source within tolerance. If you can't reconcile it, don't show it ([[engineering-standards]], [[regression-testing]]).
- Heavy aggregations run as **jobs** into a summary table, not live on every page load ([[background-jobs]], [[performance]]).

## Law 3 — Visualise honestly

| Rule | Why |
|---|---|
| **Right chart for the question** | trend → line; composition → bar/stacked; share → proportion. Don't decorate. |
| **Honest axes** | start at zero for magnitude; no truncated axis that exaggerates. |
| **Show the window + filters** | a number without its date range is meaningless. |
| **Empty/loading/error are distinct** | a true zero ≠ "not loaded" ≠ "no access" ([[observability]]). |
| **Comparison gives meaning** | vs previous period / target / segment — a lone number rarely informs. |
| **Accessible** | not colour-only; readable contrast; a table alternative ([[accessibility]]). |

## Law 4 — Interaction and export

- **Date-range and segment controls** that actually re-query, with a sensible default.
- **Drill-down** from a summary to the underlying rows so a surprising number can be investigated.
- **Export** (CSV) for the figures shown, matching what's on screen exactly ([[data-grids]]).

## Stand this up in a new project

- A **metric catalogue**: each KPI's definition, source query, and owner — the single reference so definitions don't drift.
- A **summary/aggregation layer** (jobs → summary tables) for anything expensive, with reconciliation checks.
- A **reusable chart + date-range + export** set so dashboards compose consistently.

## Cross-links
- [[engineering-standards]] — the data-reconciliation rule and the capped-query gotchas (the heart of trustworthy metrics).
- [[data-modelling]] — the aggregates and summary tables behind each metric.
- [[background-jobs]] — pre-compute heavy aggregations off the request path.
- [[observability]] — system/operational metrics, distinct from product analytics.
- [[data-grids]] — drill-down rows and export of the displayed figures.
