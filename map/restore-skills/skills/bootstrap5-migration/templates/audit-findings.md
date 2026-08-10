# Template — Audit Findings & Suggestions

Structure for the audit report you produce before migrating, and the prioritised "could be better" list the user asked for.

---

## Site: [name]

**Pages:** [count] — [list or note]
**Shared assets:** [e.g. one css/styles.css, one js/main.js]
**Build step:** [none / Sass / bundler]
**Stack reality:** [e.g. "vanilla JS with N inline onclick handlers; no jQuery despite the brief"]

## What's good (preserve)

- [e.g. clean design tokens in :root, clamp() typography, no !important]
- [e.g. all images have alt]
- [...]

## What needs work (by area)

### Structure
- [folder layout, shared-chrome method, path issues]

### Layout & responsiveness
- [media query count, fixed widths, reflow gaps, alignment issues]

### JavaScript
- [inline handlers count, animation mechanism, no-JS gaps]

### Accessibility (WCAG 2.2 AA)
- [ARIA/role count, interactive divs, focus management, contrast risks, skip link]

### E-commerce flows
- [cart, checkout, forms — specific issues]

### Compliance (regulated product)
- [age gate quality, sale terms, marketing content, privacy/cookies]

### Links
- [dead links, orphan pages, asset reference issues]

## Migration plan

1. Foundation: [folder structure, theme layer, shared partials]
2. Reference page: [which page perfected first]
3. Batches: [grouping of remaining pages]

---

## "Could be better" — prioritised suggestions

Sort by impact. Keep each to one line with a why.

### High impact (accessibility / legal / broken)
1. [suggestion] — [why it matters]
2. …

### Medium (UX / performance / consistency)
1. …

### Nice to have
1. …
