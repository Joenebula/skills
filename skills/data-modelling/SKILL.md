---
name: data-modelling
description: Invoke BEFORE creating or changing any table, column, relation, enum, or migration — model the entities first, change the schema additively and reversibly, and never run a destructive migration without a confirmed backup. The schema outlives the code.
---

# data-modelling — the schema outlives the code

The one core truth: **a bad schema is the most expensive mistake in the project.** Code is cheap to rewrite; data is not. A wrong column name ships forever, a lost migration loses real records, and a model that doesn't match reality forces every feature above it to lie. Model deliberately, migrate safely.

For anything touching live data, [[engineering-standards]] (data-gotchas + reconciliation) and [[ask-dont-guess]] (never guess a field exists — read it) are mandatory companions.

## Law 1 — Model the entities before you touch a schema

1. **List the nouns** the feature deals with and what each *is* (not how it's stored).
2. **Define relations** — one-to-many, many-to-many (needs a join table), one-to-one. Draw it.
3. **Pick the keys** — a stable surrogate id; natural keys only when truly immutable.
4. **Decide ownership** — who is the source of truth for each field? (Critical when a value also lives in another system — see [[integrations]].)
5. **Name for clarity and forever** — names are user-facing to every future developer; renaming a column is a migration, so get it right once. Anything user-facing → confirm the name, don't guess ([[ask-dont-guess]]).

## Law 2 — Normalise, then denormalise only with a reason

- Default to **normalised**: one fact in one place. A value stored twice will drift.
- Denormalise (a cached count, a copied label) **only** for a measured read cost, and then you **own the consistency** — every write updates both, and a reconciliation check asserts they agree ([[engineering-standards]]).
- A **money** value is minor-units integer + currency, never a float. A **point/credit** balance is an append-only ledger you sum, never a mutable number — see [[commerce]].

## Law 3 — Migrations are additive, reversible, and ordered

| Rule | Why |
|---|---|
| **Additive first** | Add column/table, backfill, switch reads, *then* (much later) drop the old. Never add-and-drop in one step on a live system. |
| **Reversible** | Every migration has a tested down path, or a forward-fix plan. "How do I undo this?" answered before you run it. |
| **Backfill safely** | New non-null column → add nullable, backfill in batches, then enforce. A single mass `UPDATE` can lock the table. |
| **Enums are append-only at first** | Never query a value a not-yet-applied change adds — it errors the whole query. Add the value, deploy, *then* use it (gotcha c in [[engineering-standards]]). |
| **One concern per migration** | Small, named, ordered. A migration that does five things can't be partly rolled back. |

## Law 4 — Destructive changes are confirmed, never casual

Drop column, drop table, mass delete, type change that loses precision → **STOP**, confirm a backup exists, preview the row count, and get an explicit yes ([[ask-dont-guess]]). Prefer **soft-delete** (a recoverable archive) over a hard delete on anything a user created — the shared soft-delete mechanism in [[engineering-standards]].

## Law 5 — Seeds and fixtures are idempotent and honest

- A seed re-runs safely (upsert by stable key), never duplicating or clobbering edited data.
- Demo/sample data is **clearly separable** from real and stripped on live surfaces — an undisclosed fixture is a lie ([[ask-dont-guess]]).
- Ship reference/default data as code the bundler embeds, not files written at runtime (gotcha d in [[engineering-standards]]).

## Stand this up in a new project

- Keep the schema in **version-controlled migrations**, never hand-edited in a console.
- One **migration-order doc** so enum/column adds land before the code that reads them ([[project-setup]] covers the bootstrap order).
- A **reconciliation check** in the test suite: displayed counts == source aggregates ([[regression-testing]]).
- A **gotchas list** that grows every time the data bites you.

## Cross-links
- [[engineering-standards]] — the data-gotchas list, the data-reconciliation rule, and the soft-delete mechanism.
- [[ask-dont-guess]] — verify a field/route/value EXISTS by reading it; never infer from a sibling.
- [[api-design]] — the contract that exposes the model; pagination and validation live there.
- [[integrations]] — field-ownership and conflict rules when data is shared with another system.
- [[project-setup]] — bootstrap order, migration gotchas, admin/seed setup.
