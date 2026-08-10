# Checklist — Per Page (before a page is "done")

Run on each migrated page before moving to the next.

## Structure & semantics
- [ ] Uses the standard page skeleton (`templates/page-skeleton.html`).
- [ ] One `<main id="main">`, one `<h1>`, headings in order without skips.
- [ ] Landmarks present: header, nav, main, footer.
- [ ] Shared header/footer come from the single source, not a divergent copy.
- [ ] Current page marked `aria-current="page"` in the nav.

## Layout & alignment
- [ ] Layout uses the Bootstrap grid (`container > row > col-*`).
- [ ] Consistent gutters (`g-*`) and spacing scale (`m-/p-`), not arbitrary pixels.
- [ ] Cards equal height where in a row (`h-100`); elements aligned.
- [ ] No leftover bespoke fixed widths breaking the grid.

## Responsiveness
- [ ] Reflows to one column at 320px; no horizontal scroll (SC 1.4.10).
- [ ] Checked at sm/md/lg/xl — the middle breakpoints too.
- [ ] Images `img-fluid`; tables `table-responsive`.

## JavaScript
- [ ] No inline `onclick` — behaviour is delegated in `main.js`.
- [ ] Navigation is real `<a href>`, not scripted clicks.
- [ ] Animations are CSS/IntersectionObserver and honour `prefers-reduced-motion`.
- [ ] Page works (core content + links) with JS disabled.
- [ ] Shared script guards missing elements (no thrown errors on this page).

## Accessibility (WCAG 2.2 AA)
- [ ] Skip link works; focus moves to main.
- [ ] All interactive elements are button/link/real controls; keyboard-operable.
- [ ] Visible, strong focus indicator (SC 2.4.7, 2.4.13); not obscured by sticky bars (SC 2.4.11).
- [ ] Icon-only buttons have accessible names (SC 2.5.3); targets ≥24px (SC 2.5.8).
- [ ] Images alt'd correctly; decorative = empty alt.
- [ ] Contrast checked, including brand accents and hover/focus states.
- [ ] Forms: labels, grouping, hints, error summary + focus + association (SC 3.3.1–3.3.3).
- [ ] Dynamic updates announced via live region (SC 4.1.3).

## Theming
- [ ] Looks like the brand, not default Bootstrap (primary, radius, navbar, fonts all themed).

## Links & content
- [ ] Every link on the page resolves to an existing target.
- [ ] Final content present; no placeholder/lorem.
- [ ] Title and meta description are page-specific.

## Commerce / compliance (if applicable)
- [ ] Flow step works end to end and matches `references/ecommerce-patterns.md`.
- [ ] Regulated-product requirements met (age flagging, 18+, terms) per `references/regulated-products.md`.
