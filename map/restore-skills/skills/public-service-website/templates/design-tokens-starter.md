# Template — Design Tokens Starter

A starting token set, structured to map cleanly onto Bootstrap 5 Sass variables (see `references/bootstrap-foundation.md`). Replace the example values with the project's. Hand off in semantic terms.

## Token layers

1. **Primitive** — raw values.
2. **Semantic** — role-based aliases pointing at primitives.
3. **Component** — component-specific, pointing at semantics.

Design and communicate decisions at the semantic layer.

## Colour

### Primitive (example — replace)
```
color-brand-700:  #5a1a66
color-brand-600:  #6b1f7a
color-neutral-900: #1a1a1a
color-neutral-700: #3d3d3d
color-neutral-300: #cccccc
color-neutral-100: #f4f4f4
color-white:       #ffffff
color-success-600: #1e7e34
color-warning-600: #946200
color-error-600:   #b3261e
```

### Semantic
```
color-text-default:    {color-neutral-900}
color-text-muted:      {color-neutral-700}
color-bg-page:         {color-white}
color-bg-subtle:       {color-neutral-100}
color-action-primary:  {color-brand-600}
color-border-default:  {color-neutral-300}
color-feedback-success:{color-success-600}
color-feedback-warning:{color-warning-600}
color-feedback-error:  {color-error-600}
color-focus-ring:      {color-brand-700}
```

Every text-on-background pairing must meet SC 1.4.3 (4.5:1) and every UI boundary SC 1.4.11 (3:1). Check before finalising.

## Typography
```
font-family-base:  "Your Font", system-ui, -apple-system, sans-serif
font-size-root:    18px          # body baseline (min 16px)
type-scale-ratio:  1.25
line-height-body:  1.5           # SC 1.4.12
line-height-head:  1.2
font-weight-normal: 400
font-weight-bold:   700
```
Derived scale (root × ratio): h6 18 · h5 22 · h4 28 · h3 35 · h2 44 · h1 55 (round to taste).

## Spacing (4px base)
```
space-1: 4px   space-2: 8px   space-3: 12px  space-4: 16px
space-5: 24px  space-6: 32px  space-7: 48px  space-8: 64px
```

## Radius, shadow, layout
```
radius-sm: 4px   radius-md: 8px   radius-lg: 16px
shadow-sm: 0 1px 2px rgba(0,0,0,.08)
shadow-md: 0 4px 12px rgba(0,0,0,.10)
container-max: 1140px
measure-max: 70ch        # text line-length cap
target-min: 24px         # SC 2.5.8
target-comfortable: 44px
```

## Mapping to Bootstrap Sass

Override these *before* importing Bootstrap:
```scss
$primary:            #6b1f7a;   // color-action-primary
$body-color:         #1a1a1a;   // color-text-default
$body-bg:            #ffffff;   // color-bg-page
$font-family-base:   "Your Font", system-ui, sans-serif;
$font-size-base:     1.125rem;  // 18px
$line-height-base:   1.5;
$border-radius:      .5rem;     // radius-md
$min-contrast-ratio: 4.5;       // enforce WCAG AA
$spacer:             1rem;      // base for spacing utilities
```

Document each token's mapping so the developer can theme Bootstrap directly from this file.
