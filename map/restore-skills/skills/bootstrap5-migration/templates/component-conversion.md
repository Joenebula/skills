# Template — Component Conversion Log

Record each bespoke component and how it maps to Bootstrap 5, so the migration is consistent and reviewable. One row per component; fill as you go.

## Conversion table

| Bespoke component | Approach | Bootstrap equivalent / plan | Accessibility added | Done |
|---|---|---|---|---|
| Top nav (custom flex) | Replace | `navbar navbar-expand-lg`, themed | nav label, real toggler button, aria-expanded, aria-current | ☐ |
| Mobile menu (div + onclick) | Replace | `offcanvas` or `collapse` | focus trap/return, keyboard, aria | ☐ |
| Age gate (div overlay) | Rebuild | `modal` + DOB input | role=dialog, aria-modal, focus mgmt, labelled input | ☐ |
| Product card (bespoke) | Keep + reframe | place in `row g-4 > col-*`, `h-100` | linked title, alt text, named add-to-cart button | ☐ |
| Cart line items | Replace structure | responsive table/list + grid | accessible names, announce totals | ☐ |
| Checkout steps | Keep + improve | grid + `fieldset`/`legend` | error summary+focus, autocomplete, redundant-entry | ☐ |
| Tabs (portal pages) | Replace | Bootstrap `nav-tabs` + `tab-pane` | managed ARIA | ☐ |
| Accordion / FAQ | Replace | Bootstrap `accordion` | managed aria-expanded | ☐ |
| Toast / notification | Keep + wire | Bootstrap `toast` | aria-live region | ☐ |
| Countdown timer | Keep, modernise JS | vanilla, requestAnimationFrame/interval | polite live update, not per-tick spam | ☐ |
| Scroll-reveal animation | Replace mechanism | CSS class + IntersectionObserver | prefers-reduced-motion honoured | ☐ |
| Modal (recipe/upgrade) | Replace | Bootstrap `modal` | focus mgmt, labelled, Escape | ☐ |
| Payment selector (div onclick) | Replace | real radio group | fieldset/legend, keyboard | ☐ |

## Conversion principles

- **Keep good bespoke components**; just place them in the Bootstrap grid for layout/responsiveness. Don't force everything into a Bootstrap component.
- **Replace anything built from `<div onclick>`** that should be a button/link/dialog — that's where accessibility is won.
- **Prefer Bootstrap's JS components** (modal, offcanvas, collapse, tab, toast, dropdown) — they ship managed ARIA and focus.
- **Record the accessibility added** for each, so the tester can verify against it.

## Notes / decisions

[Record any project-specific calls — e.g. "kept the custom hero because Bootstrap carousel was removed for accessibility", "age gate uses DOB not yes/no per regulated-products reference".]
