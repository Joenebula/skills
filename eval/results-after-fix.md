# Router eval — after the engineering-standards fix

**Baseline:** `8b16194` — 34/35 expected, 0 forbidden
**After:** this commit — **35/35 expected, 0 forbidden**

## The change

One clause added to `engineering-standards`' description:

```diff
- Invoke BEFORE building or changing any feature, action, module, API endpoint,
- or shared mechanism — the process laws, the 12-stage build pipeline, ...
+ Invoke BEFORE building or changing any feature, action, module, API endpoint,
+ or shared mechanism — AND whenever a count, metric, or displayed number
+ disagrees with its source. The process laws, the 12-stage build pipeline, ...
```

Also: the row-cap gotcha restored to `CLAUDE.md` (+311 chars always-on). **This eval cannot measure that edit** — the router only ever sees descriptions, never `CLAUDE.md`. It is included on judgement, not evidence.

## Result

Prompt 23 (*"dashboard says 1,000 users, table has 4,312 rows — which is right?"*) now fires `engineering-standards`. Nothing else regressed. The haiku prompt still fires nothing, and `engineering-standards` sits in that prompt's `forbid` list — so the widening did not make it greedy.

## The unintended effect, and the controlled test that found it

After the edit, `engineering-standards` also began firing on prompts **22, 24, and 35** — none of which involve a number disagreeing with a source. Two competing explanations: (a) run-to-run router variance, or (b) the edit leaking beyond its clause.

**Controlled test.** The pre-edit description set was reconstructed and prompts 22 / 23 / 24 / 35 re-run against it, twice, independently.

| Prompt | Old desc, run 1 | Old desc, run 2 | New desc | Clause applies? |
|---|---|---|---|---|
| 22 rate limiting | did not fire | did not fire | **fires** | no |
| 23 dashboard vs table | did not fire | did not fire | **fires** ✓ | yes |
| 24 CSV export | did not fire | did not fire | **fires** | no |
| 35 Featured toggle | did not fire | did not fire | **fires** | no |

Both control runs agree exactly. The pre-edit behaviour was stable, so the four new fires are attributable to the edit, not to noise. (Caveat: n=2, one router model. Suggestive, not proof.)

## What this means — the finding that generalises

**A description is not a union of independent triggers. The router reads it holistically.** Adding a clause about numbers-vs-source made the whole description feel broader and more salient, and `engineering-standards` began firing on generic "build a feature" prompts it had previously skipped.

Two consequences:

1. **The three new fires are correct.** `engineering-standards` has always claimed *"Invoke BEFORE building or changing any feature, action, module, API endpoint."* Prompt 22 changes an endpoint; 24 and 35 build features. It should have been firing on them all along. The old description was **under**-firing against its own stated trigger — the spine wasn't behaving like a spine. The edit corrected a second, unnoticed defect.

2. **Descriptions cannot be edited independently.** You cannot change one description, re-test the prompts you think it touches, and call it safe. Every description edit requires a **full re-run of the whole prompt set**. This was going to be the plan for a 34-description batch pass; it is now a hard requirement, not a nicety.

`engineering-standards` fire count went from 4/35 prompts to 8/35. Its 83-line body now loads on build prompts. That is the intended design — it is the spine — so this is a feature, not a cost. It was not, however, predicted. The control is what turned an assumption into a fact.
