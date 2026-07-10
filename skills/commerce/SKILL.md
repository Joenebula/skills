---
name: commerce
description: Use when building anything that sells — the customer-facing shop (catalogue, cart, checkout, discounts, currency, member pricing), the commerce back-office (orders, inventory, promotions, tax/shipping, trade), the money path (gateways, charges, refunds, subscriptions, webhooks, double-charge and dunning bugs), and membership economics (points ledger, tiers, rewards, referrals). Money is re-derived server-side and never trusted from the browser; every financial operation is idempotent; every displayed number reconciles to source. Commerce track ONLY — do NOT invoke for a brochure, portfolio, marketing, or content site that sells nothing; those have no cart or checkout to build. A back-office where nothing is sold is cms + data-grids. Plain sign-in and account settings are auth-and-accounts; a newsletter is email-and-notifications. Invoke only where something is bought, subscribed to, donated, earned, or redeemed.
---

# commerce — the price is the server's truth, the order is sacred, the ledger is auditable

The one core truth: **everything about money, availability, and entitlement must be re-derived server-side, because the customer's browser is not trustworthy and a money bug is the one users never forgive.** A lost order is lost revenue. A double charge is lost trust. A points balance that can't be explained is a liability you can't audit.

This skill covers the whole selling surface as one thing, because its laws cannot be split. A rule stated only in the checkout section is a rule the gateway section does not have.

**Scope guard — commerce track only.** This skill exists for projects that *sell*. On a design, content, or brochure build with no purchase flow it stays silent — never introduce a cart, checkout, order, gateway, or points ledger where nothing is sold. A back-office managing only content or records is [[cms]] + [[data-grids]]. Plain sign-in and account settings are [[auth-and-accounts]]; a newsletter signup is [[email-and-notifications]].

**The boundary holds per surface, not per repo.** Inside a shop, brand, landing, and editorial pages follow the design track ([[frontend-design]], [[cms]]). Product → cart → checkout → account is the commerce path, where **trust and convention outrank visual experimentation** — a surprised shopper abandons. And **content is not catalogue**: editorial pages live in [[cms]]; products, variants, inventory and orders live here. The two have different owners, lifecycles, and integrity rules.

---

## The five laws — they hold on every surface below

### Law 1 — Money is the server's truth

- The **cart lives server-side** (or is server-validated), keyed to the session/customer. The client cart is a *view*, never the truth.
- **Every price, discount, tax, shipping charge, and total is computed server-side** from source at the moment it matters. A total POSTed by the browser is re-derived and re-checked before it is charged, stored, or displayed as an order value ([[security]]).
- **Member prices** are computed server-side from the *verified* member, never from a claimed tier.
- **Money is minor-units + currency** throughout, with a defined and consistent rounding rule ([[data-modelling]]). Display and charge in the customer's currency; the settlement currency is explicit ([[internationalization]]).

### Law 2 — Every financial operation is idempotent

- **One idempotency key, end to end.** A double-submit, a retry, a redelivered webhook, or a reprocessed order produces **one** order, **one** charge, **one** points award — never two ([[background-jobs]]).
- **A network timeout is not a failure.** The charge may have succeeded. Resolve the true state from the gateway; never blind-retry into a double charge.
- Non-existent or already-processed IDs are a **no-op, not an error**.

### Law 3 — Every number reconciles to source

- Every **count, total, KPI, and balance** is an exact `COUNT`/`SUM`/aggregate from the authoritative source — **never `array.length` of a loaded page.** A single query caps at a fixed row count and a bigger `limit` does *not* lift it: page through ([[engineering-standards]] gotcha (a), and the data-reconciliation rule).
- **Ship the check.** Order state, your records, and the gateway must agree; a periodic reconciliation job catches drift. Points liability and active-member counts reconcile from the ledger. If you can't reconcile a number, don't show it ([[regression-testing]]).

### Law 4 — Margin floors are enforced HERE

*This rule has one owner: this file. It binds tier discounts, coupons, and sale prices simultaneously, so no single surface can own it.*

- **Define what combines**: tier discount + coupon + automatic discount + sale price. Stacking is explicit, not emergent.
- **Enforce a margin floor** in the pricing engine so a combined discount can never sell below a set minimum. Stacked benefits are a cost you must bound before they reach a customer.
- The floor is checked wherever a price is computed — storefront display, cart totals, checkout, admin overrides, and B2B/trade pricing alike.

### Law 5 — Tax and shipping rates have ONE source

