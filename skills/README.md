# Engineering discipline — generic skills + auditor agents

Claude Code skills and read-only auditor agents distilled from real web builds, drop-in for any project under this workspace. The engineering skills name no product, stack, or filename — only transferable principles. The one deliberate exception, **project-setup**, is concrete to the GitHub + Supabase + Vercel + Next.js stack (that's what makes it a usable click-by-click), while keeping the specific project identity generic. They cross-reference each other with `[[skill-name]]` links.

> **Evolving this library — HARD RULE.** Everything under `…/Web/.claude` — **skills _and_ agents** — is approval-gated. The library is meant to grow as we learn, but **never add or edit a skill or agent here without explicit approval first.** When something **major** changes (a new durable lesson, a repeated mistake worth a rule, a new pattern/gotcha, a shifted convention), *propose* the update — which file, what edit, why — and **wait for an explicit "yes."** No edits until then; "continue", a bug report, or finishing a task is **not** approval. Don't propose trivial/one-off churn. Capturing learnings is continuous; _writing_ them is gated. See [engineering-standards](engineering-standards/SKILL.md) Stage 12.

The library is four layers. Above everything sits [`../CLAUDE.md`](../CLAUDE.md) — the **working agreement**, loaded unconditionally into every session: the disposition (rigorous partner, not agreeable assistant) and the stop-triggers, which must be in view before they can fire. Below it: the **spine** (the process and craft below), a **cross-cutting craft** set (the quality concerns every feature touches), and **domain build guides** ("how to build X"). Together they cover clarify → design → build → review → verify → secure → ship → operate.

## Scope — no crossover

The spine and cross-cutting craft apply to **every** build. The domain guides are conditional: **a domain guide fires only when the project actually contains its domain** — auth / email / grids / analytics / integrations only if the site actually has accounts, sends mail, or manages records; [cms](cms/SKILL.md) for editable content, [seo](seo/SKILL.md) for findability.

**Content is not catalogue.** Editorial pages (about, journal, landing) are CMS content; products/variants/prices/inventory on a build that sells things are admin/catalogue data. The two have different owners, lifecycles, and integrity rules — never model one as the other.

> **This library carries no build guidance for a commerce money path** (cart, checkout, orders, payment gateways, points/loyalty ledgers) — that domain guide (`commerce`, and before it the four skills it replaced) was removed by request. What remains for a commerce build: [ecommerce-security-audit](ecommerce-security-audit/SKILL.md) audits one for security and data exposure once it exists, but does not teach how to build the money path correctly (it explicitly excludes general correctness/performance/ops from its scope). A build touching money still gets the generic spine — [engineering-standards](engineering-standards/SKILL.md)' server-side-gating and reconciliation rules, [data-modelling](data-modelling/SKILL.md)'s money-as-minor-units and append-only-ledger rules — but nothing commerce-specific (idempotent checkout, margin floors, webhook-as-truth). If commerce build guidance is needed again, the eval evidence for why it should be ONE skill rather than four (`storefront`/`ecommerce-admin`/`payments`/`loyalty` fired independently and left two laws — margin floors, tax/shipping rates — owned by nobody) is in `../eval/`.

## The spine — process & craft (`skills/<name>/SKILL.md`)

| Skill | Use it… |
|---|---|
| **[project-setup](project-setup/SKILL.md)** | standing up or onboarding to a GitHub + Supabase + Vercel + Next.js app — the bootstrap order, where every API key goes, and local-first boot; plus `references/` for optional services, go-live, and self-hosting. (Concrete to that stack.) |
| **[design-system](design-system/SKILL.md)** | before any UI work — build from documented tokens + components + a live gallery; never invent classes or hand-pick values; also: how to stand a design system up from scratch, including choosing its aesthetic direction when none exists yet. |
| **[engineering-standards](engineering-standards/SKILL.md)** | before building/changing any feature, action, module, API, or shared mechanism — the process laws, the 12-stage build pipeline, the reuse catalogue, the data-gotchas list, server-side gating, and the data-reconciliation rule. |
| **[regression-testing](regression-testing/SKILL.md)** | before calling a change "done" and before any deploy — the layered static → smoke+reconcile → behavioural model, the domain must-pass catalogue, the GO/NO-GO gate, and the guardian-auditor pattern. "It builds" is not "it works." |
| **[preflight](preflight/SKILL.md)** | immediately before any deploy, merge, or "done" claim — the orchestrated pass that scopes the diff, fans out the auditors, climbs the layers, and emits ONE explicit GO / NO-GO. The gate, actually run. |
| **[releasing](releasing/SKILL.md)** | before and during any deploy — verify → regression-gate → ship → confirm; authorized deploys only, never mask an exit code, confirm the release is actually live. |
| **[reviewing-code](reviewing-code/SKILL.md)** | reviewing a diff/PR or your own change before "done" — what to look for in priority order, refute before you trust, and feedback that lands. |
| **[debugging](debugging/SKILL.md)** | investigating any bug or failure — reproduce first, read the real evidence, isolate one variable at a time, fix the cause not the symptom, and ship the regression test that would have caught it. |
| **[refactoring](refactoring/SKILL.md)** | restructuring code or delivering a large change — keep behaviour identical, move in small reversible steps, ship incrementally behind flags. |

## Cross-cutting craft — the quality concerns every feature touches

| Skill | Use it… |
|---|---|
| **[data-modelling](data-modelling/SKILL.md)** | before any table/column/enum/migration — model entities first; additive, reversible, non-destructive migrations; idempotent seeds. |
| **[api-design](api-design/SKILL.md)** | before adding/changing an endpoint — shape, validation, one error format, pagination, idempotency, versioning. |
| **[security](security/SKILL.md)** | auth, permissions, secrets, user input, uploads, third-party calls — gate on the server, treat all input as hostile. |
| **[privacy-and-compliance](privacy-and-compliance/SKILL.md)** | collecting/storing personal data — minimise, consent, retention, subject-access/erasure, cookies, age gating. |
| **[accessibility](accessibility/SKILL.md)** | before any UI is "done" — WCAG AA: labels, contrast, keyboard, focus, semantics. A gate, not a garnish. |
| **[responsive-design](responsive-design/SKILL.md)** | before any UI is "done" — mobile-first, no overflow, fluid type, ≥44px targets, a real device matrix. |
| **[forms-and-input](forms-and-input/SKILL.md)** | any form or data-entry flow — validation, clear errors, autosave/unsaved-changes guards, file upload. |
| **[performance](performance/SKILL.md)** | something slow or that will grow — measure first, fix the biggest cost; paginate, avoid N+1, cache, budget assets. |
| **[seo](seo/SKILL.md)** | public pages that should be found — titles/metadata, sitemap, robots, structured data, one canonical URL. |
| **[internationalization](internationalization/SKILL.md)** | before hard-coding text/dates/money — externalise strings, format by locale, multi-currency, don't assume LTR. |
| **[observability](observability/SKILL.md)** | error handling, logging, monitoring, failure paths — structured logs, degrade gracefully, never fail silently. |
| **[background-jobs](background-jobs/SKILL.md)** | work off the request — scheduled/queued/async; idempotent, retry-safe, dead-lettered, observable. |
| **[infrastructure](infrastructure/SKILL.md)** | environments, config, backups, scaling — separate dev/stage/prod, back up before you need it, keep a rollback path. |

## Domain build guides — "how to build X"

Domain guides are conditional — each fires only when the project contains its domain (the track rule above).

### Any site — fire when the feature exists

| Skill | Use it… |
|---|---|
| **[auth-and-accounts](auth-and-accounts/SKILL.md)** | sign-up/sign-in, sessions, reset, account settings, role administration — the complete lifecycle, enumeration-safe errors, and the negative paths (signed-out stays out) as first-class must-pass journeys. |
| **[email-and-notifications](email-and-notifications/SKILL.md)** | transactional email, in-app notifications, message templates — async and exactly-once, verified domain, honoured preferences, merge fields that resolve, and never a real send from dev. |
| **[cms](cms/SKILL.md)** | editable content — content types, a page/block model, media library, navigation, SEO fields, publishing. Content, not catalogue. |
| **[analytics-dashboards](analytics-dashboards/SKILL.md)** | metrics/KPIs/dashboards — define the metric first, compute from source, show it honestly. |
| **[data-grids](data-grids/SKILL.md)** | any list of many records — search/filter/sort/paginate/bulk/export; server- vs client-side by size. |
| **[integrations](integrations/SKILL.md)** | connecting a third party — field ownership, idempotent sync, verified webhooks, graceful fallback. |

### Commerce sites — pre-deploy security gate only

No build guidance remains for the commerce money path (see the note above). This is the one commerce-specific skill left, and it is an **audit**, not a build guide:

| Skill | Use it… |
|---|---|
| **[ecommerce-security-audit](ecommerce-security-audit/SKILL.md)** | before deploying any site that **sells or stores customer data** — a concrete, owner-facing audit of the money path and data exposure (price-tampering & fake/simulated payment paths, webhook verification, IDOR / broken access control, exposed keys, injection, security headers, regulated-goods age checks, UK selling law) that produces a plain-English report + fixes for a non-developer owner. It **complements** the generic [security](security/SKILL.md) skill and the [security-route-auditor](../agents/security-route-auditor.md) agent (it cross-links both); run it as part of [preflight](preflight/SKILL.md) on any commerce build. It explicitly does not audit general correctness, performance, or ops — see its own boundary rule. Approval-gated to add/edit like every skill here. |

## Auditor agents (`../agents/<name>.md`)

Read-only watchers (Read/Grep/Glob[/Bash]) — each maps a diff to risks and required fixes, returns a verdict + numbered issues, and proposes no edits.

| Agent | Guards |
|---|---|
| **design-system-auditor** | every class/token traces to the documented system; no invented styling. |
| **accessibility-auditor** | the WCAG AA gate — semantics, labels, keyboard, focus, contrast-via-tokens; declares what only a manual pass can prove. |
| **feature-completeness-auditor** | every affordance is wired to real behaviour; no dead controls, broken-promise copy, or fixtures-on-live. |
| **regression-auditor** | maps a change to the must-pass checks/tests; flags features shipping with no covering test. |
| **security-route-auditor** | server-side auth/capability gating, correct client usage, the staged write path, and no secret/PII leakage. |

The orchestrated pass that fans these out on a diff and turns their verdicts plus the regression layers into one GO / NO-GO is [preflight](preflight/SKILL.md).

> The always-on layer these all defer to is [`../CLAUDE.md`](../CLAUDE.md).
