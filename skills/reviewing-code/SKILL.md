---
name: reviewing-code
description: Invoke when reviewing a diff, a pull request, or your own change before calling it done — what to look for in priority order, how to refute before you trust, and how to give feedback that lands. "Looks fine" is not a review.
---

# reviewing-code — refute it before you trust it

The one core truth: **a review's job is to find what's wrong, not to bless what's there.** Approving on a skim is worse than no review — it stamps "checked" on something nobody checked. Read to break it; if you can't break it after honestly trying, *then* approve.

Review your **own** change this way before you ship it — you are the first reviewer. The same lens drives the read-only auditor agents (design-system-auditor, accessibility-auditor, feature-completeness-auditor, regression-auditor, security-route-auditor); this skill is the human discipline behind them, and [[preflight]] is the pass that runs them.

## Law 1 — Read in priority order, not top-to-bottom

Spend your attention where the cost of a miss is highest:

| Priority | Look for |
|---|---|
| **1. Correctness** | Does it do what it claims? Edge cases, empty/null, off-by-one, error paths, race conditions. Trace one real input end-to-end. |
| **2. Security** | Untrusted input validated? Server-side authz on every write? Secrets/PII not leaked? See [[security]]. |
| **3. Data integrity** | Migrations additive & reversible? Numbers reconcile to source, not a capped sample? See [[data-modelling]], [[engineering-standards]]. |
| **4. Wired end-to-end** | Every new control hits a real backend; no dead button, no broken-promise copy, no fixture on a live surface. See [[ask-dont-guess]]. |
| **5. Consistency** | Reuses the shared mechanism instead of a second one; matches [[design-system]] and house conventions. |
| **6. Readability** | Names, dead code, comments that match the code, sensible structure. Last — never first. |

Style nits never block a correctness review. Tag them "nit:" and move on.

## Law 2 — Refute, don't rubber-stamp

For each claim the change makes ("this fixes X", "this is safe"), actively try to disprove it:

- **Find the input that breaks it** before you accept it works.
- **Assume the comment lies** — verify against the code, not the description.
- **"It compiles" / "tests pass" is not "it's correct"** — read what the test actually asserts; a green test that asserts nothing is a false signal.
- If you can't tell whether something is right, that's a **question**, not an approval — see [[ask-dont-guess]].

Default to "not yet" until proven. The reviewer who waves things through is the reason bugs reach production.

## Law 3 — Verify the claims you can run

Don't review purely on the page. Where it's cheap: run it, read the failing case, check the number against its real source. A behavioural change isn't reviewable from the diff alone — its proof lives in [[regression-testing]]. If you didn't run it and couldn't trace it, say "I reviewed the code but did not verify behaviour" — don't imply more than you did.

## Law 4 — Feedback that lands

- **Be specific and actionable.** "This N+1 fires once per row — batch it" beats "perf?".
- **Separate severity:** blocker / should-fix / nit. Don't let nits drown a real blocker.
- **Ask, don't decree, when unsure:** "Is the empty case handled upstream?" invites the author's context.
- **Explain the why**, not just the what — a reason teaches; a command just gets obeyed once.
- **Praise the genuinely good** sparingly and honestly; it calibrates the criticism.
- Attack the code, never the author.

## Reviewing your OWN change (self-review before shipping)

Before you call it done, re-read your diff as a hostile stranger:
1. Does every new affordance reach a real backend, or does it just *look* done?
2. What input did I **not** test? Empty, huge, malicious, concurrent?
3. Did I touch a shared mechanism and forget a call site? (Change once = change everywhere — [[engineering-standards]].)
4. Is any number I display an exact source value, or a capped proxy?
5. Am I about to write "done"? Did I actually run it? — [[regression-testing]].

## Stand this up in a new project

- Make review a **gate**, not a courtesy: nothing merges without one pass against Law 1's order.
- Keep a short, project-specific **review checklist** next to the build pipeline; add a line every time a class of bug slips through (the gotchas loop in [[engineering-standards]]).
- Wire the read-only auditor agents into the flow so the mechanical checks are automatic and humans spend attention on judgement.

## Cross-links
- [[ask-dont-guess]] — uncertainty in review is a question, not an approval; the "looks done but isn't" anti-patterns are the Law 4-wiring checks.
- [[regression-testing]] — behaviour is proven by running, not by reading the diff.
- [[security]] — the security pass of a review.
- [[engineering-standards]] — the build pipeline, shared-mechanism reuse, and data-reconciliation a review enforces.
