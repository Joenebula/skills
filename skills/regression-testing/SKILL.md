---
name: regression-testing
description: Invoke BEFORE calling any change "done" and BEFORE any deploy — the layered pre-go-live verification model, the mandatory preflight gate, and the read-only guardian-auditor pattern; use it to prove a feature WORKS, not merely that it compiles.
---

# Regression Testing

**Static green proves your code COMPILES. It NEVER proves your code WORKS.** Types pass, the bundle builds, lint is clean — and the feature is still broken, because nothing ever exercised it. The most expensive bugs hide in features that "looked done": wired in the editor, green in the build, dead in production, because no test ever signed in and clicked the button.

Read this before you say "done" and before you ship. Every time.

---

## The one law

A change is not done when it builds. A change is done when something **drove the user-facing behaviour and read the result back**. Until then it is unverified — say so, out loud, in those words.

---

## The layered model

Three layers. Each proves something the layer below cannot. Climb them in order; the higher you climb, the more you actually know.

### Layer A — static wiring gate (fails the build)

Cheap, deterministic, runs on every build. Wire it into your build step **and** CI so a regression turns the build red — exit non-zero, no merge. It catches two classes of problem:

1. **Compilation** — syntax, types, and a real production build (not just a type-check; the build catches what the checker won't).
2. **Structure** — what a compiler is happy to ignore:
   - Every route / handler / entry point resolves to a real export.
   - **No duplicate top-level name** — two things claiming the same exported/registered identifier. One silently shadows the other; the build is green and the wrong one runs. **HARD-FAIL.**
   - **No capped-stat** — any headline total sourced from a query or array that silently caps at a fixed row limit. A bigger limit does NOT lift the cap — you must page through the source. A "total" that is really "first N" is a lie. **HARD-FAIL.**
   - **No dead control** — an affordance (button, link, menu item, form) wired to nothing. **WARN.**
   - **No dead route** — a declared route nothing reaches, or a handler with no caller. **WARN.**

| Check | Verdict |
|---|---|
| Won't compile / build | HARD-FAIL |
| Duplicate top-level name collision | HARD-FAIL |
| Stat-honesty violation (capped total) | HARD-FAIL |
| Dead control (affordance → nothing) | WARN |
| Dead route / uncalled handler | WARN |

### Layer B — live smoke + data reconciliation (against the deployed target)

Hits the running target — the thing users actually reach — and asserts reality:

- **Reachable** — every key route answers with its expected status.
- **Auth-gating enforced** — a protected route REFUSES an anonymous caller. Assert the refusal; don't assume the guard fires.
- **Data reconciliation** — EVERY displayed headline number reconciles with its real source within a tight tolerance. Pull the figure from the page/API, pull the truth from the source of record, compare. (The reconciliation rule itself lives in [[engineering-standards]].)
- **No secret leaks** — responses carry no keys, tokens, internal IDs, or stack traces.

Write these **read-only** — they observe, never mutate. With no credentials they **degrade to "skip"**, never fail, so a machine without secrets can still build.

### Layer C — behavioural E2E (a real client)

The only layer that proves a feature works **for a human**. A real browser or client signs in, interacts, persists, and **reads the result back**. Reading back is the whole point — a write you never re-read is a write you never verified.

Cover the must-pass journeys:

- **Auth** — sign in, sign out, stay out when signed out.
- **The core loop** — the central create / read / update path of the product.
- **The gated privileged action** — a high-permission operation works for the entitled actor and is refused for everyone else.

---

## The mandatory preflight gauntlet → GO / NO-GO

Before any deploy, run the layers the change touches:

1. **A — static** (always).
2. **B — smoke + reconcile** (against the target you're shipping to).
3. **C — the affected E2E** (every journey the diff can plausibly reach).

Then decide, explicitly:

- **All green → GO.**
- **Any red → NO-GO.** Name the failing check. Fix it. Re-run. Do not ship around it.
- **A layer you could not run** (no client, no credentials) is **DECLARED — never silently skipped.** "Layer C not run: no test environment" is acceptable; pretending it passed is not.

A NO-GO is a result, not a failure. Shipping red is the failure. Where this gauntlet sits in the release flow lives in [[shipping]]; the orchestrated, repeatable run of it — which auditors fire on which diff, in what order, ending in the verdict — is [[preflight]].

---

## Core truths

- **Static green ≠ it works.** It never has. Treat a green build as permission to start verifying, not as verification.
- **Coverage grows with every feature.** A NEW user-facing feature ships WITH a new test for it, in the SAME change. Coverage that lags features is coverage that is already wrong.
- **Every bug fix ships with the test that would have caught it** — failing before the fix, passing after ([[debugging]]). A bug that can ship twice was never really fixed.
- **Never claim verification you didn't run.** If you couldn't run Layer C, say "Layer C not run" plainly — see [[ask-dont-guess]] for the honesty rule.

---

## The domain must-pass catalogue

When a diff touches one of these domains, its named checks are **non-negotiable members of the must-pass list** — the regression-auditor requires them; missing coverage means writing it in the same change. The full behaviour lives in each domain skill; this is the gate's index of them.

| Domain touched | The checks that must pass |
|---|---|
| **Auth / sessions** ([[auth-and-accounts]]) | Signed-out stays out of every protected surface; the denied actor stays denied (negative path asserted); expired/invalidated token refused; sign-in → sign-out round-trip. |
| **Checkout / payments** ([[storefront]], [[payments]]) | Double-submit creates ONE order; webhook redelivery = one financial effect; the decline/timeout path preserves the cart and creates no half-order; totals re-derived server-side. |
| **Ledgers & balances** ([[loyalty]]) | Balance == sum of ledger entries; earn/redeem idempotent under replay; no negative balance under contention. |
| **Displayed numbers** ([[analytics-dashboards]], [[data-grids]]) | Displayed count/total/KPI reconciles to the source aggregate (never a capped page). |
| **Destructive / bulk ops** ([[engineering-standards]], [[security]]) | Preview→execute enforced; the blast radius is bounded; a non-target record demonstrably survives. |
| **Forms** ([[forms-and-input]]) | Invalid input errors inline on the field; user input survives a failed submit; the unsaved-changes guard fires; double-submit prevented. |
| **Email / notifications** ([[email-and-notifications]]) | One event → one send under replay; opt-out honoured (assert the absence); no real sends outside production; merge fields resolve. |
| **Integrations / webhooks** ([[integrations]]) | Unsigned webhook rejected; redelivered event processed once; echo-loop suppressed; provider-down degrades without taking the page down. |
| **Migrations / schema** ([[data-modelling]]) | App runs green both before AND after the migration is applied (no query depends on an unapplied change); the down/forward-fix path stated. |
| **Accessibility** ([[accessibility]]) | Zero critical issues on changed screens; the keyboard walk done or DECLARED. |
| **Public pages / SEO** ([[seo]]) | One canonical per page; no duplicate titles; sitemap contains only live canonical URLs; changed URLs 301. |

---

## The read-only guardian-auditor pattern

Standing watchers, one per concern, each **read-only**, each run in the pipeline before deploy. An auditor reads the diff → maps it to risks → names the required fixes → **decides which layers this diff must pass.** They complement the layers; they don't replace them.

| Auditor | Guards |
|---|---|
| design-system-auditor | tokens / components / no invented styling (see [[design-system]]) |
| accessibility-auditor | the WCAG AA gate — semantics, labels, keyboard, focus, contrast (see [[accessibility]]) |
| feature-completeness-auditor | no dead controls, no unkept-promise copy, wired end-to-end |
| regression-auditor | maps the diff → the layers/tests it must pass |
| security-route-auditor | auth-gating, secret exposure, route exposure |

Read-only is the contract: an auditor that can mutate is no longer trustworthy as a judge.

---

## Stand this up in a new project

1. **Wire the static gate (Layer A) into the build** so a regression fails by exit code. No green build without it.
2. **Write smoke + reconciliation (Layer B) read-only**, degrading to "skip" without credentials so they never block a build on a machine that has no secrets.
3. **Scaffold E2E (Layer C) for the must-pass journeys**, with dedicated test accounts (one per privilege level) seeded in the target.
4. **Add the auditor agents** — design-system-auditor, accessibility-auditor, feature-completeness-auditor, regression-auditor, security-route-auditor.
5. **Make preflight a REQUIRED step before shipping** — the [[preflight]] pass runs and emits GO / NO-GO; no deploy path skips it.
6. **Seed the test actors** — one account per privilege level in the test target, so Layer C and the auth negative paths always have someone to run as ([[auth-and-accounts]]).

---

See also: [[engineering-standards]] for the discipline these checks enforce, and [[shipping]] for where the gauntlet sits in the release flow.
