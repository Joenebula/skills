# Engineering discipline — generic skills + auditor agents

Claude Code skills and read-only auditor agents distilled from real web builds, drop-in for any project under this workspace. The engineering skills name no product, stack, or filename — only transferable principles. The one deliberate exception, **project-setup**, is concrete to the GitHub + Supabase + Vercel + Next.js stack (that's what makes it a usable click-by-click), while keeping the specific project identity generic. They cross-reference each other with `[[skill-name]]` links.

> **Evolving this library — HARD RULE.** Everything under `…/Web/.claude` — **skills _and_ agents** — is approval-gated. The library is meant to grow as we learn, but **never add or edit a skill or agent here without explicit approval first.** When something **major** changes (a new durable lesson, a repeated mistake worth a rule, a new pattern/gotcha, a shifted convention), *propose* the update — which file, what edit, why — and **wait for an explicit "yes."** No edits until then; "continue", a bug report, or finishing a task is **not** approval. Don't propose trivial/one-off churn. Capturing learnings is continuous; _writing_ them is gated. See [engineering-standards](engineering-standards/SKILL.md) Stage 12 and [ask-dont-guess](ask-dont-guess/SKILL.md).

The library is three layers: the **spine** (the always-on process and craft below), a **cross-cutting craft** set (the quality concerns every feature touches), and **domain build guides** ("how to build X"). Together they cover clarify → design → build → review → verify → secure → ship → operate.

## Two tracks, one spine — the no-crossover rule

The spine and cross-cutting craft apply to **every** build. The domain guides are conditional: **a domain guide fires only when the project actually contains its domain.**

- **Design / content track** — brand, marketing, portfolio, editorial, civic sites: [frontend-design](frontend-design/SKILL.md) + [design-system](design-system/SKILL.md) for the look, [cms](cms/SKILL.md) for the content, [seo](seo/SKILL.md) for findability; auth / email / grids / analytics / integrations only if the site actually has accounts, sends mail, or manages records.
- **Commerce track** — anything that sells: everything above **plus** the commerce quartet — [storefront](storefront/SKILL.md), [ecommerce-admin](ecommerce-admin/SKILL.md), [payments](payments/SKILL.md), [loyalty](loyalty/SKILL.md).

**No crossover, in either direction:**

1. **On a build that sells nothing, the commerce quartet stays silent.** Never import a cart, checkout, order lifecycle, gateway, or points ledger into a site with no purchase — a portfolio doesn't get an "orders" table because the pattern was handy.
2. **On a commerce build, the boundary is per surface, not per repo.** Brand, landing, and editorial pages are design-track surfaces — [frontend-design](frontend-design/SKILL.md) may be bold there. Product → cart → checkout → account is the commerce path, where **convention, clarity, and trust outrank novelty**: same tokens, plainest patterns, no experiments on the money path.
3. **Content is not catalogue.** Editorial pages live in the [cms](cms/SKILL.md); products/variants/inventory live in [ecommerce-admin](ecommerce-admin/SKILL.md). Never model products as CMS pages or pages as products — the two have different owners, lifecycles, and integrity rules.

## The spine — process & craft (`skills/<name>/SKILL.md`)

| Skill | Use it… |
|---|---|
| **[project-setup](project-setup/SKILL.md)** | standing up or onboarding to a GitHub + Supabase + Vercel + Next.js app — the bootstrap order, where every API key goes, and local-first boot; plus `references/` for optional services, go-live, and self-hosting. (Concrete to that stack.) |
| **[design-system](design-system/SKILL.md)** | before any UI work — build from documented tokens + components + a live gallery; never invent classes or hand-pick values; also: how to stand a design system up from scratch. |
| **[engineering-standards](engineering-standards/SKILL.md)** | before building/changing any feature, action, module, API, or shared mechanism — the process laws, the 12-stage build pipeline, the reuse catalogue, the data-gotchas list, server-side gating, and the data-reconciliation rule. |
| **[regression-testing](regression-testing/SKILL.md)** | before calling a change "done" and before any deploy — the layered static → smoke+reconcile → behavioural model, the domain must-pass catalogue, the GO/NO-GO gate, and the guardian-auditor pattern. "It builds" is not "it works." |
| **[preflight](preflight/SKILL.md)** | immediately before any deploy, merge, or "done" claim — the orchestrated pass that scopes the diff, fans out the auditors, climbs the layers, and emits ONE explicit GO / NO-GO. The gate, actually run. |
| **[ask-dont-guess](ask-dont-guess/SKILL.md)** | always-on — flag ambiguity and STOP, recommend before acting, verify don't assume, and never ship anything that looks done but isn't. |
| **[shipping](shipping/SKILL.md)** | before and during any deploy — verify → regression-gate → ship → confirm; authorized deploys only, never mask an exit code, confirm the release is actually live. |
| **[code-review](code-review/SKILL.md)** | reviewing a diff/PR or your own change before "done" — what to look for in priority order, refute before you trust, and feedback that lands. |
| **[debugging](debugging/SKILL.md)** | investigating any bug or failure — reproduce first, read the real evidence, isolate one variable at a time, fix the cause not the symptom, and ship the regression test that would have caught it. |
| **[refactoring](refactoring/SKILL.md)** | restructuring code or delivering a large change — keep behaviour identical, move in small reversible steps, ship incrementally behind flags. |

## Cross-cutting craft — the quality concerns every feature touches

| Skill | Use it… |
|---|---|
| **[data-modelling](data-modelling/SKILL.md)** | before any table/column/enum/migration — model entities first; additive, reversible, non-destructive migrations; idempotent seeds. |
| **[api-design](api-design/SKILL.md)** | before adding/changing an endpoint — shape, validation, one error format, pagination, idempotency, versioning. |
| **[security](security/SKILL.md)** | auth, permissions, secrets, user input, uploads, third-party calls — gate on the server, treat all input as hostile. |
| **[frontend-design](frontend-design/SKILL.md)** | choosing the aesthetic direction for a NEW interface or a new system's visual identity — bold, intentional, context-specific, executed through tokens; defers to design-system wherever one exists. |
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

### Commerce track — fire ONLY when the project sells

| Skill | Use it… |
|---|---|
| **[storefront](storefront/SKILL.md)** | the customer-facing shop — product/cart/checkout; prices and totals computed server-side; checkout idempotent and atomic. |
| **[ecommerce-admin](ecommerce-admin/SKILL.md)** | a commerce back-office — catalogue/variants, orders, customers, promotions, inventory, tax/shipping on one list→detail→form pattern. |
| **[payments](payments/SKILL.md)** | taking money — gateways, idempotent charges/refunds, subscriptions; card data off your servers, webhook = source of truth. |
| **[loyalty](loyalty/SKILL.md)** | memberships/subscriptions/points/referrals — an append-only points ledger, billing lifecycle, margin floors. |

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

> These sit alongside, and do not modify, the other entries in this directory (`marketingskills/`).
