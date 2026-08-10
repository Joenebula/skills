# Template — Wireframe Annotation Guide

How to annotate wireframes so the developer and tester get content priority, tab order, and ARIA without guessing. Apply these conventions consistently across every wireframe.

## What every wireframe carries

1. **Content priority** — number blocks 1, 2, 3… in the order they matter to the user. This drives what stacks first on mobile and what must never be hidden.
2. **Tab order** — circled numbers ⓵ ⓶ ⓷ on each focusable element, following logical reading order (see `references/accessibility-keyboard.md`).
3. **Headings** — label each heading with its level (H1, H2…). One H1 per page, no skipped levels.
4. **Landmarks** — mark regions: header / nav / main / aside / footer.
5. **Accessible names** — where a control's visible label isn't obvious, note the accessible name (must contain the visible text — SC 2.5.3).
6. **ARIA** — only where native HTML can't do the job; note role/state/property and why.
7. **States** — note interactive states that aren't visible in a static frame (focus, error, loading, empty).
8. **Responsive behaviour** — note what reflows, stacks, or changes between breakpoints. Confirm nothing essential is hidden on mobile.
9. **SC references** — tag annotations with the WCAG 2.2 SC they address.

## Annotation key (use consistently)

| Marker | Meaning |
|---|---|
| `[1]` `[2]` | Content priority order |
| ⓵ ⓶ | Tab/focus order |
| `H1` `H2` | Heading level |
| `‹nav›` | Landmark region |
| `AN:` | Accessible name |
| `ARIA:` | ARIA role/state/property + reason |
| `ST:` | Non-visible state note |
| `RWD:` | Responsive behaviour note |
| `SC:` | WCAG 2.2 success criterion |

## Example annotation (a search block)

```
‹main›
[1] H1: "Report a problem"            SC: 1.3.1, 2.4.6
[2] Label "What's the problem?"  ⓵
    Text input  AN: "What's the problem?"  SC: 1.3.5, 3.3.2
    ST: error → message below, aria-describedby, aria-invalid, focus to summary  SC: 3.3.1
[3] Button "Find my service"  ⓶  AN matches visible text  SC: 2.5.3
    RWD: full-width on mobile, inline on ≥768px
```

## Annotate both desktop and mobile

Mobile-first: produce the mobile frame first and annotate it fully, then the desktop frame noting only what changes. Confirm the mobile frame at 320px reflows to one column with no horizontal scroll (SC 1.4.10).
