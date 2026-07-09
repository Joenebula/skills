---
name: engineering-standards
description: Invoke BEFORE building or changing any feature, action, module, API endpoint, or shared mechanism — AND whenever a count, metric, or displayed number disagrees with its source. The process laws, the 12-stage build pipeline, the shared-mechanism reuse catalogue, the living data-gotchas list, server-side security gating, and the data-reconciliation rule.
---

# Engineering standards — read this first, every time

The one core truth: **"it compiles" is not "it works."** A change is done only when it is wired end-to-end, behaviourally verified, and every number it shows equals its real source. For anything visual, [[design-system]] is the authority — invoke it too. This skill governs *how features are wired, kept consistent, gated, and proven.*

## The process laws (non-negotiable)

1. **Flag before continuing when unsure.** Ambiguous intent, unclear scope, more than one reasonable reading, or any destructive action → STOP and ask. The full guardrail (how to ask, recommend-then-act, honesty) lives in [[ask-dont-guess]].
2. **Recommend, then act.** State what you'll do and the recommended approach (with the trade-off), then do it. For multi-step or destructive work, lay out the plan and get a yes first.
3. **Change once = change everywhere.** A shared mechanism is shared. Change how one behaves (search, confirm, pagination, row-state, predictive input, bulk…) → change it in **every** site it appears, unless the user explicitly scopes it to one. See the catalogue below.
4. **Verify, then deploy.** Typecheck → production build → gate → ship, in that order. Static green is necessary, never sufficient. The release sequence lives in [[shipping]].
5. **Done means wired end-to-end AND behaviourally verified** — not "it compiles." Every affordance traces to a real backend that persists or acts; data shown loads from a real source; settings round-trip (write → read back); copy matches behaviour. Proof lives in [[regression-testing]].

## The build pipeline — walk EVERY stage in order

Consider each stage for any non-trivial change. **Skip a stage only with a stated reason**, never by accident. **The moment a stage surfaces an unknown or an assumption, STOP and flag it** — no guessing on data, components, scope, or destructive actions.

1. **Understand** — restate the request in your own words. More than one reading → **flag** and pick with the user. Output: a one-line statement of exactly what will change.
2. **Data** — what tables/columns/endpoints/enums does this touch? **Verify each EXISTS by reading it** (the schema/source/contract), not from memory. Watch the gotchas below.
3. **Reuse** — does a shared mechanism already cover this (catalogue below)? Reuse it. If you're about to build a *second* confirm / search / paginator / row-state, stop and wire the existing one.
4. **Components & styles** — any UI? → run [[design-system]]. Use documented components + tokens; never invent classes or hand-pick values. Tempted to → **flag**, then find or document the real one (in the same change).
5. **Consistency** — touched a shared mechanism? List **every** site it appears and plan to update all of them, unless explicitly scoped to one.
6. **Safety** — server-side gating, destructive = preview + confirm, migration-safe queries, no secrets/PII leaked. Anything irreversible → **flag** and confirm scope.
7. **Plan & recommend** — state the approach and your **recommendation** (with trade-offs). For destructive / ambiguous / large work, **get a yes first**.
8. **Build** — implement; if you touched a shared mechanism, **sweep all its sites** (stage 5).
9. **Verify (static)** — typecheck → production build. Watch the build's **exit code**, not just its log. *(This proves it DEPLOYS — not that it works.)*
10. **Completeness & regression** — run the auditors and trace BOTH ways: **forward** — every new affordance → the real route/persistence backing it (no toast-success-that-no-ops, no fixture dressed as real, no dead control left visible, copy == behaviour); **reverse** — every new route is actually called, every migration applied (or it degrades gracefully), every stored field consumed. Run feature-completeness-auditor and regression-auditor always; design-system-auditor + accessibility-auditor on any UI diff; security-route-auditor on any route diff — the orchestrated pass is [[preflight]]. A behavioural / signed-in / data-changing feature is NOT verified until its end-to-end check is green. Detail: [[regression-testing]].
11. **Ship** — the [[preflight]] gate must be GO before you push. Detail: [[shipping]].
12. **Learn** — update the skills / catalogue / gotchas list / gallery / memory **in the same change**. New shared mechanism or hard rule → this skill's catalogue; new bug-that-bit-us → the gotchas list; durable working rule → memory. Skipping is allowed only as a *consciously cleared* stage, never a forgotten one.

## The shared-mechanism catalogue (build once, reuse, sweep all sites)

Before building an interaction, check whether one of these already exists and **reuse it**. Improve one → sweep every site.

