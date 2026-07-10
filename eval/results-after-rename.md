# Router eval — after `shipping` → `releasing`, and a correction to Phase C

**Headline:** the rename is clean. **But replication shows Phase C's "40/40" was a single sample, and I overstated it.**

## The rename

`shipping` → `releasing`. 32 `[[wiki-link]]` sites across 15 files, plus 3 agent citations. The word "shipping" now means parcels everywhere in the library, and the deploy runbook has a name that can't be confused with it.

Justified by the text, not by anyone's slip: `commerce`'s Law 5 owns "tax and **shipping** rates", and I had papered over the collision with a parenthetical footnote — *"(Note: 'shipping' here means parcels. The deploy runbook is `[[shipping]]` — a different thing entirely.)"* **A skill that needs a footnote disambiguating its own name is the bug.** The footnote is now deleted; the rename made it unnecessary.

**Prompt 32** — *"Ship v2.1 to production"* — still fires `releasing`, `preflight`, `regression-testing`. Stripping the literal word "shipping" from the name did not break it: the description still carries *"deploy or release"* and *"ship → confirm"*.

## The correction

Phase D's run failed **prompt 35** — *"Add a Featured toggle to the product admin"* — which had passed in Phase C. Nothing about that prompt or `commerce`'s description changed between the two runs. The router named the cause:

> *"honoring commerce's explicit gate — 'Invoke only where something is bought, subscribed to, donated, earned, or redeemed' — a Featured/merchandising toggle is none of those, so commerce does NOT fire despite being a product admin."*

Meanwhile **prompt 24** moved the *other* way: `data-grids` alone in Phase C (the recall loss I flagged), `data-grids` + `commerce` in Phase D. Also with no causal edit.

One prompt got worse, one got better, nothing changed. So I replicated both — three fresh runs against the unchanged description — instead of editing a shared artifact on one observation.

### Replication: 3 runs, unchanged description

| Prompt | `commerce` fires (3 replicates) | Across all 5 observations |
|---|---|---|
| 35 Featured toggle in product admin | 3/3 | **4/5 (80%)** |
| 24 CSV export on the orders list | 2/3 | **3/5 (60%)** |
| 1 portfolio newsletter | 0/3 ✓ | 0/5 ✓ |
| 18 blog, not catalogue | 0/3 ✓ | 0/5 ✓ |
| 40 PDF brochure | 0/3 ✓ | 0/5 ✓ |

**Two findings, one good and one not.**

**The negative constraints are real.** Nine independent observations across three prompts, zero forbidden fires. The single merged scope guard genuinely does the work that four used to. That result survives replication.

**The positive recall is not.** `commerce` reaches back-office prompts only 60–80% of the time. Prompt 35's Phase D failure was a variance sample, not a deterministic defect — which is worse news than a defect, because a defect can be seen once and fixed. A 60% skill and a 100% skill are indistinguishable in a single run.

### What this says about Phase C

`results-after-commerce-merge.md` claims **40/40 expected**. Under its own "Limits" heading it says:

> *"40 prompts, one router model, one run. No variance estimate. A skill firing at 60% and one at 100% both read 'pass'."*

I wrote that, committed it, and led with the headline anyway. The honest restatement:

- **Forbidden fires: 0.** Replicated. Trust it.
- **Expected fires: 40/40 on one sample.** At least two of those forty (24, 35) are coin-flips. The true expected score is below 40/40 and I do not know by how much.

The merge is still right — prompt 12 and prompt 39 both reach `commerce` in every observation, and those are the two the merge existed for. But "40/40" was a number I had not earned.

## Diagnosis: the closing clause

`commerce`'s scope guard ends:

> *"Invoke only where something is bought, subscribed to, donated, earned, or redeemed."*

Every verb names a **transaction event**. But half the skill's surface is **admin work where no transaction is happening in that task** — adding a Featured toggle, exporting an orders CSV, editing a variant's price, adjusting stock. A router applying the clause literally, as one did, correctly excludes all of it.

The negative constraints that actually do the gating live earlier in the description and are untouched by this:

- *"do NOT invoke for a brochure, portfolio, marketing, or content site that sells nothing"*
- *"A back-office where nothing is sold is cms + data-grids"*
- *"Plain sign-in and account settings are auth-and-accounts; a newsletter is email-and-notifications"*

**Proposed fix (NOT APPLIED — shared-artifact edit, needs approval):** replace the closing clause with one that gates on *whether the project sells*, not on whether money moves in this particular task:

```diff
- Invoke only where something is bought, subscribed to, donated, earned, or redeemed.
+ The gate is whether the project sells — not whether money moves in this
+ particular task. Catalogue, inventory, pricing and merchandising work in a
+ shop's admin all belong here.
```

**This must be validated by replication, not a single run.** The edit loosens a restrictive clause, so the risk is over-firing. Re-run the seven negative prompts (1, 4, 9, 18, 25, 30, 40) **×3 each** and the two contested recall prompts (24, 35) **×3 each**, plus one full 40-prompt pass to catch leakage into unrelated prompts — because we already know description edits are read holistically.

## The method lesson

**A single-run eval cannot distinguish a fixed defect from a lucky roll.** It took a spurious failure on prompt 35 to reveal that prompt 24 had been silently unstable the whole time.

Replicate the *contested* prompts, not all of them. Three runs on the eight prompts under dispute cost less than one run on forty and tell you far more. Reserve the full pass for detecting leakage after a description edit.
