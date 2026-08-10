# Design skill routing — proposed

Prepared 6 Aug 2026 for step 6 of the skills-map fix list. **Not applied** — applying it means
editing `SKILL.md` frontmatter in `~/.claude/skills/`, which is on your machine.

Everything below is derived from the five descriptions as they resolve in a live session, quoted
verbatim. No `SKILL.md` body was read, so this governs *triggering*, not content.

---

## The collision

Five skills answer some version of "build a good-looking page".

| Skill | Description, as it triggers today |
|---|---|
| `frontend-design` | "Create distinctive, production-grade frontend interfaces with high design quality. **Use this skill when the user asks to build web components, pages, or applications.** Generates creative, polished code that avoids generic AI aesthetics." |
| `mydesignskill` | "House design rules and a curated visual reference library for building polished **marketing and product web pages** … Encodes two hard visual constraints (no outline borders on containers; Material Design typefaces only) … Use when building, restyling, or reviewing landing pages, marketing sites, or product UI where a refined, intentional, non-'AI-slop' look is wanted." |
| `bootstrap5-migration` | "…**migrate, modernise, refactor … an existing multi-page website onto Bootstrap 5** … This skill is for COMMERCIAL/brand/e-commerce contexts; **for civic/government sites use a public-service skill instead.**" |
| `public-service-website` | "…**public service, civic, political, council, charity, or campaigning website** — UX research, IA, user journeys, wireframes, UI design, design tokens, component specs, accessibility annotations…" |
| `artifact-design` | "Design guidance and fundamentals for **Artifacts**." |

**The problem is one clause.** `frontend-design` triggers on *"build web components, pages, or
applications"* — a superset of every other trigger here. A request that should reach
`mydesignskill` (house rules, hard visual constraints) or `artifact-design` (a published Artifact)
satisfies `frontend-design` first, and nothing routes away from it.

`bootstrap5-migration` is the only one that routes explicitly, and it is the model: it names the
adjacent skill and the condition for handing over.

---

## Proposed routing

Read top to bottom; first match wins.

| If the work is… | Owner | Signal |
|---|---|---|
| a published Claude **Artifact** | `artifact-design` | output is an artifact page, not repo code |
| a **civic / council / charity / campaigning** site | `public-service-website` | audience is the public; accessibility and plain English outrank conversion |
| **migrating an existing multi-page site onto Bootstrap 5** (commercial) | `bootstrap5-migration` | there is an existing site being rebuilt |
| a **marketing or product page** where house style applies | `mydesignskill` | landing page, marketing site, product UI in your own aesthetic |
| **application UI** — components, state, interaction, in a codebase | `frontend-design` | app surface, not a marketing surface |

The distinction that does the work: **`mydesignskill` owns the marketing surface,
`frontend-design` owns the application surface.** Today both claim both.

---

## Description rewrites

Paste each into the `description:` field of the matching `SKILL.md`. Only the routing sentences
are new; the rest is preserved so existing triggering is not disturbed more than necessary.

### `frontend-design`

> Build **application** interfaces — components, screens, state and interaction — inside a
> codebase, with high design quality and no generic AI aesthetic. Use for app surfaces:
> dashboards, admin, forms, data views, product functionality.
>
> **Do not use for:** marketing or landing pages, which are `mydesignskill`; published Claude
> Artifacts, which are `artifact-design`; civic or public-service sites, which are
> `public-service-website`; rebuilding an existing site on Bootstrap 5, which is
> `bootstrap5-migration`.

### `mydesignskill`

> House design rules and a curated visual reference library for **marketing and product pages** —
> heroes, eyebrow labels, stat rows, feature cards, logo walls, FAQ accordions, testimonials, CTA
> bands, footers. Encodes two hard visual constraints (no outline borders on containers; Material
> Design typefaces only unless asked). Use when building, restyling or reviewing landing pages,
> marketing sites or product UI where a refined, non-"AI-slop" look is wanted.
>
> **Takes precedence over `frontend-design` for anything marketing-facing** — it carries the house
> constraints, which `frontend-design` does not. For application UI use `frontend-design`; for a
> published Artifact use `artifact-design`.

### `artifact-design`

> Design guidance and fundamentals for **published Claude Artifacts** — pages rendered on
> claude.ai rather than shipped in a repo.
>
> **Use for artifacts only.** For app UI use `frontend-design`; for marketing pages use
> `mydesignskill`. Pairs with `artifact-diagramming` for diagrams and `dataviz` for charts.

### `bootstrap5-migration`

No change needed — it already routes away, and its trigger is specific (an existing multi-page
site moving to Bootstrap 5). Optionally add `mydesignskill` to the existing routing sentence so
house style applies to the rebuilt pages.

### `public-service-website`

No change needed to scope. Optionally add: **for the Bootstrap 5 mechanics of a civic rebuild,
use `bootstrap5-migration` and keep this skill for research, IA, content and accessibility** —
today both claim Bootstrap 5 theming and WCAG 2.2, which is the one place they still collide.

---

## After applying

Run `skill-creator`'s eval against these prompts. Each should trigger exactly one skill:

1. "Build the admin events table with filters and pagination" → `frontend-design`
2. "Build the VibeHQ landing page hero and feature cards" → `mydesignskill`
3. "Make me a page showing this data as an artifact" → `artifact-design`
4. "Rebuild the council's site on Bootstrap 5" → `public-service-website` **and**
   `bootstrap5-migration` — the one genuine hand-off, and worth confirming it still works
5. "Move this brand site to Bootstrap 5" → `bootstrap5-migration`
6. "Build a page and make it not look AI-generated" → the ambiguous case. Whichever it picks,
   that is the default, and it should be a deliberate choice rather than the current accident.

Case 6 is the test that matters. It is the phrasing that started this.
