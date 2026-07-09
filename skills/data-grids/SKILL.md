---
name: data-grids
description: Use when building any list, table, or management view of many records — search, filter, sort, paginate/virtualize, bulk actions, and export. Decide server-side vs client-side by data size, and never show a count that's really a capped page.
---

# data-grids — the same list mechanics, everywhere

The one core truth: **a management list is a workhorse, and every workhorse list needs the same mechanics — so build them once and reuse them.** Search, filter, sort, paginate, select-in-bulk, export: a project re-implementing these per screen ends up with ten inconsistent, half-broken lists. One shared grid mechanism, applied everywhere, is the win.

This is the list half of every [[ecommerce-admin]] and [[cms]] module; the contract feeding it is [[api-design]]; large-data behaviour is [[performance]].

## Law 1 — Server-side vs client-side, decided by size

- **Small, bounded** data (hundreds) → client-side filter/sort/paginate is fine and snappy.
- **Large or unbounded** data → **server-side** search/filter/sort/pagination; the client never loads the full set. Crossing this line later is painful — decide by the *expected* size, not the seed data ([[performance]]).
- **Never** "load everything then paginate in the browser" for data that grows.

## Law 2 — Counts and totals are real

- A displayed **total** ("1,248 orders") is an exact `COUNT` from source — **not** the length of the loaded page. A bigger `limit` does **not** lift a fixed query cap; page through for true totals (gotchas a & b in [[engineering-standards]]).
- Pagination shows the **real** range and total; "page 1 of 50" must be true.

## Law 3 — Search, filter, sort — consistent and safe

| Mechanic | Rule |
|---|---|
| **Search** | One search behaviour (debounce, match rule, server vs client) reused across lists — change one, change all ([[engineering-standards]]). |
| **Filter** | Faceted, combinable, clearable; the active filter set is visible. Whitelist filterable fields ([[security]]). |
| **Sort** | Whitelist sortable columns (arbitrary sort = injection + full scans, [[performance]]); show the active sort. |
| **Pagination** | One paginator everywhere (prev/next + jump + page size); **virtualize** very long lists rather than render thousands of rows. |

## Law 4 — Bulk actions and export

- **Bulk select** (row checkbox + select-all + a context action bar) is one shared mechanism on every management list ([[engineering-standards]]).
- **Bulk destructive** actions are **preview → confirm**, server-gated ([[ask-dont-guess]], [[security]]).
- **Select-all across pages** must mean the *query*, not just the loaded page — and say which it is.
- **Export** reflects the *current* filter/sort, comes from source (not the capped page), and runs as a **job** for large sets ([[background-jobs]]).

## Law 5 — Usable on every device

- A wide table needs a deliberate **small-screen treatment** — scroll-within, card view, or prioritised columns — never a sideways-scrolling page ([[responsive-design]]).
- Rows, sort controls, and bulk actions are **keyboard-operable and labelled** ([[accessibility]]).
- **Empty / loading / error** states are distinct and honest ([[ask-dont-guess]]).

## Stand this up in a new project

- Build **one grid mechanism** — search, filter, sort, paginate, virtualize, bulk, export — as shared components, and use it for every list.
- Pair it with a **list API convention** (pagination, filter, sort contract) every endpoint follows ([[api-design]]).
- Default new lists to **server-side** above a small threshold so they don't fall over as data grows.

## Cross-links
- [[engineering-standards]] — the shared search/pagination/bulk mechanisms and the count-vs-capped-page gotchas.
- [[api-design]] — the pagination/filter/sort contract behind the grid.
- [[performance]] — server-side paging and virtualization for large data.
- [[ecommerce-admin]] / [[cms]] — the modules built on this list pattern.
- [[responsive-design]] / [[accessibility]] — usable tables on every device and input.
