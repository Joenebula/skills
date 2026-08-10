# Audit & Plan

How to audit an existing site before migrating, and how to plan the work. Read this first on any migration.

## Why audit first

A site-wide migration fails when you start editing pages before you understand the whole. Spend the first pass purely on diagnosis. The output is a findings document (`templates/audit-findings.md`) and a batch plan — not changed code.

## What to inventory

Run these checks and record the numbers; they shape the whole plan.

### Pages and structure
```bash
find . -name '*.html' | sort        # page count and names
find . -type d                       # current folder structure
ls css/ js/ assets/ images/ 2>/dev/null
```
Note shared CSS/JS files versus per-page styles. A single shared stylesheet and script is the good case; inline `<style>`/`<script>` blocks per page are the refactor target.

### How shared chrome is included
Is the nav/header/footer copy-pasted into every page, or injected by JS (e.g. a `NAV_HTML` template literal written to the DOM), or already templated? This determines the shared-components strategy (`references/shared-components.md`).

### JavaScript reality check
```bash
grep -rho 'onclick' *.html | wc -l            # inline handlers (modernisation target)
grep -c 'addEventListener' js/*.js            # already-modern listeners
grep -rl 'jquery\|jQuery\|\$(' *.html js/*.js  # is jQuery actually used?
```
Users often say "update the jQuery" when the site is actually vanilla JS with inline `onclick`, or vice versa. **Check, then tell them what's really there.** Don't migrate a library that isn't present.

### Accessibility baseline
```bash
grep -rho 'aria-[a-z]*' *.html | sort | uniq -c   # ARIA usage (often zero)
grep -rho 'role=' *.html | wc -l                  # roles
grep -rho '<img' *.html | wc -l                    # images...
grep -rho 'alt=' *.html | wc -l                     # ...vs alts present
```
Common findings: images have alt (good) but interactive elements are `<div onclick>` with no role/keyboard support, custom modals/menus have no focus management, and there are no skip links.

### Responsiveness baseline
```bash
grep -c '@media' css/*.css      # few media queries = responsiveness gaps
```
Note whether layout uses fixed widths, floats, or a flex/grid system, and whether it reflows on mobile.

### CSS health
```bash
wc -l css/*.css
grep -c '!important' css/*.css   # override wars
grep -cE '^\s*#' css/*.css        # id-selector reliance (specificity traps)
```
Decent tokens, a clean reset, `clamp()` typography, and no `!important` mean the design system is worth preserving — migrate it, don't bin it.

### Link graph
```bash
grep -rho 'href="[^"]*\.html"' *.html | sort | uniq -c   # internal links
```
Cross-check that every linked file exists and every page is reachable. Flag orphans and dead links.

## Turning the audit into a plan

1. Decide what to preserve (design tokens, fonts, brand, good components) vs replace (layout method, inline handlers, copy-pasted chrome).
2. Define the folder structure target (`references/folder-structure.md`).
3. Define the theme layer that carries the brand onto Bootstrap (`references/bootstrap5-theming.md`).
4. Pick the reference page to perfect first (usually the home page or the most representative template).
5. Group remaining pages into batches by similarity (e.g. all shop pages together, all portal/account pages together).
6. Note regulated-product and e-commerce requirements early — they affect markup on many pages.

## The "could be better" list

Always end the audit with a prioritised suggestions list (the user asked for it, and it's where real value lands). Sort by impact: accessibility/legal first, then UX and performance, then nice-to-haves. Keep each item one line with a why. See `templates/audit-findings.md`.
