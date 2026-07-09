# Router eval — baseline

**Date:** 2026-07-09 · **Commit:** `0a7164c` · **Skills:** 34 · **Prompts:** 35
**Router:** a subagent given `descriptions.md` and nothing else — no bodies, no repo access, no expected labels.

## Score

| Metric | Result | What it means |
|---|---|---|
| **Expected fires hit** | **34 / 35 (97%)** | The right skill fired on the right prompt. |
| **Forbidden fires** | **0 / 25 (100% clean)** | No skill fired where its own description forbids it. |
| **Skills reachable** | **34 / 34** | Every skill in the library fired at least once. Zero dead skills. |
| **Silence on a non-task** | pass | "Write me a haiku" → no skill fired. The library does not reach. |

The negative constraints are the standout. Every "Commerce track ONLY", "do NOT invoke for a brochure/portfolio", and "Invoke ONLY when the project genuinely moves money" held under pressure. On prompt 1 (portfolio newsletter) and prompt 18 (blog, not catalogue), the commerce quartet stayed silent. That is the hardest thing to get right in skill design, and it already works.

## The one real defect

**Prompt 23** — *"The dashboard says we have 1,000 users but the users table has 4,312 rows. Which is right?"*

- **Fired:** `analytics-dashboards`, `debugging`
- **Should have fired:** `engineering-standards`

This is the row-cap gotcha — the single most specific, hard-won rule in the library. It lives in `engineering-standards` (the data-gotchas list and the data-reconciliation rule) and in `ask-dont-guess` Law 3. Neither fired.

**Root cause, and it is precise.** `engineering-standards`' description opens *"Invoke BEFORE building or changing any feature, action, module, API endpoint, or shared mechanism."* That trigger is a **build** event. Prompt 23 is a **diagnostic** event — nothing is being built. The skill's body holds the exact answer; its trigger doesn't reach the case.

Confirmed not a routing fluke: `engineering-standards` fires correctly on every *build* prompt aimed at it (26, 28, 30, 33). The trigger works. It just doesn't cover diagnosis.

**Also worth noting:** the row-cap rule is *not* in `CLAUDE.md`, so it isn't always-on either. On prompt 23 nothing in the library surfaces it. Verified: `grep -i "row limit|capped|caps at|reconcil" CLAUDE.md` → 0 matches.

## Hypotheses tested — four of five refuted

Before running this, I predicted four consolidation targets from the dependency map. The eval refuted all four, and I withdrew a fifth recommendation.

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `preflight` / `regression-testing` / `shipping` contend — all claim "before any deploy" | **REFUTED** | Prompt 2 ("ready to deploy, can you check?") → `preflight` alone. Prompt 32 ("ship v2.1") → all three, which is *correct*: a ship genuinely wants the gate, the proof, and the runbook. Check-only vs ship-now separate cleanly. |
| H2 | `accessibility` / `responsive-design` contend — both say "BEFORE calling any UI done" | **REFUTED** | Prompt 6 (nav overflows on iPhone SE) → `responsive-design` alone. Prompt 7 (no alt text, no tab focus) → `accessibility` alone. Clean in both directions. |
| H3 | Near-orphans (`debugging` 1 ref, `refactoring` 2, `frontend-design` 1) are unwired and never fire | **REFUTED** | All three fired correctly, on prompts 5, 3, and 4. Low inbound references did not predict low reachability. |
| H4 | Hub skills are greedy and over-fire | **REFUTED** | Zero forbidden fires across 25 negative constraints. On the haiku prompt, nothing fired at all. |
| H5 | *(my recommendation)* Merge `preflight` into `regression-testing` — it's the weakest node at 10 refs | **RETRACTED** | `preflight` fires precisely on the check-only prompt and co-fires appropriately on the ship prompt. It earns its place. The 10-ref count measured how much the library talks about it, not whether it works. |

### The methodological finding

**Inbound reference count is a maintenance-risk metric, not a quality metric.** It tells you what is dangerous to edit (`engineering-standards` at 89 refs across 32 files). It tells you nothing about whether a skill fires when it should. Every consolidation call I derived from the dependency map alone was wrong. The eval is the only instrument that measures the thing that matters.

## What this eval does NOT measure

Stated plainly, so a green score isn't mistaken for more than it is:

- **It measures routing, not body quality.** Whether `security/SKILL.md` gives *good* advice once loaded is untested here. A skill can fire perfectly and then say something useless.
- **It measures one router model, one run, 35 prompts.** No variance estimate. A skill that fires at 60% probability and a skill that fires at 100% both look like "pass".
- **Prompt-set bias.** I wrote both the prompts and the expected labels. Rounds 1 and 2 exist because round 1 under-covered four skills (`api-design`, `performance`, `background-jobs`, `observability`) — and I nearly reported "the hub skills never fire," which was an artefact of my own prompt set, not a property of the library.
- **Partial gold labels.** `expect` and `forbid` list only what clearly must and must not fire. Everything else is unscored, deliberately, rather than inventing a complete ground truth.

## Reproducing

```bash
# 1. Regenerate the router's input from the live frontmatter
bash gen_descriptions.sh > eval/descriptions.md

# 2. Copy it somewhere the router can read but the answers can't leak
cp eval/descriptions.md "$SCRATCH/router-skills.md"

# 3. Give a subagent router-skills.md + 5 prompts (text only, no expect/forbid).
#    Prompt it as the Claude Code skill router. Collect strict JSON:
#      [{"id":N,"fire":["skill-name",...],"why":"..."}]

# 4. Score against prompts.jsonl: every `expect` entry must appear in `fire`;
#    no `forbid` entry may appear in `fire`.
```

Re-run after any description edit. A change that lowers 34/35 or breaks a `forbid` is a regression, regardless of how much better the prose reads.
