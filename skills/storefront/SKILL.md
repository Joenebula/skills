---
name: storefront
description: Use when building the customer-facing shop — product/category pages, cart, checkout, discounts, currency, and member pricing. The cart and every price are computed server-side from source; never trust a total the browser sends, and never let checkout lose an order. Commerce track ONLY — do NOT invoke for a brochure, portfolio, marketing, or content site that sells nothing; those have no cart or checkout to build.
---

# storefront — the price is the server's truth, the order is sacred

The one core truth: **everything about money and availability must be re-derived server-side, because the customer's browser is not trustworthy and a lost order is lost revenue.** The storefront can *display* prices and totals, but it never *decides* them — and the checkout path is the one flow that absolutely cannot drop, double-charge, or oversell.

Reads the same catalogue/inventory/pricing as [[ecommerce-admin]]; settles via [[payments]]; member pricing comes from [[loyalty]].

**Scope guard — commerce track only.** This skill exists for projects that sell. On a design/content build with no purchase flow it stays silent — never introduce a cart, checkout, or order concept where nothing is sold. Inside a shop the boundary is per surface: brand, landing, and editorial pages follow the design track ([[frontend-design]], [[cms]]); this skill owns product → cart → checkout, and on that path **trust and convention outrank visual experimentation** — a surprised shopper abandons.

## Law 1 — Catalogue and product pages

- Product/category pages read the **published** catalogue (status/visibility respected — no draft leaking, [[ask-dont-guess]]).
- **Variant selection** drives the real price/SKU/availability for that exact variant ([[ecommerce-admin]], [[data-modelling]]).
- **Availability is honest** — out-of-stock is shown truthfully; "add to cart" reflects real inventory.
- Fast and mobile-first — most shoppers are on a phone, and speed converts ([[performance]], [[responsive-design]]).

## Law 2 — Cart and pricing are server-authoritative

- The **cart lives server-side** (or is server-validated) keyed to the session/customer; the client cart is a view, not the truth.
- **Every price, discount, tax, shipping, and total is computed server-side** from source at the moment it matters. A total POSTed by the browser is re-derived and re-checked — never trusted ([[security]]).
- **Money** is minor-units + currency throughout ([[data-modelling]]); rounding is defined and consistent.

## Law 3 — Discounts, currency, and member pricing

| Concern | Rule |
|---|---|
| **Coupons / gift cards** | Validated server-side: exists, in-window, not over-used, stacking rules enforced. Gift-card balance decremented atomically ([[ecommerce-admin]]). |
| **Currency** | Display and charge in the customer's currency with correct formatting; the settlement currency is explicit ([[internationalization]], [[payments]]). |
| **Member pricing** | Tier discounts/points apply from the verified member, server-side, with margin floors respected ([[loyalty]]). |
| **Tax & shipping** | Computed from the same rates/zones the admin owns — change once, both agree ([[ecommerce-admin]]). |

## Law 4 — Checkout is sacred

- **Idempotent**: a double-submit or retry creates **one** order, not two — idempotency key end-to-end ([[payments]], [[background-jobs]]).
- **Atomic**: reserve stock, take payment, create the order as one consistent transaction; a failure leaves no half-order and no orphaned charge.
- **No oversell**: inventory is decremented/reserved under contention safely.
- **Recover, don't lose**: a failed payment keeps the cart and explains; never silently drop the order or the customer's entered data ([[forms-and-input]]).
- **Confirm** clearly and send the receipt; the post-order jobs (email, fulfilment, points) run reliably ([[background-jobs]]).

## Law 5 — Trust, consent, and the extras

- **Age/consent gating** before restricted purchases, remembered and fail-closed ([[privacy-and-compliance]]).
- Customer **accounts, addresses, order history** with proper authz ([[security]]).
- Optional flows — **wishlist, back-in-stock, abandoned-cart** — are real and wired or absent, never faked controls.

## Stand this up in a new project

- Build the **server-side cart + a single pricing/totals engine** first; every surface (cart, checkout, emails, admin) reads totals from it — one source, no drift.
- Make **checkout idempotent and atomic** from day one; it's the costliest thing to get wrong later.
- Share the **catalogue/inventory/tax/pricing** model with the admin so the two sides can't disagree ([[ecommerce-admin]]).

## Cross-links
- [[payments]] — gateways, idempotent charge/refund, webhook reconciliation.
- [[ecommerce-admin]] — the same catalogue, inventory, pricing, tax/shipping, orders.
- [[loyalty]] — member pricing, points earn/spend, margin floors.
- [[security]] — never trust client totals; authz on accounts; consent gating.
- [[forms-and-input]] — checkout forms that don't lose the customer's work.
- [[background-jobs]] — reliable post-order email/fulfilment/points/abandoned-cart.
- [[email-and-notifications]] — the receipt and order-lifecycle messages, sent exactly once.
- [[auth-and-accounts]] — customer accounts, sessions, and the signed-out-stays-out gate.
