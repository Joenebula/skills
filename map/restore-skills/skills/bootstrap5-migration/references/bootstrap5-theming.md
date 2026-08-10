# Bootstrap 5 Theming — Keep the Brand, Lose the Default Look

How to set up Bootstrap 5 and theme it so the existing design survives and it never looks like stock Bootstrap. Read this when setting up the framework or migrating an existing design system.

## Contents
- The principle
- Two ways to include Bootstrap
- Migrating existing design tokens
- Sass variable overrides
- Dark-theme brand sites
- Making Bootstrap invisible
- Keeping the bundle lean

## The principle

Bootstrap supplies the grid, components, and responsive utilities. The brand supplies the look. If the existing site has a coherent design system — tokens, fonts, a colour palette — that is an asset: port it into Bootstrap's Sass variables so the migrated site looks the same (or better) on a cleaner foundation. The failure mode is a site that suddenly looks like every other Bootstrap template: default blue, default radius, default navbar.

## Two ways to include Bootstrap

**Sass (preferred for real theming).** Override variables *before* importing Bootstrap, so the brand cascades through every component. Requires a build step (Dart Sass).
```scss
// theme-overrides.scss  (see templates/theme-overrides.scss)
$primary: #C6A75E;            // brand colour, not Bootstrap blue
$body-bg: #0E0E0E;
$body-color: #F5F0E8;
// ...then:
@import "bootstrap/scss/bootstrap";
```

**CDN + override layer (no build step).** Link Bootstrap's compiled CSS, then a `theme.css` after it that re-maps Bootstrap's CSS custom properties and overrides components. Workable for static sites that must "just open in a browser", but more verbose and easier to get specificity wrong. Bootstrap 5 exposes CSS variables (e.g. `--bs-primary`, `--bs-body-bg`) you can reassign:
```css
:root {
  --bs-primary: #C6A75E;
  --bs-body-bg: #0E0E0E;
  --bs-body-color: #F5F0E8;
  --bs-border-radius: .75rem;
}
```
Choose based on the project's build constraints; if the deliverable must run from `file://` with no tooling, use the CDN + override approach and keep the brand tokens in `:root`.

## Migrating existing design tokens

Map the site's existing `:root` tokens to Bootstrap's variables one-for-one. Typical mapping:

| Existing token | Bootstrap Sass var | Bootstrap CSS var |
|---|---|---|
| `--gold` (accent) | `$primary` | `--bs-primary` |
| `--bg` (page) | `$body-bg` | `--bs-body-bg` |
| `--text` | `$body-color` | `--bs-body-color` |
| `--bg-card` | `$card-bg` | `--bs-card-bg` (component) |
| `--radius` | `$border-radius` | `--bs-border-radius` |
| serif/sans fonts | `$font-family-sans-serif`, headings | `--bs-body-font-family` |
| muted text | `$secondary` / `$text-muted` | `--bs-secondary-color` |

Keep the original semantic token names alive too (as CSS variables) so existing bespoke components keep working during a phased migration.

## Sass variable overrides worth setting

```scss
$primary:            #C6A75E;
$body-bg:            #0E0E0E;
$body-color:         #F5F0E8;
$border-radius:      .75rem;
$font-family-sans-serif: "Inter", system-ui, sans-serif;
$headings-font-family:   "Cormorant Garamond", Georgia, serif;
$min-contrast-ratio: 4.5;     // force Bootstrap's auto text colour to meet WCAG AA
$enable-shadows:     false;   // if the brand is flat
$enable-rounded:     true;
```
`$min-contrast-ratio: 4.5` is important: Bootstrap auto-picks black or white text on coloured backgrounds, and the default ratio can pass content that fails WCAG. Set it to 4.5 so generated pairings meet AA.

## Dark-theme brand sites

Bootstrap 5.3+ has a built-in colour-mode system (`data-bs-theme="dark"`). For a site that is dark by design (gold-on-near-black, say), either set `data-bs-theme="dark"` on `<html>` and override the dark-mode variables, or treat dark as the only theme and override the base variables directly. Verify gold/bronze accents against the dark background for contrast (SC 1.4.3, 1.4.11) — thin gold text on near-black frequently fails.

## Making Bootstrap invisible

Override all of these or the site reads as "a Bootstrap site": default `$primary` blue, default `.btn` styling, default `.navbar`, default border-radius, default focus ring colour, default card shadow, default font stack. Re-theme each from brand tokens.

## Keeping the bundle lean

- With Sass, import only the parts used (`@import "bootstrap/scss/grid"`, specific components) rather than the whole library.
- Only load Bootstrap's JS for components actually used (collapse, modal, offcanvas, dropdown). You can import individual plugins instead of the full bundle.
- Self-host or preconnect web fonts and set `font-display: swap` to protect load performance.
