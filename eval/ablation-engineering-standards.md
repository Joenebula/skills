# Ablation pilot — `engineering-standards`

**Question:** which lines of this 83-line body are doing work, and which restate what the model already does unprompted?

**Method.** Rather than deleting each rule and re-running (34 bodies × ~20 rules ≈ 680 runs), invert it: give a model a task with **no skill loaded, no repo access**, record what it produces from its own judgement, then diff that against the body. Anything it produces unprompted is a rule the skill is not earning. O(34), not O(680).

**Probe task**, chosen to exercise the shared-mechanism catalogue, the destructive-action rules, and the data-reconciliation rule at once:

> *"Add a 'Delete selected' bulk action to the users admin table, and show the total user count at the top of the page."*

Three independent probes. Scored against the body's rules.

---

## Result 1 — the skill's headline section is already default behaviour

| Rule in `engineering-standards` | Where it lives in the body | Produced unprompted |
|---|---|---|
| Count must be exact `COUNT`, not `array.length` | **The data-reconciliation rule** (own heading) | **3/3** — probe 3 ranked it **#1** |
| Client-side gate is UX only; server gate mandatory | **Security & gating**, bullet 1 | **3/3** |
| Destructive/bulk ops are two-step (confirm) | Security & gating, bullet 4 | **3/3** |
| Never leak secrets / PII | Security & gating, bullet 5 | **3/3** |
| Soft-delete over hard delete; know the FK blast radius | Catalogue, *Soft-delete / trash* | **3/3** |
| Per-row busy state; disable control; prevent double-fire | Catalogue, *Per-row async state* | **3/3** |
| Gotcha (b) — a capped sample shown as a TOTAL | Gotchas list | **3/3** |
| Idempotency; report actual affected rows, not `selected.length` | Process law 5 (implied) | **3/3** |

Eight rules — including the section the skill gives its own heading to — reproduced by every probe, with no prompting. The probes went further than the skill does: all three raised self-lockout / last-admin deletion, CSRF, parameter-limit batching, and pagination clamping. None of those are in the body.

## Result 2 — the real payload is buried, and one rule *corrects* a wrong default

| Rule | Produced unprompted | Note |
|---|---|---|
| **Gotcha (a) — a query caps at a fixed row count, and a bigger `limit` does *not* lift it; page through in a loop** | **0/3** | The single highest-value line in the file. It is bullet (a) in a list, under a heading, below the fold. |
| **Gate on CAPABILITIES, not hard-coded role names** | **0/3** | **All three probes did the opposite** — "verify the caller is an admin", "re-verify admin role". This rule doesn't add information; it *corrects a default*. |
| **The sacred write path** — low-privilege actors may only insert review/submission records | 0/3 | Project-specific. Unguessable. |
| **NEVER a native `confirm`/`alert`; use THE one reusable confirm component** | 0/3 | All three said "a modal". None said "the shared one". The skill's point is reuse, not confirmation. |
| **Change once = change everywhere** — sweep every site of a shared mechanism | 0/3 | Nothing in the probes suggested looking for other call sites. |
| **Ship a check asserting `displayed == source`** | 0/3 | Probes computed the count correctly but never proposed a test that it stays correct. |
| Gotcha (c) — migration-safe enums | 0/3 | Weakly exercised by this task; treat as untested. |

**Rules whose value is confirmed by two independent experiments.** Gotcha (a) is exactly what the router eval's prompt 23 was reaching for, and exactly what the model never produces on its own. The two results corroborate: the fix routed the model to a skill that genuinely holds knowledge it lacks.

**The most valuable rules are the corrective ones.** A rule the model would already follow adds nothing. A rule that *contradicts* what the model would otherwise do — capabilities-not-roles, the shared confirm component, the sacred write path — is worth its weight several times over, because without it the model confidently does the wrong thing.

## Not tested — do not act on these

This was one probe task. It did not exercise:

- Gotchas **(d)** read-only runtime filesystem, **(e)** duplicate top-level names silently shadowing, **(f)** scope leaks in a monolithic module, **(g)** fixture data on a live surface
- Catalogue entries: predictive search, first-letter index, bulk-select bar, paginator, clean per-type URLs, search behaviour
- The 12-stage build pipeline as a sequence
- The HARD RULE (approval-gated skill edits)

Absence of evidence is not evidence of absence. Each needs a probe task that exercises it before any cut. Gotcha (e) in particular — a legal, syntax-check-passing name collision where the later definition silently wins — reads like exactly the kind of thing a model would not raise unprompted, but that is a hypothesis, not a result.

## Proposed edits — NOT applied (HARD RULE: approval first)

1. **Promote gotcha (a)** out of the list. It is the file's most valuable line and it is buried. Consider giving it the heading currently spent on the data-reconciliation rule.
2. **Promote "gate on CAPABILITIES, not role names"** to the top of Security & gating. It is the only bullet there that corrects rather than confirms.
3. **Compress the data-reconciliation rule's first bullet** and **Security & gating bullets 1, 4, 5**. Produced 3/3 unprompted. Reduce to a sentence, or cut. Keep the second reconciliation bullet (ship the check) — that one is 0/3.
4. **Compress catalogue entries** *Soft-delete / trash* and *Per-row async state* to their reuse instruction only. The model already knows *why*; what it doesn't know is *that a shared component already exists*.
5. **Leave gotchas (c)–(g), the pipeline, and the untested catalogue entries alone** until probed.

The through-line: **this skill's job is not to teach good engineering. It is to carry the handful of things this codebase knows that the model does not.** Everything else is dilution — and when the skill fires, dilution is what crowds out gotcha (a).

## Generalising to the other 33

The probe is cheap: one representative task per skill, three independent runs, no skill loaded, diff against the body. The output is a per-skill split into **confirmed-redundant**, **confirmed-load-bearing**, and **untested**.

Expect the same shape. The rules a skill states most prominently tend to be the ones that felt most important to write down — which correlates with being widely known, not with being scarce.