*Also owned here, for the same reason: two surfaces read them, neither may define them.*

- Rates, classes, and zones are **modelled once** (they live in the back-office data model, §Back-office below) and are **read** by the storefront, the cart, the order, and the invoice.
- Change once, and every surface agrees. A storefront that computes shipping from its own table will silently disagree with the invoice.

---

## Surface — Storefront (the customer-facing shop)

- Product/category pages read the **published** catalogue; status and visibility are respected, so no draft leaks ([[ask-dont-guess]]).
- **Variant selection** drives the real price, SKU, and availability for that exact variant.
- **Availability is honest.** Out-of-stock is shown truthfully; "add to cart" reflects real inventory.
- Fast and mobile-first — most shoppers are on a phone, and speed converts ([[performance]], [[responsive-design]]).
- **Coupons and gift cards** are validated server-side: exists, in-window, not over-used, stacking rules enforced (Law 4). Gift-card balance decrements **atomically**.
- **Age and consent gating** before restricted purchases, remembered and **fail-closed** ([[privacy-and-compliance]]).
- Customer **accounts, addresses, and order history** with proper authz ([[security]], [[auth-and-accounts]]).
- Optional flows — **wishlist, back-in-stock, abandoned-cart** — are real and wired, or absent. Never a faked control.

### Checkout is sacred

- **Idempotent** (Law 2): a double-submit or retry creates one order.
- **Atomic**: reserve stock, take payment, and create the order as one consistent transaction. A failure leaves no half-order and no orphaned charge.
- **No oversell**: inventory is decremented or reserved safely under contention.
- **Recover, don't lose**: a failed payment keeps the cart and explains why. Never silently drop the order or the customer's entered data ([[forms-and-input]]).
- **Confirm** clearly, send the receipt, and run the post-order jobs — email, fulfilment, points — reliably ([[background-jobs]], [[email-and-notifications]]).

---

## Surface — Back-office (the admin)

**An admin is where the business actually runs, so every control must do exactly what it says.** A back-office full of buttons that look right but no-op, or counts that are capped samples, quietly corrupts real operations.

**One module pattern, reused for every entity** (product, order, customer, promotion…). Building a second bespoke pattern is the smell:

