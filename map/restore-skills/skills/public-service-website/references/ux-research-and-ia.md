# UX Research & Information Architecture

Guidance for the discovery and structure phases of a public service site. Read this when working on user research, user needs, journeys, sitemaps, or IA.

## Contents
- Starting from user needs
- Lightweight research methods that fit civic budgets
- Writing user needs and acceptance
- User journeys
- Information architecture
- Sitemaps
- Navigation patterns

## Starting from user needs

A public service site exists to let someone *do something* or *find something out*. Start every project by listing the top tasks — the handful of things most users come to accomplish — and rank them by frequency × importance. Everything else is secondary navigation.

Write user needs in the GDS format:

> As a [who], I need to [what], so that [why].

Example: "As a resident, I need to report a broken streetlight, so that it gets fixed and my street is safe at night."

Avoid needs phrased as organisational wants ("As the council, we need residents to use the portal"). That is not a user need; it is an internal goal. Keep the two lists separate and let user needs drive the IA.

## Lightweight research methods that fit civic budgets

Public service projects rarely have lab budgets. Prioritise methods with high signal per pound:

- **Top-task analysis** — survey or workshop to identify the 5–10 things users most want. Cheap, high leverage, anchors the whole IA.
- **Guerrilla testing** — 5 users in a café or community centre with a clickable prototype. Catches the majority of usability problems.
- **Tree testing** — validate the IA before any visual design. Users find items in a text-only menu structure. Reveals whether labels and grouping match mental models.
- **Card sorting** — open sort to discover groupings, closed sort to validate them.
- **Analytics review** — if an existing site exists, the search logs and top landing/exit pages tell you what users actually want versus what the org thinks they want.

Recruit for range, not volume: include older users, users with low digital confidence, users with disabilities, and users on cheap Android phones over mobile data. These are not edge cases in public service — they are the core audience.

## Writing user needs and acceptance

Each user need should be testable. Pair it with a plain success measure: "User can report a streetlight fault and receive a reference number in under 3 minutes, on a phone, without help." That measure becomes a journey goal and later an acceptance criterion.

## User journeys

Use `templates/user-journey.md`. A journey maps the steps a real person takes to complete one task, end to end, including the parts that happen off your site (a letter arriving, a phone call, a visit). For public services the off-site steps matter — they are often where trust is won or lost.

For each step capture: what the user is trying to do, what they see, what they think/feel, pain points, and the opportunity. Annotate emotional low points — these are where plain language and reassurance matter most.

## Information architecture

Principles:

1. **Mirror the user's mental model, not the org chart.** Residents do not know or care which department owns a service. Group by task and life event ("Moving house", "Having a baby", "Someone has died") not by directorate.
2. **Shallow over deep.** Aim for any top task reachable in 2–3 clicks. Deep hierarchies hide content.
3. **Plain, predictable labels.** Navigation labels are the highest-stakes content on the site. Test them with tree testing. Avoid internal jargon, acronyms, and clever names.
4. **One primary path per task.** Multiple competing routes to the same thing erode confidence. Pick the primary path; others can be secondary cross-links.

## Sitemaps

Produce a sitemap that shows hierarchy, page types, and which user need each top-level section serves. Mark which pages are transactional (forms, journeys) versus informational, because they have different design, performance, and accessibility demands.

## Navigation patterns

- A persistent, predictable primary nav. Same place on every page (WCAG 2.2 SC 3.2.3 Consistent Navigation).
- Breadcrumbs on deep pages so users can orient and step back up.
- A visible, forgiving search for users who navigate by searching rather than browsing.
- "Consistent Help" in the same relative location across pages (WCAG 2.2 SC 3.2.6) — contact route, help link, or live chat entry point.
- Skip link to main content as the first focusable element (see `references/accessibility-keyboard.md`).
