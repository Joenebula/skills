# Does a skill's `references/` actually get opened?

**Phase A decision gate for the commerce merge.** A hub SKILL.md that points at `references/*.md` is worthless if the references are never read. Before restructuring the commerce domain around that pattern, measure it.

Only one skill in the library uses `references/`: `project-setup` (198-line SKILL.md over 523 lines of references), with **passive** pointers — *"see `references/optional-services.md`"*, *"Details in `references/go-live.md`"*. Never tested.

## Design

Two identical copies of `project-setup` in a scratch dir, differing **only** in four pointer lines:

- **Passive arm** — the file as shipped.
- **Imperative arm** — *"**Read `references/go-live.md` now** — do not configure domains, the canonical host, or launch gating without it."*

`references/` byte-identical across arms (verified by `diff -r`).

**Detection is behavioural, not self-report.** Facts that exist *only* in `go-live.md`, absent from `SKILL.md` (verified by grep):

| | Discriminator |
|---|---|
| D1 | Feature flags live in the **database, not env vars**, so flipping needs no redeploy |
| D2 | The `private_preview` gate must **exempt the admin/owner** or you lock yourself out |
| D3 | Rollback ladder: flip flag → **Promote to Production** → revert commit |
| D4 | Cloudflare records set to **DNS-only (grey cloud)** so Vercel can issue TLS |
| D5 | Staged enable order: read surfaces on, **write** surfaces off, one at a time |

> **A discriminator I nearly used and had to discard.** `SKILL.md:161` already states the `NEXT_PUBLIC_*` build-time inlining rule. Had I scored on that, every run would have "passed" without opening anything. Checking the confound was the difference between a valid experiment and a meaningless one.

## Arm 1 — easy retrieval (task keyword-matches the pointer)

*"We're launching Friday. Set up the canonical host, and gate the public launch so the team can test on the real domain before anyone else can get in."*

The pointer reads *"Going live + soft-launch / feature flags (domains, canonical redirect, gating a public launch)"* — near-verbatim overlap. Easiest possible case.

**Result: 6/6 opened `go-live.md`** (3 passive, 3 imperative). All six produced D1–D5.

Passive and imperative are **indistinguishable at ceiling.** This is not evidence that imperative pointers are useless — there was no headroom to measure. It is evidence that passive pointers are *sufficient* here.

## Arm 2 — hard retrieval (pointer does not advertise the answer)

*"We point the domain at production on Friday afternoon. If the whole thing turns out to be broken once real users are on it, what is the fastest way to undo it?"*

Rollback lives in `go-live.md` §4. The pointer says nothing about rollback. The model must infer that a file about "going live" covers coming back.

**Result: 3/3 opened `go-live.md`.** All three produced D3 (the full ladder) and D1. Two spontaneously added the DB-restore lever and correctly warned that promoting a build rolls back code but not data.

**Total: 9/9 on the needed reference.**

## The finding that changed the architecture

Open rates across all 9 runs:

| Reference | Relevance | Opened |
|---|---|---|
| `go-live.md` | the answer | **9/9** |
| `optional-services.md` | marginal (env vars) | 7/9 |
| `self-hosting.md` | irrelevant | 3/9 |

**Mean 2.1 of 3 references opened — 70% of the corpus.** Discrimination is real (irrelevant 33% vs relevant 100%), but so is the over-read.

Applied to a four-reference commerce hub (~220 lines of references): expect ~154 lines read, plus a ~70-line hub ≈ **224 lines**, nondeterministically. A flat deduplicated body is **~180 lines, deterministically.**

### Decision: flat body, not hub

The plan's gate said *"imperative pointers reliably open → hub; neither opens → flat."* Reality took a third path — references open **reliably**, which by the letter of the gate means hub. Reject it anyway, on the merge's own logic:

> We merge **because** a rule in a file that doesn't load is a rule you don't have. A hub reintroduces that exact question one level down: *"will it open `references/payments.md`?"* Adopting an architecture that reopens the problem you are merging to close is self-defeating.

The hub is a bet on retrieval. The flat body needs no bet.

## Limits — stated so a green result isn't overread

- **Both probe tasks spanned multiple sections** of `go-live.md`, which likely inflates the over-read rate. **No data on a narrow, single-section task.** The hub might cost 70 lines or 290; the flat body costs 180, known.
- **n=9, one model, one skill.** `project-setup` is the library's most concrete, most checklist-shaped skill. Reference-following on an abstract skill is untested.
- **3 of 9 agents wandered into the real application** at `Web/Dancemap/Web/` despite not being asked to. Their `go-live.md` reads are still confirmed by FILES_OPENED and by D3/D4, which exist nowhere in that repo. But arm 1 was not hermetically isolated; arm 2 was (explicit read restriction).
- **Self-report + content, not tool-call inspection.** Both signals agree in all 9 runs.

## Reusable conclusions for this library

1. **Passive pointers work.** `project-setup` needs no change. Don't rewrite what already scores 9/9.
2. **`references/` is viable for depth, not for token savings.** Use it when a skill has genuinely optional depth (self-hosting, optional services) — not to make a mandatory body look smaller.
3. **A model will find content whose pointer doesn't advertise it**, at least when the reference corpus is small (3 files) and the pointer names the domain.
