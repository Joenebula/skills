# Ablation probe — does this rule do any work?

The router eval measures whether a skill **fires**. It says nothing about whether the skill is **right**. This measures the body.

## The question

A skill body is only worth the rules the model wouldn't have followed anyway. A line telling it to do what it already does adds nothing — and worse, it dilutes. When a skill fires, every line competes for attention. `engineering-standards` gives its own heading to "compute counts from an exact `COUNT`, not `array.length`" — which all three probes produced unprompted — while the rule that actually saves you (*a query caps at a fixed row count, and a bigger `limit` does not lift it*) sits as bullet (a) below the fold.

## The method

True ablation is delete-a-rule, re-run, compare. At 34 bodies × ~20 rules that's ~680 runs. Invert it instead:

1. **Generate a probe task** for the skill — from its **description only**, never its body. A body-derived task would be shaped to elicit the body's rules.
2. **Run 3 independent probes** on that task with **no skill loaded and no repo access**. Ask for concrete failure modes, not principles.
3. **Score the body against what came back.** Four buckets:

| Bucket | Test | Meaning |
|---|---|---|
| **Redundant** | ≥2 of 3 probes produced it unprompted | The skill isn't earning this line. Compress or cut. |
| **Corrective** | Probes did the **opposite** of what the rule says | The most valuable rules in the file. Without them the model confidently does the wrong thing. |
| **Load-bearing** | 0 of 3 produced it, *and* the task exercised its area | Keep. Consider promoting. |
| **Untested** | The task gave the probes no reason to cover it | Say nothing. Probe again with a task that exercises it. |

Five agents per skill. O(34), not O(680).

## The two rules that make it honest

**Be stingy with load-bearing, generous with untested.** A rule nobody mentioned because the task never touched its subject is *untested*, not valuable. Absence of evidence is not evidence of absence. The pilot deliberately left gotchas (c)–(g), the 12-stage pipeline, and six catalogue entries unclassified for exactly this reason.

**Corrective requires contradiction, not omission.** `engineering-standards` says *gate on capabilities, not hard-coded role names*. All three probes said *"re-verify the caller is an admin"* — the precise thing the rule forbids. That is corrective. A rule the probes merely didn't mention is not.

## What the pilot found

On `engineering-standards` (see `ablation-engineering-standards.md`):

- **8 rules redundant**, including the section with its own heading. The probes also raised self-lockout, CSRF, parameter-limit batching and pagination clamping — none of which the skill mentions.
- **6 load-bearing or corrective**, all of them buried: the row-cap gotcha, capabilities-not-roles, the sacred write path, *THE* shared confirm component (probes said "a modal"), change-once-everywhere, ship-a-reconciliation-check.

The rules a skill states most prominently tend to be the ones that felt most important to write down — which correlates with being **widely known**, not with being **scarce**.

## Editing after a result

Body-only edits carry no routing risk and need no eval re-run. **Description edits do.** A one-clause change to `engineering-standards`' description changed its firing behaviour on three prompts the clause had nothing to do with — the router reads a description holistically, not as a union of independent triggers. Re-run the full prompt set after any description edit.

And before promoting anything out of a numbered or lettered list: **grep for citations by number.** `ask-dont-guess` is cited by law number from 31 files; `engineering-standards`' gotchas are cited by letter from 8. Both nearly got silently broken during this work.

## Running it

`skill-ablation-sweep` — pass an array of skill names as `args`. Emits per-skill buckets plus a verdict. The script generates its own probe tasks, so adding a skill needs no new authoring.
