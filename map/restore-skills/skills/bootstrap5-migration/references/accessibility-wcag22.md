# Accessibility — WCAG 2.2 AA

Making a migrated commercial site accessible. Read this during the accessibility pass and while building each page. WCAG 2.2 AA is the target.

## Contents
- The target and why it matters commercially
- Semantics first
- The accessibility essentials checklist
- WCAG 2.2's newer criteria that bite e-commerce
- Common migration-specific fixes
- How to test

## The target and why it matters commercially

WCAG 2.2 AA is the working standard. Commercially it matters because: accessibility law (the Equality Act in the UK; ADA-driven litigation in the US; the European Accessibility Act for in-scope services from June 2025) applies to private businesses, and inaccessible checkout flows directly lose sales. Treat it as both compliance and conversion.

## Semantics first

Most accessibility comes free from correct HTML. Migration is the moment to fix it:
- Real landmarks: `<header> <nav> <main> <footer>`, one `<main>` per page.
- One `<h1>` per page; headings nested without skipping levels.
- Interactive things are `<button>` (actions) or `<a href>` (navigation), never `<div onclick>`.
- Real `<form>`, `<label>`, `<fieldset>`/`<legend>`, `<input>` with types.
- Lists are lists; tables are tables with `<th scope>`.

## The accessibility essentials checklist

- [ ] Skip link to `<main>` as the first focusable element (SC 2.4.1).
- [ ] Visible, strong focus indicator everywhere; never `outline:none` without a replacement (SC 2.4.7, 2.4.13).
- [ ] Logical tab order matching reading order (SC 2.4.3).
- [ ] All images: meaningful `alt`, or `alt=""` if decorative (SC 1.1.1).
- [ ] Text contrast ≥4.5:1; UI/large text ≥3:1 (SC 1.4.3, 1.4.11). Re-check brand accents (gold/bronze on dark frequently fail).
- [ ] No info by colour alone — pair with text/icon (SC 1.4.1).
- [ ] Every control has an accessible name matching its visible label (SC 2.5.3); icon-only buttons get `aria-label`.
- [ ] Forms: labels associated, errors summarised + focused + linked, format hints, `aria-invalid` (SC 3.3.1–3.3.3).
- [ ] Reflows to one column at 320px, no horizontal scroll (SC 1.4.10).
- [ ] Motion respects `prefers-reduced-motion` (SC 2.3.3).
- [ ] Dynamic updates (toast, cart count, countdown) announced via live regions (SC 4.1.3).

## WCAG 2.2's newer criteria that bite e-commerce

WCAG 2.2 added criteria that hit shop/checkout flows specifically:
- **2.4.11 Focus Not Obscured (AA)** — sticky headers, cookie banners, and "added to cart" bars must not hide the focused element. Add `scroll-margin-top` equal to the sticky header height.
- **2.5.8 Target Size Minimum (AA)** — interactive targets ≥24×24px; quantity steppers, remove-item buttons, and swatches are common offenders.
- **3.2.6 Consistent Help (A)** — keep the help/contact route in the same place across pages.
- **3.3.7 Redundant Entry (A)** — don't make users re-type info already given in the same checkout (billing = shipping option, saved details).
- **3.3.8 Accessible Authentication Minimum (AA)** — login/account must allow paste and password managers; no puzzle CAPTCHA without an alternative.

## Common migration-specific fixes

These recur when migrating bespoke sites:
- Custom modal/menu/age-gate built from `<div>`s → give a real dialog role and focus management, or use Bootstrap's modal/offcanvas.
- Hamburger `<div onclick>` → `<button>` with `aria-expanded`/`aria-controls`.
- Icon buttons (cart, account, close) with only an SVG → add `aria-label`.
- Card "whole card clickable via onclick" → wrap the title in a real link; make the card a styled link or use a stretched-link pattern, keyboard-reachable.
- Carousels (if kept) → provide controls, pause, and don't auto-advance without a pause (SC 2.2.2); often better removed.
- Placeholder used as the only label → add a real `<label>`.

## How to test

1. **Keyboard only** — unplug the mouse; complete browse → product → cart → checkout. Focus visible, order logical, nothing trapped or hidden.
2. **Screen reader** — at least one desktop (NVDA/VoiceOver) and one mobile (TalkBack/VoiceOver); navigate by headings and landmarks; complete a purchase.
3. **Automated scan** — axe / Lighthouse / WAVE catches ~a third of issues; a first pass, never sufficient alone.
4. **Contrast** — sample real text and UI against real backgrounds, including hover/focus states and brand accents.
5. **Reflow/zoom** — 320px width and 400% zoom with no loss of content or horizontal scroll.
Always cite the SC when reporting an issue so it's verifiable and fixable.
