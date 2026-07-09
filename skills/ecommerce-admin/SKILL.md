---
name: ecommerce-admin
description: Use when building or extending a commerce back-office — catalogue, orders, customers, promotions, inventory, tax/shipping, and trade. Build every module on one list→detail→form pattern, and never let an admin control claim an action it doesn't perform. Commerce track ONLY — a content/admin back-office where nothing is sold is cms + data-grids, not this skill.
---

# ecommerce-admin — one pattern, every module wired for real

The one core truth: **an admin is where the business actually runs, so every control must do exactly what it says.** A back-office full of buttons that look right but no-op, or counts that are capped samples, quietly corrupts real operations. Build each area on the same proven module pattern, and hold the [[ask-dont-guess]] honesty bar on every control.

Every list is a [[data-grids]] surface; every form is a [[forms-and-input]] surface; every entity is a [[data-modelling]] decision; numbers obey the reconciliation rule in [[engineering-standards]].

**Scope guard — commerce track only.** Invoke for the back-office of a business that sells. A back-office managing only content or records is [[cms]] + [[data-grids]] — don't bring order/inventory/promotion modules where nothing is sold. The split holds inside a shop too: editorial pages (about, journal, landing) are [[cms]] content; products, variants, inventory, and orders are this skill's modules. Never model products as CMS pages or pages as products — they have different owners, lifecycles, and integrity rules.

## Law 1 — One module pattern, reused everywhere

Each entity (product, order, customer, promotion…) is the **same shape**, built once and reused:

1. **List** — search + filter + sort + paginate + bulk actions + export ([[data-grids]]).
2. **Detail** — the record with its related data (an order's lines, payments, fulfilment, history).
3. **Form** — create/edit with validation and honest save state ([[forms-and-input]]).
4. **Actions** — the verbs (fulfil, refund, publish, archive), each gated and wired to a real backend.

Building a second bespoke pattern is the smell — reuse the shared mechanisms ([[engineering-standards]]).

## Law 2 — The core modules and what each owes

| Module | Must include |
|---|---|
| **Catalogue** | products + **variants** (option matrix, per-variant price/SKU/stock), collections/categories, media, status/visibility. |
| **Orders** | line items, totals that reconcile, payment + fulfilment state, refunds/returns, customer + addresses, a real status lifecycle, packing slip / invoice. |
| **Customers / CRM** | profile, order history, contact log, segments/tags, consent state ([[privacy-and-compliance]]). |
| **Promotions** | coupons, automatic discounts, gift cards — with clear stacking rules and validity windows. |
| **Inventory** | stock per variant/location, adjustments with reason, low-stock signals; the source of truth for availability. |
| **Tax & shipping** | rates/classes/zones the storefront and orders compute from consistently. |
| **Trade / wholesale** | account-level pricing, terms, and approval where the business sells B2B. |

## Law 3 — Numbers and state are real, not decorative

- Every **count, total, KPI** is an exact aggregate from source, never the length of a capped page (reconciliation rule, [[engineering-standards]]).
- **Money** is minor-units + currency; order totals are derived and verified, never trusted from the client ([[data-modelling]], [[payments]]).
- **State transitions are validated** server-side (you can't refund an unpaid order, fulfil a cancelled one) — the lifecycle is enforced, not just labelled.

## Law 4 — Gated, audited, and safe

- Every write is **capability-gated server-side**; destructive/bulk actions are **preview → confirm** ([[security]], [[ask-dont-guess]]).
- **Audit** who changed an order/price/stock and when ([[observability]]).
- Catalogue/inventory edits the **storefront reads** must stay consistent — change once, sweep both ([[storefront]]).

## Stand this up in a new project

- Build the **module pattern + shared grid/form/action mechanisms first**; then each entity is fast and consistent.
- Model the catalogue (product↔variant↔inventory) and the order lifecycle deliberately up front ([[data-modelling]]) — they're the hardest to change later.
- Wire **role/capability gating** and **audit** from the first module, not retrofitted.

## Cross-links
- [[data-grids]] — every list: search/filter/sort/paginate/bulk/export.
- [[forms-and-input]] — every create/edit form, with honest save state.
- [[data-modelling]] — product/variant/inventory and the order lifecycle.
- [[storefront]] — the customer-facing side that reads the same catalogue/inventory/pricing.
- [[payments]] / [[loyalty]] — order settlement, refunds; member pricing and points.
- [[engineering-standards]] — shared mechanisms, reconciliation, write-path gating.
