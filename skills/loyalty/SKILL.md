---
name: loyalty
description: Use when building memberships, subscriptions, points, rewards, or referrals — tiers, billing lifecycle, an append-only points ledger, and member pricing. Track points as a ledger you sum, never a mutable balance, and protect your margins when discounts stack. Commerce track ONLY — plain user accounts are auth-and-accounts and a newsletter is email-and-notifications; do NOT invoke where nothing is earned, redeemed, or billed.
---

# loyalty — a ledger you sum, margins you protect

The one core truth: **a loyalty balance is financial state, so it must be auditable and reconstructable — and member discounts are a cost you have to bound.** A points "balance" stored as one mutable number can't be audited and will drift; stacked tier discounts plus a coupon can quietly sell below cost. Model points as an append-only ledger, and enforce margin floors.

Subscription billing runs through [[payments]]; member pricing applies in [[storefront]]; expiry/renewal run as [[background-jobs]].

**Scope guard — commerce track only.** Points, tiers, and paid memberships presuppose something earned, redeemed, or billed. Plain sign-in and account settings are [[auth-and-accounts]]; a newsletter signup is [[email-and-notifications]]. Don't reach for a ledger, tier, or referral scheme on a build where nothing is sold — an empty loyalty programme is complexity with no member.

## Law 1 — Points are an append-only ledger

- **Never** store a single mutable `points` number. Store **immutable ledger entries** (earned, redeemed, expired, adjusted, each with reason + timestamp + source); the **balance is their sum**.
- This makes every balance **auditable and reconstructable** — you can always explain how a customer reached their total ([[data-modelling]], [[engineering-standards]] reconciliation).
- Earning/redeeming is **idempotent** — an order processed twice doesn't award twice ([[background-jobs]], [[payments]]).
- **Expiry** runs as a scheduled job that writes expiry entries, not a silent reset ([[background-jobs]]).

## Law 2 — Tiers and member pricing, with margin floors

- **Tiers** define benefits (discount %, points multiplier, perks). Membership is verified **server-side** before any benefit applies ([[security]]).
- **Stacking is bounded**: define what combines (tier discount + coupon + sale) and enforce a **margin floor** so combined discounts can't sell below a set minimum ([[storefront]]).
- Member prices are computed **server-side from the verified member**, never trusted from the client.

## Law 3 — Subscription / membership lifecycle

| State | Handle |
|---|---|
| **Trial → active** | clear start, what's included, when billing begins. |
| **Renewal** | recurring charge via [[payments]]; **dunning/retry** on failure, not instant cancellation. |
| **Past-due** | grace period + benefit suspension rules defined, not ad-hoc. |
| **Change** | upgrade/downgrade with proration; benefits adjust at the right time. |
| **Cancellation** | honest, easy, no dark-pattern maze ([[privacy-and-compliance]] cancellation rights); access runs to period end. |

## Law 4 — Rewards and referrals

- **Rewards** redeem against the ledger atomically — no double-spend, no negative balance under contention.
- **Referrals**: attribute fairly, credit **only on a real qualifying event** (verified signup/purchase), and guard against self-referral/fraud ([[security]]).
- Reward/referral copy states the **real** terms — a benefit that isn't wired is disabled, not faked ([[ask-dont-guess]]).

## Law 5 — Honest, reconciled, and visible

- A member can **see their balance, tier, history, and benefits** — backed by the ledger, not a cached guess ([[analytics-dashboards]] for the business view).
- **Reconcile** the points liability and active-member counts from source, never a capped sample ([[engineering-standards]]).

## Stand this up in a new project

- Model the **points ledger and tier/benefit structure first** — retrofitting auditability onto a mutable balance is painful.
- Build **earn/redeem/expire as idempotent operations** and **margin-floor enforcement** into the pricing engine ([[storefront]]).
- Wire the **subscription lifecycle** to [[payments]] (dunning, proration, cancellation) and the scheduled jobs for expiry/renewal early.

## Cross-links
- [[payments]] — subscription billing, renewals, dunning, refunds' effect on benefits.
- [[storefront]] — member pricing applied server-side with margin floors.
- [[background-jobs]] — idempotent earn/redeem, points expiry, renewal automation.
- [[data-modelling]] — append-only ledger; balance as a sum; idempotency keys.
- [[engineering-standards]] — reconcile balances and member counts from source.
- [[privacy-and-compliance]] — honest, easy cancellation and data rights.
