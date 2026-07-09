# Router eval — after the commerce merge

**Before:** `1415a20` — 34 skills, 35/35 expected, 0 forbidden
**After:** `861bdc3` — **31 skills, 40/40 expected, 0/14 forbidden**

Prompt set grew from 35 to 40: five new prompts that probe *inside* the merged domain, including the two rules that previously had no owner.

## Score

| Metric | Before (34 skills) | After (31 skills) |
|---|---|---|
| Expected fires hit | 35/35 | **40/40** |
| Forbidden fires | 0/25 | **0/14** |
| Skills reachable | 34/34 | 31/31 |
| Haiku prompt | silent | silent |
| Always-on descriptions | 10,319 chars | **9,592 chars** |

**Token saving: 727 chars (~180 tokens/session), not the ~1,120 I forecast.** My merged description came out at 930 characters — the longest in the library — against the ~600 I planned. Stated because the forecast was wrong, not rounded.

## The two prompts the merge existed for

**Prompt 12** — *"Wire up Stripe so customers can subscribe to a monthly plan."*

Pre-merge: fired `payments` and `loyalty`. Never `storefront`. So `storefront:24` — *"every price, discount, tax, shipping, and total is computed server-side… a total POSTed by the browser is re-derived and re-checked"* — was **unreachable on the most money-critical prompt in the set.**

Post-merge: fires `commerce`. The law is in the file that loads.

**Prompt 39** *(new)* — *"Our tier discount stacked with a coupon is selling some items below cost."*

This is the rule **no file owned.** `storefront:33` deferred margin floors to `loyalty`; `loyalty:24` said they're enforced "in `storefront`". Circular — because neither could rely on the other being loaded.

Post-merge: fires `commerce`, where margin floors are **Law 4**, owned outright.

## New intra-domain prompts — all pass

| # | Prompt | Fires | Probes |
|---|---|---|---|
| 36 | charged twice on double-click Pay | `commerce`, `debugging` | idempotency law. Pre-merge, the checkout rule lived in `storefront` and the charge rule in `payments`. |
| 37 | points balance ≠ order history | `commerce`, `engineering-standards`, `debugging` | append-only ledger + reconcile-from-source. Correctly also reaches the row-cap hub. |
| 38 | can buy an out-of-stock product | `commerce`, `debugging` | no-oversell. Inventory was admin-owned, checkout storefront-owned — this spanned two skills. |
| 39 | stacked discount sells below cost | `commerce`, `debugging` | **the ownerless rule.** |
| 40 | PDF brochure on a consultancy site | *(nothing)* | **negative.** One scope guard replaces four. It held. |

## Negative constraints held: 14/14

Seven prompts assert `commerce` must not fire (1 portfolio newsletter, 4 record-label identity, 9 magic-link sign-in, 18 blog, 25 haiku, 30 team settings, 40 brochure). Prompt 25 asserts seven further skills stay silent. **Every one held.**

This was the merge's real risk. Four scope guards each scored 100% in the baseline; after the merge a single guard carries all of their weight. It carries it.

## One unscored change, reported anyway

**Prompt 24** — *"Add a CSV export button to the orders list, and let admins filter by date range."*

| | Fires |
|---|---|
| Pre-merge | `data-grids`, `ecommerce-admin`, `engineering-standards` |
| Post-merge | `data-grids` |

An orders list **is** a commerce back-office module, and `commerce`'s rules — reconcile every total, capability-gate every write, export honestly — no longer load on that prompt. It is not in `expect` or `forbid`, so it does not score as a failure. It is a real change in recall.

**Not a controlled comparison.** The skill list changed (34 → 31) and every description the router sees changed with it. `engineering-standards` also dropped from that prompt, and we already know from `results-after-fix.md` that its firing varies run to run. Attribute nothing without a control.

**Action:** if a follow-up shows `commerce` reliably missing back-office-flavoured grid prompts, the fix is a keyword in its description ("orders list", "admin export"), followed by a **full** re-run — description edits are not independent.

## Limits

- 40 prompts, one router model, one run. No variance estimate. A skill firing at 60% and one at 100% both read "pass".
- Prompt-set bias: I wrote the prompts and the labels, and I wrote them knowing what the merge was meant to fix. Prompts 36–39 are sympathetic by construction. The negatives (1, 4, 9, 18, 25, 30, 40) are the honest half of the set.
- `commerce`'s description is 930 chars, the longest in the library. It did not over-fire here. That is a result on 14 assertions, not a guarantee.
