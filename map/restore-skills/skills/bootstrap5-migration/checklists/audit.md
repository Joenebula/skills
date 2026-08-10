# Checklist — Audit (before touching anything)

Run before any code changes. Output is findings + a plan, not edits. See `references/audit-and-plan.md`.

## Inventory
- [ ] Listed every page and its purpose.
- [ ] Identified shared CSS/JS vs per-page/inline styles and scripts.
- [ ] Determined how header/nav/footer are included (copy-paste / JS-injected / templated).
- [ ] Mapped the internal link graph; noted dead links and orphan pages.
- [ ] Listed asset references (css, js, img, fonts) and checked they resolve.

## Stack reality
- [ ] Checked whether jQuery is actually used (`grep` for it) — reported the truth vs the brief.
- [ ] Counted inline `onclick` handlers.
- [ ] Identified the animation mechanism (CSS, jQuery, scroll handlers, IntersectionObserver).
- [ ] Noted any no-JS gaps (chrome or journeys that need JS to work).

## Design system
- [ ] Reviewed CSS tokens, fonts, palette — decided preserve vs replace.
- [ ] Checked CSS health: line count, `!important`, id-selector reliance.
- [ ] Confirmed which bespoke components are worth keeping.

## Responsiveness baseline
- [ ] Counted media queries; noted fixed widths and reflow gaps.
- [ ] Spot-checked the site at mobile width.

## Accessibility baseline
- [ ] Counted ARIA/role usage (often zero).
- [ ] Checked images for alt.
- [ ] Noted interactive `<div onclick>`, missing skip link, custom widgets without focus management.
- [ ] Flagged likely contrast risks (brand accents on background).

## Commerce & compliance
- [ ] Identified e-commerce flows (cart, checkout, account, forms).
- [ ] For regulated products: assessed age gate quality, sale terms, marketing content, privacy/cookies.

## Output
- [ ] Findings written up (`templates/audit-findings.md`).
- [ ] Preserve-vs-replace decisions recorded.
- [ ] Folder structure target chosen.
- [ ] Theme-layer approach chosen (Sass vs CDN+override).
- [ ] Reference page chosen; remaining pages grouped into batches.
- [ ] Prioritised "could be better" suggestions list produced.
