# Grid & Layout — Converting Bespoke CSS to Bootstrap

How to convert hand-rolled layouts (floats, fixed widths, ad-hoc flex) to the Bootstrap 5 grid and utilities, cleanly and responsively. Read this when migrating page layout.

## Contents
- Container, row, column
- Breakpoints and mobile-first
- Common conversions
- Alignment (the "clean and aligned" ask)
- Spacing utilities
- When NOT to use the grid
- Reflow and overflow

## Container, row, column

Bootstrap layout is `container` → `row` → `col`. Columns must be direct children of a row; rows live inside a container. The 12-column grid means widths are twelfths: `col-md-6` is half from the `md` breakpoint up.

```html
<div class="container">
  <div class="row g-4">
    <div class="col-12 col-md-6 col-lg-4">…</div>
    <div class="col-12 col-md-6 col-lg-4">…</div>
    <div class="col-12 col-md-6 col-lg-4">…</div>
  </div>
</div>
```
- `container` is responsive-fixed-width; `container-fluid` is full-width; `container-{breakpoint}` is fluid until that breakpoint.
- `g-*` sets gutter (gap) between columns — replaces manual margins between cards.

## Breakpoints and mobile-first

Bootstrap is mobile-first: an unsuffixed class applies at all sizes; a suffixed class (`-sm -md -lg -xl -xxl`) applies from that width up. Design the smallest screen first, then add column splits at larger breakpoints. A site with "only 3 media queries" usually needs its fixed layouts expressed as responsive column classes so it reflows at every size, not just three.

| Breakpoint | ≥ width |
|---|---|
| (default) | 0 |
| sm | 576px |
| md | 768px |
| lg | 992px |
| xl | 1200px |
| xxl | 1400px |

## Common conversions

| Old pattern | Bootstrap replacement |
|---|---|
| `float: left; width: 33%` | `col-12 col-md-4` |
| fixed `width: 1200px; margin: 0 auto` | `container` |
| flex row of cards with manual margins | `row g-4` + `col-*` |
| `display:flex; justify-content:space-between` | `d-flex justify-content-between` |
| media query stacking at mobile | column classes (`col-12` then `col-md-*`) |
| hand-built nav bar | `navbar navbar-expand-lg` (themed) |
| custom card | `card` (themed) or keep bespoke card, place in grid |

You don't have to convert every bespoke component into a Bootstrap component — often the right move is to keep a well-built custom card and just place it inside the Bootstrap grid for layout and responsiveness.

## Alignment (the "clean and aligned" ask)

"Make elements aligned and clean" usually means: consistent gutters, equal-height cards, aligned baselines, and consistent vertical rhythm.
- Equal-height columns: cards stretch by default in a `row`; use `h-100` on the card so all match the tallest.
- Vertical centring: `align-items-center` on the row; `align-self-*` per column.
- Horizontal alignment of a group: `justify-content-{start|center|between|end}` on a `d-flex`.
- Consistent rhythm: use the spacing scale (below) rather than arbitrary pixel margins.

## Spacing utilities

Use `m-`/`p-` with `t b s e x y` sides and a 0–5 (and `auto`) scale instead of bespoke margins: `mt-4`, `py-5`, `mb-0`, `mx-auto`. This is what produces visual consistency across pages — every gap comes from the same scale. Extend the scale via `$spacers` in Sass if the brand needs more steps.

## When NOT to use the grid

For one-dimensional arrangements (a row of buttons, an inline meta line), flex utilities (`d-flex gap-2 align-items-center`) are cleaner than a grid row. Use CSS grid utilities or bespoke CSS for genuinely 2-D bespoke layouts the 12-col grid can't express. The grid is for page layout, not every flex situation.

## Reflow and overflow

- Verify the page reflows to a single column at 320px with no horizontal scroll (WCAG 2.2 SC 1.4.10). The grid does this if columns carry `col-12` as their base.
- Watch for fixed-width children (images, tables, pre) that break reflow; constrain with `img-fluid`, `table-responsive`, and `overflow-auto`.
- Test every breakpoint, not just phone and desktop — the `md`/`lg` middle is where bespoke conversions most often break.
