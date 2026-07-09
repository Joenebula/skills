---
name: preflight
description: Invoke immediately BEFORE any deploy, merge, or "it's done" claim — the orchestrated pre-ship pass: scope the diff, fan out the read-only auditor agents, climb the regression layers, and emit ONE explicit GO / NO-GO verdict. The gate only protects you if it actually runs; this is the runbook that runs it.
---

# preflight — the gate, actually run

The one core truth: **a verification model nobody executes is documentation, not protection.** [[regression-testing]] defines the layers and [[shipping]] defines where the gate sits in the release; this skill is the repeatable pass that runs them — same steps, same order, every time, ending in one explicit verdict. If preflight didn't run, the change is unverified — say so in those words.

Run this before every deploy or merge, and before telling the user a change is "done". A tiny change gets the same pass — "it's small" is how regressions ship.

---

## Step 1 — Scope the diff

Diff against the base (read-only). From the changed files, classify what this change touches — each class arms specific auditors and layers below:

| The diff touches… | Armed |
|---|---|
| Anything at all | regression-auditor + feature-completeness-auditor, Layer A |
| UI / components / stylesheets | + design-system-auditor + accessibility-auditor |
| Routes / endpoints / server handlers / auth | + security-route-auditor, the negative-path checks |
| Data: schema, migrations, seeds, queries | + the migration/reconciliation checks ([[data-modelling]], gotchas in [[engineering-standards]]) |
| A displayed count / total / KPI | + the reconciliation check (displayed == source) |
| A shared mechanism (confirm, search, paginator, row-state…) | + every call site swept and covered, not just the edited file |
| A destructive / bulk path | + the preview→execute and non-target-survives checks |
| A live user journey | + Layer B against the target, Layer C for that journey |

## Step 2 — Fan out the auditors (parallel, read-only)

Launch every armed auditor **concurrently** — they are independent and read-only, so they run side by side. Each returns its own verdict plus numbered issues:

- **regression-auditor** — maps the diff to the exact must-pass checks; GO / NO-GO.
- **feature-completeness-auditor** — every new affordance wired to real behaviour.
- **design-system-auditor** — every class/value traces to the documented system *(UI diffs)*.
- **accessibility-auditor** — the WCAG AA static pass + what needs the manual walk *(UI diffs)*.
- **security-route-auditor** — server-side gating, client usage, no leakage *(route diffs)*.

An auditor that cannot run is **DECLARED**, never silently dropped. An auditor's ISSUES are resolved (fixed, or explicitly accepted by the user) before the verdict — not argued away.

## Step 3 — Climb the layers

Run the layers the diff armed, in order, per [[regression-testing]]:

1. **Layer A — static gate.** Always. Typecheck + production build + the structural checks. Judge by the **real exit code** of each command run standalone — never a piped/filtered status ([[shipping]] rule c).
2. **Layer B — smoke + reconciliation.** Against the target being shipped to. Reachability, auth-refusal, displayed==source, no leaks. Degrades to *skip* without credentials — a skip is declared, not passed.
3. **Layer C — behavioural E2E.** Every journey the diff can plausibly reach. If Layer C cannot run (no environment, no test accounts), it is **DECLARED — "Layer C not run: <reason>"** — never implied green.

## Step 4 — The verdict

**GO** requires all of:

- Every armed auditor returned GREEN/GO, or its issues are resolved.
- Every required check passed by its real exit code.
- Nothing was silently skipped — every not-run layer/auditor is named with its reason.

**Any red → NO-GO.** Name the failing check, fix it, re-run the affected auditor/layer (not just the failing command), and re-issue the verdict. Do not ship around a red. A NO-GO is a result; shipping red is the failure.

Close with the report, always in this shape:

| Field | Content |
|---|---|
| **Diff scope** | What changed, which classes it touched (Step 1). |
| **Auditors** | Each armed auditor and its verdict. |
| **Layers** | Each layer run and its result (by exit code / assertion). |
| **Declared skips** | Every layer/auditor not run, with the reason. |
| **Verdict** | **GO** or **NO-GO — <the blocking item>**, one line. |

---

## Where this sits

- Stages 10–11 of the build pipeline in [[engineering-standards]] are this pass.
- Step 2 of the release sequence in [[shipping]] is this pass; a GO here still isn't deploy authorization — that's rule (a) there.
- The layers, the domain must-pass catalogue, and the auditor contract live in [[regression-testing]]; ambiguity about what a check should assert is an [[ask-dont-guess]] stop.
