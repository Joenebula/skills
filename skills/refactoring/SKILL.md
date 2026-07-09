---
name: refactoring
description: Invoke when restructuring code or delivering a large change — keep behaviour identical, move in small reversible steps, lean on tests, and flag risky changes. Refactoring that changes behaviour is not refactoring; it's an undisclosed rewrite.
---

# refactoring — change the shape, not the behaviour

The one core truth: **refactoring means the behaviour stays identical — only the structure improves.** The moment behaviour changes, it's a feature or a fix, not a refactor, and it needs the full build pipeline and verification. Mixing the two is how "just a cleanup" ships a regression. Keep them separate, move in small reversible steps, and prove behaviour held.

Proof that behaviour didn't change lives in [[regression-testing]]; large rollouts go out incrementally behind feature flags ([[infrastructure]]).

## Law 1 — Separate refactor from behaviour change

- **One commit does one thing**: either it restructures with no behaviour change, *or* it changes behaviour. Never both — a reviewer can't tell which diff lines are which ([[reviewing-code]]).
- Announce which it is. A pure refactor should pass the **same tests unchanged**; if a test had to change, you changed behaviour.

## Law 2 — Pin behaviour before you move it

- **Cover the code with tests first** (characterization tests that capture *current* behaviour, even if imperfect), then refactor against them. No safety net → write one, or don't refactor blind ([[regression-testing]]).
- Refactor in **small, reversible steps**, each leaving the build green — not one giant unreviewable rewrite. Commit at each green point so any step can be backed out.

## Law 3 — Large changes ship incrementally, not big-bang

| Pattern | Use |
|---|---|
| **Strangler** | Build the new path beside the old, route traffic over gradually, remove the old when nothing uses it — never a flag-day swap. |
| **Expand / contract** | Add the new (column, field, API) → migrate readers/writers → remove the old. Mirrors the additive-migration rule ([[data-modelling]]). |
| **Feature flags** | Land code dark, enable progressively, disable instantly if it misbehaves — decoupling deploy from release ([[infrastructure]]). |
| **Batches** | A sweeping change lands as a sequence of shippable, verified slices, each keeping the build green. |

## Law 4 — Respect the shared mechanism

- Refactoring a **shared mechanism** (confirm dialog, search, pagination, row-state) means sweeping **every** site it touches — change once = change everywhere ([[engineering-standards]]). A half-migrated mechanism is a regression waiting per call site.
- Watch the silent-shadow gotcha: renaming/merging top-level names can make a later definition win and break earlier callers with no error (gotcha e in [[engineering-standards]]).

## Law 5 — Know when not to

- Refactor with a **reason** (you're about to change this code, it's actively confusing, it's blocking work) — not aimless churn. Gratuitous restructuring adds review load and regression risk for no user value.
- **Don't refactor and migrate data in the same step.** Don't refactor unverified code (pin it first).
- Leave it **better and consistent**, matching house conventions — not just differently-shaped.

## Stand this up in a new project

- A **test safety net** good enough to refactor against ([[regression-testing]]).
- A **feature-flag mechanism** for progressive rollout/rollback ([[infrastructure]]).
- A convention that **refactor commits are labelled and behaviour-neutral**, enforced in review ([[reviewing-code]]).

## Cross-links
- [[regression-testing]] — characterization tests pin behaviour; green proves the refactor held.
- [[infrastructure]] — feature flags to roll out/disable without redeploying.
- [[data-modelling]] — expand/contract mirrors additive, reversible migrations.
- [[engineering-standards]] — sweep every site of a shared mechanism; the silent-shadow gotcha.
- [[reviewing-code]] — refactor and behaviour change never share a commit.
