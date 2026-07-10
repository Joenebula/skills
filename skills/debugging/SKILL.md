---
name: debugging
description: Invoke when investigating any bug, failure, or "it doesn't work" report — reproduce it first, read the real evidence, isolate by changing one variable, fix the root cause not the symptom, and ship the regression test that would have caught it. A bug report is a request to investigate, never permission to ship.
---

# debugging — reproduce, isolate, fix the cause, keep the test

The one core truth: **a fix for a bug you never reproduced is a guess wearing a fix's clothes.** You don't know you fixed it — you know you changed something and the symptom went quiet. Real debugging is evidence-driven: see it fail, understand *why* it fails, change the cause, watch it pass, and leave behind the test that makes this bug impossible to ship twice.

A bug report is a request to *investigate* — releasing the fix still needs its own explicit go ([[releasing]] rule a).

## Law 1 — Reproduce before you touch anything

- Get the failure happening **in front of you**: the exact steps, input, actor/privilege, and environment. A bug you can't reproduce is a bug you can't verify fixed.
- Can't reproduce? **Gather evidence, don't fix blind** — logs, error tracking, the correlation id for the failing flow ([[observability]]). If the report is ambiguous about what "broken" means, that's an [[ask-dont-guess]] stop: ask for the observed vs expected behaviour, don't infer it.
- Write the reproduction down — it becomes the regression test in Law 5.

## Law 2 — Read the actual evidence, not your memory of similar bugs

- Read the **real** error, log line, or failing assertion. A symptom that pattern-matches a familiar failure may have a different cause — verify before acting on the resemblance.
- Interrogate the usual liars: an **empty result** is frequently a silent query cap, a failed fetch, or a permission refusal — not "no data" (gotchas a, g and the empty-state ambiguity in [[engineering-standards]] / [[observability]]).
- Trust the evidence's **layer**: a wrong number on screen may be a display bug, a capped source, or bad data — trace it to the source of record before deciding which ([[engineering-standards]] reconciliation).
- No error anywhere? That's a finding too — something is swallowing it, which is its own bug ([[observability]] Law 1).

## Law 3 — Isolate: one variable at a time

- **Bisect** to the seam: by commit (when did it last work?), by layer (client → route → data — where does the value go wrong?), by input (what's the smallest input that still fails?).
- Change **one thing** per experiment and re-run the reproduction. Two changes at once means you learn nothing from the result.
- Beware the gotcha class: duplicate top-level names silently shadowing, scope leaks in a monolithic module, a not-yet-applied migration — legal-looking code that only running exposes ([[engineering-standards]] gotchas e, f, c).

## Law 4 — Fix the cause, never mute the symptom

- A retry loop, a swallowed exception, a defensive `?? default`, or a "just refresh it" that makes the symptom vanish is **failure made silent** — the bug is still there, now invisible ([[observability]]).
- Ask **why** the state got wrong, not just where it surfaced. Fixing the render when the source is corrupt ships a lie ([[engineering-standards]] reconciliation rule).
- If the cause lives in a **shared mechanism**, the bug exists at every call site — sweep them all, not just the reported one (change once = change everywhere, [[engineering-standards]]).
- If the true fix is large, an honest interim (disable the control, show a real error) beats a cosmetic patch — [[ask-dont-guess]] Law 4.

## Law 5 — Every fix ships with its test, and its lesson

- Turn the Law 1 reproduction into a **regression test that fails before the fix and passes after** — in the same change. Coverage never lags the bug ([[regression-testing]]).
- Run the preflight pass before calling it fixed — a fix is a change like any other ([[preflight]]).
- Report faithfully: "reproduced, root-caused, fixed, test added, verified" is a fix; "changed X, symptom gone" is a patch — say which one you did ([[ask-dont-guess]] Law 6).
- A bug that represents a **class** (a new gotcha, a shared-mechanism trap) is a candidate for the gotchas list — *propose* the skill update and wait for the yes (Stage 12 hard rule, [[engineering-standards]]).

## Stand this up in a new project

- **Error tracking + structured logs with correlation ids** from the start, so every future bug arrives with evidence ([[observability]]).
- A norm that **no bug fix merges without its regression test**, enforced in review ([[reviewing-code]]).
- A **gotchas list** that grows with every root cause found ([[engineering-standards]]).

## Cross-links
- [[observability]] — the evidence trail; never-fail-silently is what makes bugs findable.
- [[regression-testing]] — the fix's test, and the layers that verify the fix behaves.
- [[preflight]] — the pass a fix runs before it's called done.
- [[engineering-standards]] — the gotchas list (where root causes become rules) and the shared-mechanism sweep.
- [[ask-dont-guess]] — ambiguous reports, honest interim states, faithful reporting.
- [[releasing]] — a fix ships only on an explicit go.
