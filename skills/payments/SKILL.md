---
name: payments
description: Use when taking money — gateways, charges, refunds, subscriptions, and webhooks. Keep card data off your servers, make every charge idempotent, and treat the gateway webhook as the source of truth. Money bugs are the ones users never forgive. Invoke ONLY when the project genuinely moves money (purchases, subscriptions, donations) — never for a site with no payment flow.
---

# payments — the gateway is the truth, exactly once

The one core truth: **money is the one place a bug is unforgivable — a double charge, a lost payment, or a wrong total destroys trust instantly.** So you minimise what you touch (never hold card data), make every operation safe to retry (idempotency), and let the **gateway's confirmation** — not your optimistic UI — be what marks an order paid.

Drives checkout in [[storefront]]; reconciles against orders in [[ecommerce-admin]]; runs settlement jobs via [[background-jobs]].

**Scope guard.** Only for projects that genuinely move money. If nothing is bought, subscribed to, or donated, this skill stays silent — never scaffold gateways, charge services, or payment webhooks speculatively. A gateway integration with no live purchase behind it is unused attack surface and a broken promise waiting to be found ([[ask-dont-guess]]).

## Law 1 — Keep PCI scope small

- **Never let raw card data hit your servers.** Use the gateway's hosted fields / tokenisation; you store a **token**, never a PAN/CVV ([[security]]).
- This is the single biggest risk reducer — most of PCI scope evaporates when card data never touches you.
- Store only what you need (last4, brand, token) and treat it as sensitive ([[privacy-and-compliance]]).

## Law 2 — Idempotent, exactly once

- Every charge/refund carries an **idempotency key** so a retry, double-click, or redelivered webhook produces **one** financial effect ([[storefront]], [[background-jobs]]).
- Re-deriving and re-checking the **amount server-side** before charging — never charge a total the client sent ([[security]]).
- A network timeout is **not** a failure — the charge may have succeeded; resolve the true state via the gateway, don't blindly retry into a double charge.

## Law 3 — The webhook is the source of truth

| Rule | Why |
|---|---|
| **Confirm via webhook, not the redirect** | the customer's browser may close before the success page; the gateway's async event is authoritative. |
| **Verify the webhook signature** | an unsigned/unverified webhook is forgeable ([[security]]). |
| **Make webhook handling idempotent** | gateways redeliver; process each event once ([[background-jobs]]). |
| **Reconcile** | order state, your records, and the gateway must agree; a periodic reconciliation job catches drift ([[engineering-standards]] reconciliation rule). |

## Law 4 — Refunds, subscriptions, and failures

- **Refunds**: partial and full, idempotent, reflected in the order and any loyalty effects ([[loyalty]]); never refund twice.
- **Subscriptions/recurring**: lifecycle (trial → active → past-due → cancelled), retry/dunning on failed renewals, proration on change, clear cancellation — see [[loyalty]] for membership billing.
- **Failures are explicit and recoverable**: decline reasons surfaced helpfully, cart preserved, no orphaned half-state ([[forms-and-input]]).
- **Currency**: charge and settle in defined currencies with correct minor-units and rounding ([[internationalization]], [[data-modelling]]).

## Law 5 — Test on sandboxes, never on real money

- Build and test against the gateway's **sandbox/test mode** with test cards; never exercise flows against live money.
- Cover the nasty paths: decline, timeout, duplicate webhook, partial refund, subscription renewal failure ([[regression-testing]]).
- Keys are environment-scoped (test vs live), never in code ([[security]], [[project-setup]]).

## Stand this up in a new project

- Choose a gateway with **hosted fields + webhooks**; integrate via tokenisation so card data never lands on you.
- Build a **single charge/refund service** with idempotency keys and signed-webhook handling, reused everywhere.
- A **reconciliation job** (orders ↔ gateway) and sandbox-based tests for the failure paths from the start.

## Cross-links
- [[storefront]] — the checkout flow that calls payments; idempotent and atomic.
- [[ecommerce-admin]] — orders, refunds, and payment state reconciled here.
- [[security]] — tokenisation, no raw card data, signed webhooks, no client-trusted amounts.
- [[background-jobs]] — idempotent webhook processing and reconciliation jobs.
- [[loyalty]] — subscription billing, refunds' effect on points/tier.
- [[engineering-standards]] — reconcile your records against the gateway's truth.