1. **List** — search, filter, sort, paginate, bulk actions, export ([[data-grids]]).
2. **Detail** — the record with its related data (an order's lines, payments, fulfilment, history).
3. **Form** — create/edit, with validation and honest save state ([[forms-and-input]]).
4. **Actions** — the verbs (fulfil, refund, publish, archive), each gated and wired to a real backend.

| Module | Must include |
|---|---|
| **Catalogue** | products + **variants** (option matrix, per-variant price/SKU/stock), collections/categories, media, status/visibility. |
| **Orders** | line items, totals that reconcile, payment + fulfilment state, refunds/returns, customer + addresses, a real status lifecycle, packing slip / invoice. |
| **Customers / CRM** | profile, order history, contact log, segments/tags, consent state ([[privacy-and-compliance]]). |
| **Promotions** | coupons, automatic discounts, gift cards — with explicit stacking rules and validity windows (Law 4). |
| **Inventory** | stock per variant/location, adjustments with reason, low-stock signals. The **source of truth for availability**. |
| **Tax & shipping** | rates, classes, and zones. **The single source** every other surface computes from (Law 5). |
| **Trade / wholesale** | account-level pricing, terms, and approval where the business sells B2B. |

- **State transitions are validated server-side** — you cannot refund an unpaid order or fulfil a cancelled one. The lifecycle is enforced, not just labelled.
- Every write is **capability-gated server-side**; destructive and bulk actions are **preview → confirm** ([[security]], [[ask-dont-guess]]).
- **Audit** who changed an order, price, or stock level, and when ([[observability]]).
- Catalogue and inventory edits the storefront reads must stay consistent — change once, sweep both ([[engineering-standards]]).

---

## Surface — Payments (the gateway)

**Keep PCI scope small.** Never let raw card data touch your servers. Use the gateway's hosted fields / tokenisation: you store a **token**, never a PAN or CVV ([[security]]). Store only what you need — last4, brand, token — and treat it as sensitive ([[privacy-and-compliance]]). This single decision evaporates most of PCI scope.

**The webhook is the source of truth.**

| Rule | Why |
|---|---|
| **Confirm via webhook, not the redirect** | the customer's browser may close before the success page; the gateway's async event is authoritative. |
| **Verify the webhook signature** | an unsigned or unverified webhook is forgeable ([[security]]). |
| **Handle webhooks idempotently** | gateways redeliver. Process each event exactly once (Law 2). |
| **Reconcile** | order state, your records, and the gateway must agree (Law 3). |

- **Refunds**: partial and full, idempotent, reflected in the order and in any loyalty effect. Never refund twice.
- **Subscriptions / recurring**: the lifecycle is trial → active → past-due → cancelled, with **retry/dunning** on failed renewals (not instant cancellation), proration on change, and clear cancellation.
- **Failures are explicit and recoverable**: decline reasons surfaced helpfully, cart preserved, no orphaned half-state.
- **Test on sandboxes, never on real money.** Cover the nasty paths: decline, timeout, duplicate webhook, partial refund, renewal failure ([[regression-testing]]).
- Keys are **environment-scoped** (test vs live) and never in code ([[project-setup]]).

---

## Surface — Loyalty (points, tiers, memberships, referrals)

**Points are an append-only ledger.** Never store a single mutable `points` number.

- Store **immutable ledger entries** — earned, redeemed, expired, adjusted — each with reason, timestamp, and source. **The balance is their sum.** This makes every balance auditable and reconstructable: you can always explain how a customer reached their total ([[data-modelling]]).
- **Expiry** runs as a scheduled job that *writes expiry entries*, never a silent reset ([[background-jobs]]).
- **Rewards redeem against the ledger atomically** — no double-spend, no negative balance under contention.
- Earning and redeeming are idempotent (Law 2): an order processed twice does not award twice.

**Tiers** define benefits (discount %, points multiplier, perks). Membership is verified **server-side** before any benefit applies. Stacked benefits are bounded by the margin floor (Law 4).

| Lifecycle state | Handle |
|---|---|
| **Trial → active** | clear start, what's included, when billing begins. |
| **Renewal** | recurring charge; **dunning/retry** on failure, not instant cancellation. |
| **Past-due** | grace period and benefit-suspension rules defined, not ad-hoc. |
| **Change** | upgrade/downgrade with proration; benefits adjust at the right time. |
| **Cancellation** | honest, easy, no dark-pattern maze ([[privacy-and-compliance]]); access runs to period end. |

- **Referrals**: attribute fairly, credit **only on a real qualifying event** (verified signup or purchase), and guard against self-referral and fraud ([[security]]).
- Reward and referral copy states the **real** terms. A benefit that isn't wired is disabled, not faked ([[ask-dont-guess]]).
- A member can **see their balance, tier, history, and benefits**, backed by the ledger, never a cached guess ([[analytics-dashboards]] for the business view).

---

## Stand this up in a new project

- Build the **server-side cart and a single pricing/totals engine** first. Every surface — cart, checkout, emails, admin, invoices — reads totals from it. One source, no drift. The **margin floor** (Law 4) lives inside that engine from day one.
- Make **checkout idempotent and atomic** immediately; it is the costliest thing to retrofit.
- Model the **catalogue (product ↔ variant ↔ inventory)**, the **order lifecycle**, and the **points ledger** deliberately up front ([[data-modelling]]) — all three are painful to change later, and auditability cannot be retrofitted onto a mutable balance.
- Share one **catalogue / inventory / tax / pricing** model between storefront and admin so the two sides cannot disagree.
- Stand up the **reconciliation job** (orders ↔ gateway ↔ ledger) and sandbox tests for the failure paths from the start.

## Cross-links

- [[engineering-standards]] — the reconciliation rule, gotcha (a)'s query cap, shared-mechanism reuse, and server-side write gating.
- [[security]] — never trust a client total; tokenisation; signed webhooks; capability gating; consent.
- [[data-modelling]] — product/variant/inventory, the order lifecycle, the append-only ledger, minor-units money.
- [[data-grids]] — every admin list: search/filter/sort/paginate/bulk/export.
- [[forms-and-input]] — checkout and admin forms that don't lose the customer's work.
- [[background-jobs]] — idempotent webhook processing, post-order jobs, points expiry, dunning, reconciliation.
- [[email-and-notifications]] — receipts and order-lifecycle messages, sent exactly once.
- [[auth-and-accounts]] — customer accounts, sessions, and the signed-out-stays-out gate.
- [[privacy-and-compliance]] — consent state, age gating, honest cancellation, data rights.
- [[cms]] — editorial content, which is *not* catalogue.
- [[regression-testing]] — the money paths that must be proven, not assumed.