| Mechanism | Rule |
|---|---|
| **Confirmation dialog** | One reusable confirm component (title / message / yes / no / danger). **NEVER** a native `confirm/alert/prompt`. Every destructive action confirms through it. |
| **Predictive search / autocomplete** | One component for any input that references an existing entity — **type-constrained** (only suggests the valid type). |
| **Per-row async state** | **Every** server-backed row action shows a *busy* state + disabled control (prevents a double-fire), then a *done* state (or re-render). No silent waits. |
| **Pagination** | One paginator (prev/next + jump-to-page) + a per-page selector. Every long list paginates the same way. |
| **First-letter index** | A first-character index for long lists, applied consistently (client filter or a server `letter` param). |
| **Bulk-select** | Row checkbox + select-all header + a context bulk-action bar, on every long management list. |
| **Soft-delete / trash** | Remove = recoverable archive; a permanent "delete forever" is **opt-in** and separate. Don't reintroduce a raw destructive "remove." |
| **Search behaviour** | Server-side vs client-side, debounce, matching — change one, change **all** search sites together. |
| **Clean per-type URLs** | Every entity type owns its path (e.g. `/<type>/<slug>`). **All** sites that build/parse/emit URLs (links, router, canonical/metadata, sitemap) must agree on the shape — a type that defaults to the wrong value silently creates duplicate URLs. |

## The living data-gotchas list (each has caused a real bug — keep adding)

- **(a) Query pagination caps.** A single query often caps at a fixed row count; a bigger `limit` flag does **NOT** lift it. For full sweeps/counts, **page through in a loop** (range/offset) until a short page returns.
- **(b) A capped sample shown as a TOTAL.** A headline count must be an exact `COUNT`/aggregate from the source — **never `array.length` of a capped query.** (See the data-reconciliation rule.)
- **(c) Migration-safe enums.** Never query a value a not-yet-applied schema change adds — it errors the whole query. Reference only **existing** values; degrade gracefully until the change is applied.
- **(d) Read-only runtime filesystem.** Don't write user-editable content to disk at runtime, and don't depend on reading bundled files there. Persist editable content to the **data store**; ship defaults as **inlined imports** the bundler embeds on every host.
- **(e) Accidental duplicate top-level names that SILENTLY shadow.** Two top-level functions/consts sharing a name → the **later definition wins** and the earlier's callers break with **no error**. A syntax check will NOT catch it (it's legal). Before adding a top-level helper, search for the name; if it exists, use a distinct one. *(Triage: a deliberate "enhanced override" is fine; two unrelated things colliding is a real bug — never blanket-whitelist.)*
- **(f) Scope leaks in a large/monolithic module.** One inner scope cannot see another's locals; a shared global is visible to both. Bridge across scopes **explicitly** — a syntax check won't catch a scope break; only running it will.
- **(g) Fixture/demo data leaking onto a live surface.** Showcase/sample arrays must be stripped wherever real data is present, or fabricated content shows to real users. Guard every render for the empty (real) case.

## The data-reconciliation rule

**Any number shown to a user MUST equal its real source value** — never a capped page, a loaded window, or a fixture proxy dressed as a total. A number that *looks* right but is a capped sample is a silent lie.

- Compute every displayed count / KPI from the **authoritative source** — an exact `COUNT` or aggregate, not the length of a loaded array.
- **Ship a check** that asserts `displayed == source` within a tight tolerance — see the reconciliation layer in [[regression-testing]]. If you can't reconcile it, the number isn't trustworthy — don't show it.

## Security & gating (audited by security-route-auditor)

- **A client-side gate is UX only.** The **server gate is mandatory**: every write endpoint verifies identity **and** capability server-side and returns **401/403 BEFORE any write**.
- **Use a privileged/service credential only for the write** — and only *after* the auth/session check has verified the actor. The auth check runs on the user-scoped client; the privileged credential never gates, only writes.
- **The sacred write path.** Low-privilege actors may only ever insert **review/submission** records; live data changes only via reviewer/admin endpoints.
- **Destructive / bulk ops are two-step:** a `preview` returns counts + a sample; a separate, explicitly-confirmed `execute` performs.
- **Never leak** secrets, PII, or raw upstream errors in a response.
- **Gate on CAPABILITIES, not hard-coded role names.** Roles are additive (an actor may hold several); a capability table maps roles → capabilities, and code asks "can this actor do X," never "is this actor role Y." Role/permission additions ship as migrations the user must apply — query only values an applied migration has (gotcha c).

## Stage 12 — keep the docs current

When a change adds or alters a pattern, the docs are part of the change: new/changed shared mechanism, hard rule, gotcha, or capability → update this skill (and [[design-system]] as relevant) **in the same commit**; durable user preference → memory; a pattern an auditor relies on changed → update that agent too.

> **HARD RULE — never update a skill without asking first.** The skills library is updated *only* with the user's explicit say-so. When a **major** change lands — a new reusable mechanism, a new hard rule, a gotcha that bit us, a new domain pattern, a shift in how we build — **propose** the skill update (which skill, what edit, why) and **WAIT for a yes**. No edits to any skill **or agent** file until the user approves. Don't propose for trivial/one-off changes — only when the learning is durable and reusable. Capturing learnings is continuous; *writing* them is gated on approval. (This mirrors [[ask-dont-guess]] — ask before acting on anything that changes shared, durable artifacts.)

Cross-references: [[design-system]], [[regression-testing]], [[ask-dont-guess]], [[shipping]]. Deeper dives on the concerns this skill touches: [[reviewing-code]] (the review pass), [[security]] (the full trust model behind the gating section), [[data-modelling]] (entities + safe migrations behind the data stages), [[api-design]] (the contract shape), and [[observability]] (what happens when a stage's wiring fails).
