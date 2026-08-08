---
name: api-design
description: Invoke BEFORE adding or changing an endpoint, route, or service contract — the shape, validation, error format, pagination, idempotency, and versioning. A contract is a promise other code depends on; design it once and don't break it casually.
---

# api-design — the contract is a promise

The one core truth: **every endpoint is a contract something else relies on.** Once a client depends on a shape, changing it breaks them silently. Design the contract deliberately, validate every input, return errors in one predictable form, and evolve it without breaking existing callers.

The data behind the contract is modelled in [[data-modelling]]; how the response degrades and is logged is [[observability]].

## Law 1 — Shape: consistent, predictable, minimal

- **One resource model, used everywhere.** The same entity returns the same fields in list and detail (detail may add more; types never change).
- **Name consistently** — pick a case convention and a pluralisation rule and hold them across the whole surface.
- **Return what the caller needs**, not the whole table; never leak internal/secret fields.
- **Clean, type-owned paths**: every entity type owns its path; all sites that build/parse URLs agree on the shape (the clean-URL rule in [[engineering-standards]]).

## Law 2 — Validate every input, server-side

- Validate against an **explicit schema** at the boundary; reject by default. Never trust client-sent ids, prices, totals, or flags — re-derive or re-check them server-side.
- Coerce and bound: lengths, ranges, enums, types. A missing field and an invalid field get **clear, specific** errors.

## Law 3 — One error format, honest status codes

- **Every** error returns the same envelope: a stable machine `code`, a human `message`, and field-level detail where relevant. Clients should never parse prose.
- Use status codes truthfully: 400 (bad input), 401 (unauthenticated), 403 (unauthorised), 404 (absent), 409 (conflict), 422 (validation), 429 (rate-limited), 5xx (your fault). A 200 wrapping `{"error": …}` is a lie.
- **Never leak** stack traces or upstream errors to the caller ([[observability]]).

## Law 4 — Pagination, idempotency, and big results

| Concern | Rule |
|---|---|
| **Pagination** | Lists are **always** paginated (cursor preferred for stability; offset for jump-to-page). A bigger `limit` does **not** lift a fixed cap — page through for full sweeps (gotcha a in [[engineering-standards]]). |
| **Totals** | A returned `total` is an exact `COUNT`, never the length of a capped page ([[engineering-standards]] reconciliation). |
| **Idempotency** | Writes that can be retried (payments, sync, queued jobs) accept an idempotency key and de-duplicate. See [[background-jobs]]. |
| **Filtering/sorting** | Whitelist sortable/filterable fields; reject arbitrary ones (injection + perf). Mirrors [[data-grids]]. |

## Law 5 — Versioning and evolution

- **Additive changes are safe** (new optional field, new endpoint). **Breaking changes** (remove/rename a field, change a type, tighten validation) need a new version or a deprecation window.
- **Deprecate, don't yank**: announce, run old + new in parallel, migrate callers, then remove.
- **Document the contract** next to the code and keep it current in the same change (Stage 12 in [[engineering-standards]]).

## Stand this up in a new project

- A **shared response/error envelope** and a **shared validation layer** at the boundary — built once, reused by every endpoint (change once = change everywhere).
- A **pagination convention** every list endpoint follows identically.
- A **contract doc / schema** generated or hand-kept, versioned with the code.

## Cross-links
- [[data-modelling]] — the entities the contract exposes; ownership and money/ledger rules.
- [[observability]] — structured logs, error shapes, graceful degradation behind the contract.
- [[data-grids]] — the UI consumer of pagination, filter, and sort contracts.
- [[engineering-standards]] — clean type-owned URLs, the reconciliation rule, keep-docs-current.
