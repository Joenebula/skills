# Router eval

Measures the only thing that makes a skill library "precise": **does the right skill fire on the right prompt?**

Skill selection in Claude Code is made from **descriptions alone** — bodies are not in context when the router decides. So this harness feeds a model exactly that and nothing more.

## Files

| File | What it is |
|---|---|
| `descriptions.md` | Generated. The 34 `name` + `description` pairs, extracted from live frontmatter. The router's only input. |
| `prompts.jsonl` | 35 realistic prompts, each with `expect` (must fire), `forbid` (must not fire), and `probes` (the hypothesis it tests). |
| `results-baseline.md` | Baseline run at commit `0a7164c`: **34/35 expected, 0 forbidden fires, 34/34 skills reachable.** |

## Why partial labels

`expect` and `forbid` assert only what *clearly* must and must not fire. Everything else on a prompt is unscored. A complete gold label per prompt would measure the label-writer's taste, not the library. Recall (`expect`) and precision (`forbid`) are both real; the rest is left honest.

## The rule

**Re-run after any description change.** A description edit that reads better but drops below 34/35, or admits a forbidden fire, is a regression — ship the score, not the prose.

## What it does not measure

Routing only. Whether a skill gives good advice *once loaded* is untested. A green score here says a skill is **reachable**, never that it is **right**.

Body quality needs a different instrument: ablation. Delete a rule, re-run the task, see if behaviour changes. If it doesn't, the rule was never doing work — that's the test for "no rule the base model already follows unprompted."

## Adding prompts

Target skills the set under-covers. Round 1 had 25 prompts and left `api-design`, `performance`, `background-jobs`, and `observability` untested — which nearly produced the false conclusion that the library's hub skills never fire. Coverage gaps in the harness read exactly like defects in the library. Check coverage before believing a result:

```bash
# every skill name should appear in at least one `expect`
```
