# Template — Accessibility Annotation Conventions

Conventions for annotating designs with accessibility intent, so the developer builds it right and the tester can verify it. Use the same conventions on every artefact.

## What to annotate, always

For each screen or component, record:

1. **Heading structure** — the H1 and the heading outline. One H1, no skipped levels.
2. **Landmarks** — header / nav / main / aside / footer regions; distinct names where repeated.
3. **Tab order & focus order** — numbered, logical, matching reading order (SC 2.4.3).
4. **Visible focus** — the focus style; must meet SC 2.4.13 and never be suppressed.
5. **Focus not obscured** — note sticky elements and the `scroll-margin` mitigation (SC 2.4.11).
6. **Accessible names** — for every control; must contain visible label text (SC 2.5.3).
7. **Native element vs ARIA** — the native element expected; ARIA only where named, with reason.
8. **Form behaviour** — labels, fieldset/legend groupings, hints, required marking, error summary + focus move + inline association (SC 3.3.1, 3.3.2).
9. **Non-text content** — alt text intent for each image; decorative = empty alt.
10. **Colour independence** — confirm no information conveyed by colour alone (SC 1.4.1).
11. **Targets & reflow** — target sizes (SC 2.5.8), reflow to one column at 320px (SC 1.4.10).
12. **Motion** — any animation respects `prefers-reduced-motion` (SC 2.3.3).
13. **Dynamic announcements** — live regions for updates (politeness level).

## Annotation format

Tag each note with its SC so it's traceable to a standard and testable:

```
[control] — [intent] — SC: [criterion]
"Submit report" button — accessible name = visible label — SC: 2.5.3
Error summary — receives focus on submit-with-errors — SC: 3.3.1
Hero image — decorative, alt="" — SC: 1.1.1
Filter result count — aria-live="polite" — SC: 4.1.3
```

## Linking to the standard

Always name the SC (number and title) when annotating — e.g. "SC 2.4.7 Focus Visible". This lets the user verify against the WCAG spec, lets the developer self-check, and gives the tester a precise pass/fail target (see `references/handoff-to-tester.md`).

## Per-page accessibility summary

At the top of each annotated page, include a short summary block:

```
Page: [name]
H1: [text]
Heading outline: H1 > H2 (×3) > H3...
Landmarks: header, nav, main, footer
Core journey works keyboard-only: yes/no
Works without JS: yes/no
Known risks: [e.g. sticky footer + focus — mitigated with scroll-margin]
```
