# Bootstrap 5 Foundation

Why Bootstrap 5, how to theme it so it disappears, and which components to use, replace, or avoid. Read this for any Bootstrap theming or component decision.

## Contents
- Why Bootstrap for public service
- Theme it until it's invisible
- Customising via Sass
- Component decisions
- Accessibility caveats
- Performance

## Why Bootstrap for public service

Bootstrap is scaffolding, not the design. It earns its place here because:

- It is well-tested, responsive, and mobile-first out of the box.
- Its grid and utilities speed up the build and the handoff.
- A developer can theme it from your design tokens without bespoke CSS architecture.

The risk is the "default Bootstrap look" — instantly recognisable and generic, which undercuts trust. The whole job of the theme layer is to make Bootstrap invisible.

## Theme it until it's invisible

Signs a site looks like un-themed Bootstrap (avoid all of these): default blue `#0d6efd` primary, default border radius everywhere, default card shadows, the default navbar, off-the-shelf button styling. Override every one of these through the theme.

The theme layer should set: brand colours, type scale and typeface, spacing scale, border radii, shadows, and component-level overrides — all from your design tokens.

## Customising via Sass

Customise by overriding Sass variables *before* importing Bootstrap, not by fighting it with later CSS overrides. Pattern:

```scss
// 1. Your design tokens as Sass variables (from templates/design-tokens-starter.md)
$primary:   #6b1f7a;   // your brand colour, not Bootstrap blue
$font-family-base: "Your Font", system-ui, sans-serif;
$border-radius: 0.5rem;
$min-contrast-ratio: 4.5;   // enforce WCAG AA on auto-generated colours

// 2. Then bring in Bootstrap
@import "bootstrap/scss/bootstrap";

// 3. Minimal bespoke overrides only where variables can't reach
```

Set `$min-contrast-ratio: 4.5` so Bootstrap's automatic colour-contrast function picks text colours that meet WCAG AA against your backgrounds. Use only the parts of Bootstrap you need (import individual Sass partials) to keep the bundle small.

## Component decisions

| Bootstrap component | Decision | Note |
|---|---|---|
| Grid, utilities, reboot | Use | The core value. |
| Buttons, forms, cards | Use, themed | Override styling via Sass; keep semantics. |
| Navbar | Use with care | Re-theme heavily; verify keyboard + screen reader behaviour. |
| Modal | Use sparingly | Test focus trap and return; avoid for core journeys (breaks no-JS). |
| Dropdown | Use with care | Verify keyboard operation and ARIA. |
| Carousel | Avoid | Poor for accessibility and rarely serves a user need. |
| Tooltip/Popover | Avoid for essential info | Not reliably available to touch/keyboard/SR users (SC 1.4.13). |
| Accordion | Use | Good for long content on mobile; verify ARIA states. |
| Toasts | Use with care | Must be announced to screen readers (live region). |

## Accessibility caveats

Bootstrap is reasonable but not automatically conformant. Always verify:

- **Colour contrast** — defaults don't all pass; that's what `$min-contrast-ratio` is for.
- **Focus indicators** — ensure a visible, strong focus style meeting SC 2.4.13 Focus Appearance; don't suppress outlines.
- **Focus not obscured** — sticky navbars/footers can hide the focused element (SC 2.4.11); add scroll-margin.
- **JS components** — modal, dropdown, offcanvas: test the focus management and ARIA yourself.
- **Form validation** — Bootstrap's validation styles need real error text and programmatic association, not just colour.

## Performance

- Import only needed Sass partials; don't ship the whole CSS bundle.
- Drop Bootstrap's JS bundle if you only use a couple of components — import those individually.
- Core journeys must work without JavaScript (core principle 5). Bootstrap's interactive components are progressive enhancements, never the only path.
