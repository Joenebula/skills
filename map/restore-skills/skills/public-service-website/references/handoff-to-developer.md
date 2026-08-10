# Handoff to Developer

What the developer receives so they can build the design correctly without guessing. Read this when preparing a developer handoff.

## Contents
- The principle
- The handoff package
- Per-screen handoff
- Per-component handoff
- Accessibility in the handoff
- Performance budget
- Things developers most often get wrong

## The principle

"The handoff is part of the design" (core principle 7). The developer should never have to guess intent. Anything left implicit will be decided by default — usually the Bootstrap default, which is what we're trying to avoid. Spell out the decisions.

## The handoff package

A complete package contains:

1. **Design tokens** — colour, type, spacing, radius, shadow, in the format from `templates/design-tokens-starter.md`, mapped to Bootstrap Sass variables (see `references/bootstrap-foundation.md`).
2. **Annotated screens** — desktop and mobile, with content priority, tab order, focus order, and ARIA notes (see `templates/wireframe-annotation-guide.md` and `templates/accessibility-annotation.md`).
3. **Component specs** — one per component, including states and acceptance criteria (`templates/component-spec.md`).
4. **User journeys** — so the developer understands the end-to-end task, not just isolated screens (`templates/user-journey.md`).
5. **Content** — final or near-final copy, not lorem ipsum. Wording is a design decision (see `references/content-design.md`).
6. **The performance budget and no-JS requirement** stated explicitly.
7. **Acceptance criteria** the build will be checked against (`templates/acceptance-criteria.md`).

## Per-screen handoff

For each screen specify: layout at each breakpoint (mobile-first), the spacing/grid, which tokens apply where, content priority (what reflows/stacks/hides at small sizes — and confirm nothing essential hides), interactive states, and the tab/focus order.

## Per-component handoff

Use the component spec template. The developer needs: anatomy, every state, responsive behaviour, the exact tokens, the semantic HTML expected, ARIA (only where needed), keyboard behaviour, and acceptance criteria.

## Accessibility in the handoff

Accessibility is specified, not left to the developer's discretion. For each screen/component the handoff states:

- Heading structure and landmark regions.
- Tab order and focus order (numbered).
- Visible focus style (meeting SC 2.4.13) and that outlines must not be suppressed.
- Accessible names for every control (matching visible labels — SC 2.5.3).
- Native HTML element expected; ARIA only where named.
- Error handling: summary, focus move, inline association.
- Target sizes (SC 2.5.8), focus-not-obscured handling (SC 2.4.11, scroll-margin), reflow at 320px (SC 1.4.10).
- The specific SCs each note addresses, so the developer can self-check.

## Performance budget

State it as a hard number the build is checked against: e.g. <1MB total page weight, core journeys functional without JavaScript, web fonts subset and self-hosted with `font-display: swap`, images sized and in modern formats, only the needed Bootstrap Sass partials imported.

## Things developers most often get wrong

Flag these proactively in the handoff:

- Leaving Bootstrap defaults visible (blue primary, default radius/shadows/navbar).
- Suppressing focus outlines.
- Using `<div onclick>` instead of `<button>`.
- Placeholder-as-label.
- Skipping heading levels for visual sizing.
- Colour-only error/success states.
- Modal focus not trapped or not returned.
- Shipping the entire Bootstrap bundle.
