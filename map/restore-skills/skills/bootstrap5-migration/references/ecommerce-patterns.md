# E-commerce Patterns

Accessible, responsive patterns for the commerce-specific pages: product listing, product detail, cart, checkout, account. Read this when migrating any shop or transactional page.

## Contents
- Product listing (category) pages
- Product detail
- Cart
- Checkout
- Account / login
- Forms throughout
- Trust and honesty

## Product listing (category) pages

- A responsive grid of product cards (`row g-4` + `col-6 col-md-4 col-lg-3` typically). Cards `h-100` for equal height.
- Each card: image with meaningful `alt` (the product, not "image"), product name as a real link, price as text (not colour-coded only), and an add-to-cart `<button>` with an accessible name including the product ("Add Spiced Rum to cart").
- Don't make the whole card a scripted click; use a real link on the title (stretched-link is fine if the card has one primary action and the link is keyboard-reachable).
- Filters/sort: real `<select>`/checkboxes with labels; announce result count changes via a live region (SC 4.1.3).
- Lazy-load below-the-fold images; size them to protect performance.

## Product detail

- One `<h1>` = product name. Gallery images with alts; thumbnails are buttons that update the main image (with announcement).
- Quantity stepper: label it; +/− are `<button>`s ≥24px (SC 2.5.8) with accessible names ("Increase quantity"); the number is an `<input type="number">` with a label.
- Variant selectors (size/colour): real radio groups in a `<fieldset>` with `<legend>`, not colour-only swatches — pair swatch with text.
- Add-to-cart confirmation goes to a live region; don't rely on a silent badge change.
- Price, stock, and any per-unit/ABV info as real text.

## Cart

- A table or list with: item (linked), variant, unit price, quantity (editable stepper), line total, remove button (accessible name "Remove X from cart", ≥24px).
- Order summary with subtotal, shipping, tax, total — as text, associated clearly.
- Update/remove without a full reload should announce the new totals (live region) and keep focus sensibly placed (not lost to top).
- Empty-cart state with a clear route back to shopping.
- Persisted cart (localStorage) is fine; guard the JS so a missing element on another page doesn't throw.

## Checkout

- Multi-step or single-page: either works; if multi-step, show progress and let users go back without losing data.
- **Redundant Entry (SC 3.3.7):** offer "billing same as shipping"; reuse saved details; don't ask twice.
- **Accessible Authentication (SC 3.3.8):** allow guest checkout; allow paste and password managers; no puzzle CAPTCHA without alternative.
- Group fields with `<fieldset>`/`<legend>` (shipping, billing, payment). Use correct `autocomplete` attributes (`given-name`, `address-line1`, `postal-code`, `cc-number`) — helps everyone, essential for some.
- Payment selector (card/PayPal/etc.): real radio group, not `<div onclick>`.
- Errors: summary at top, focus moved to it, each error linked to its field, plain wording (SC 3.3.1).
- Never trap the user; never hide the focused field behind a sticky summary bar (SC 2.4.11).
- Confirmation page with order reference, in text, and emailed.

## Account / login

- Real `<form>` with labelled fields; show/hide password is a labelled toggle button.
- Allow paste and password managers (SC 3.3.8).
- Error messages don't reveal whether an email exists (security) but are still clear.
- Dashboard tabs use Bootstrap tabs (managed ARIA) or real links.

## Forms throughout

- Every input has a visible, associated `<label>` (placeholder is not a label).
- Required fields marked in text; describe expected format before the field.
- Inline validation that's announced, not colour-only.
- Submit is a real `<button type="submit">`; the form works on Enter.

## Trust and honesty

- No dark patterns: no fake urgency/scarcity, no pre-ticked add-ons, no hidden costs — show shipping/tax before the final step.
- Clear, findable terms of sale, returns, delivery, and privacy.
- Honest stock and pricing. For regulated goods, see `references/regulated-products.md`.
