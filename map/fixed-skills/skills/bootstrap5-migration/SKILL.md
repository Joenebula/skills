---
name: bootstrap5-migration
description: Use this skill whenever the user wants to migrate, modernise, refactor, clean up, or rebuild an existing multi-page website onto Bootstrap 5 — especially static HTML/CSS/JS sites, brand sites, or e-commerce sites. Trigger it for tasks like "move this site to Bootstrap 5", "make this responsive", "tidy up this code", "replace the jQuery", "make all elements accessible", "fix the folder structure", or "do a full site-wide update". Also trigger for converting bespoke CSS layouts to the Bootstrap grid, replacing inline onclick handlers with delegated event listeners, adding WCAG 2.2 AA accessibility to a commercial site, building a shared header/footer/component system across many HTML pages, or age-gating and compliance for regulated products (alcohol, etc.). This skill is for COMMERCIAL/brand/e-commerce contexts; for civic/government sites use public-service-website instead. For the visual style of the rebuilt pages, follow mydesignskill.
---

# Bootstrap 5 Migration & Modernisation

A skill for taking an existing website — usually bespoke static HTML/CSS/JS — and rebuilding it on Bootstrap 5: clean, aligned, fully responsive, accessible to WCAG 2.2 AA, with a sane folder structure, modern JavaScript, and correctly linked pages. Built for commercial and brand sites, including e-commerce and regulated products.

## How to run a full-site migration (the workflow)

Do not start editing pages immediately. A site-wide migration goes wrong when you touch pages before the foundation exists. Work in this order:

1. **Audit first.** Inventory every page, the shared CSS/JS, the components, the links, and the current accessibility and responsiveness state. Produce a findings list before changing anything. Use `checklists/audit.md`.
2. **Decide what to preserve.** A good existing design system (tokens, fonts, colours) is an asset — migrate it onto Bootstrap, don't discard it. Bootstrap is the scaffolding; the brand theme rides on top. See `references/bootstrap5-theming.md`.
3. **Build the foundation.** Folder structure, the Bootstrap theme layer (Sass variable overrides from the existing tokens), and the shared header/footer/component partials. Get one page perfect as the reference. See `references/folder-structure.md` and `references/shared-components.md`.
4. **Migrate page by page, in batches.** Convert layout to the Bootstrap grid, add semantics and ARIA, fix links. Don't move on until a page passes `checklists/per-page.md`.
5. **Modernise the JavaScript.** Replace inline `onclick` and ad-hoc scripts with delegated listeners and Bootstrap's component JS. See `references/javascript-modernisation.md`.
6. **Accessibility pass.** WCAG 2.2 AA across the site. See `references/accessibility-wcag22.md`.
7. **Verify and hand off.** Run `checklists/pre-launch.md`.

Deliver in batches when the site is large — a correct foundation plus a few perfect pages beats 18 rushed ones. Tell the user what's done and what's pending each batch.

## When to consult which reference

Load the reference for the task at hand; don't read them all upfront.

| Working on... | Read |
|---|---|
| Auditing the existing site, planning the migration | `references/audit-and-plan.md` |
| Bootstrap 5 setup, theming, keeping the existing design | `references/bootstrap5-theming.md` |
| Converting bespoke layout to the Bootstrap grid | `references/grid-and-layout.md` |
| Folder/file structure, asset organisation | `references/folder-structure.md` |
| Shared header, footer, nav, repeated components across pages | `references/shared-components.md` |
| Replacing jQuery / inline onclick / old animations | `references/javascript-modernisation.md` |
| Accessibility, WCAG 2.2 AA, semantics, ARIA | `references/accessibility-wcag22.md` |
| E-commerce flows: cart, checkout, product, forms | `references/ecommerce-patterns.md` |
| Age gates, regulated-product compliance, sale terms | `references/regulated-products.md` |

## Templates

- `templates/page-skeleton.html` — a clean Bootstrap 5 page shell with correct head, semantics, skip link, and shared-partial markers.
- `templates/theme-overrides.scss` — where to put Sass variable overrides to make Bootstrap carry an existing brand.
- `templates/component-conversion.md` — how to record each bespoke component → Bootstrap mapping.
- `templates/audit-findings.md` — structure for the audit report and the "could be better" suggestions list.

## Checklists

- `checklists/audit.md` — before touching anything.
- `checklists/per-page.md` — before considering a page done.
- `checklists/pre-launch.md` — before the whole site ships.

## Core principles

1. **Audit before you act.** Never refactor blind. Know the page count, the shared assets, the component inventory, and the link graph first.
2. **Preserve a good design; replace a bad structure.** Migrate strong tokens and brand onto Bootstrap. The goal is the same look (or better), on a cleaner, responsive, accessible foundation.
3. **Bootstrap is scaffolding, not the visible design.** Theme it via Sass variables so it doesn't look like default Bootstrap. See `references/bootstrap5-theming.md`.
4. **Accessibility is part of the rebuild, not a later pass bolted on.** Semantics and ARIA go in as each page is built (WCAG 2.2 AA).
5. **Modern JS: no inline handlers.** Replace `onclick=""` with delegated `addEventListener`; use Bootstrap's component JS for modals/offcanvas/collapse; keep core navigation working without JS.
6. **One source of truth for shared chrome.** Header, footer, and nav defined once and included everywhere — never copy-pasted divergently across pages.
7. **Verify links and flows end to end.** Every internal link resolves; every e-commerce flow completes.
8. **Deliver in reviewable batches.** Foundation + reference page first; then pages in groups, each passing the per-page checklist.

## Working style

- Start by auditing and reporting findings; confirm scope and priorities before large edits.
- When the user says "jQuery" but the site is vanilla JS (or vice versa), check the actual code and tell them what's really there rather than assuming.
- Name the specific standard when giving accessibility advice (e.g. "WCAG 2.2 SC 2.4.7 Focus Visible") so it's verifiable.
- Keep the existing brand unless asked to redesign; "clean up" means structure, alignment, responsiveness, and accessibility — not a new look.
- For regulated products (alcohol, etc.), treat the age gate and sale terms as real requirements, not decoration — see `references/regulated-products.md`.
- Always end an audit with a prioritised "could be better" suggestions list.
