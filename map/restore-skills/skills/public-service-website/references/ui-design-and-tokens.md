# UI Design & Design Tokens

Guidance for visual design, typography, colour, layout, components, and design tokens. Read this when working on the look and feel or producing a token set.

## Contents
- Design tone for public service
- Typography
- Colour
- Spacing and layout
- Components
- Design tokens
- Imagery

## Design tone for public service

The goal is calm, clear, and trustworthy — not exciting. Restraint signals competence. Concretely:

- Generous whitespace; let content breathe.
- One or two typefaces, a tight colour palette, a consistent spacing scale.
- No animation that doesn't serve comprehension. Respect `prefers-reduced-motion`.
- No decorative ornament that competes with content. "Documentary, not decorative" (core principle 6).

## Typography

- **Body text 16px minimum**, ideally 18–19px for primary reading. Never below 16px for body.
- **Line length 60–75 characters** for comfortable reading. Constrain measure with a max-width on text containers.
- **Line height 1.5** for body text (WCAG 2.2 SC 1.4.12 Text Spacing must not break the layout if users override it).
- A clear type scale with strong heading/body contrast. Use a modular scale (e.g. 1.25 ratio) so sizes feel related.
- System font stacks are a legitimate, fast, free choice for public service. If using a web font, subset it, self-host, and set `font-display: swap` to protect the performance budget.
- Real headings in the markup (`<h1>`–`<h6>`) in correct order — never skip levels for visual effect. Headings are how screen reader users navigate (see `references/accessibility-speech.md`).

## Colour

- Meet **WCAG 2.2 SC 1.4.3 Contrast (Minimum)**: 4.5:1 for normal text, 3:1 for large text (24px, or 19px bold) and for UI component boundaries and states (SC 1.4.11 Non-text Contrast).
- Never use colour as the only means of conveying information (SC 1.4.1 Use of Color). Pair colour with text, icon, or shape — e.g. an error is red *and* has an icon *and* says "Error".
- Keep a restrained palette: one brand/identity colour, one or two accents, a neutral greyscale, plus semantic colours for success/warning/error that themselves meet contrast.
- Design and test in both light and, where supported, dark contexts. Check focus indicators against every background they can appear on (SC 2.4.13 Focus Appearance).

## Spacing and layout

- Mobile-first. Design the smallest screen first; add complexity as space allows.
- Use a consistent spacing scale (e.g. 4px base: 4, 8, 12, 16, 24, 32, 48, 64). Tokenise it.
- **Target size**: interactive targets at least 24×24 CSS px (WCAG 2.2 SC 2.5.8 Target Size Minimum); aim for 44×44 as a comfortable default, especially primary actions on mobile.
- Ensure content reflows to a single column at 320px width without horizontal scrolling (SC 1.4.10 Reflow).

## Components

Specify components with `templates/component-spec.md`. For each: purpose, anatomy, states (default/hover/focus/active/disabled/error), responsive behaviour, content rules, tab order, ARIA, and acceptance criteria. Prefer native HTML elements before reaching for ARIA (see accessibility-speech reference).

## Design tokens

Use `templates/design-tokens-starter.md`. Tokens are named design decisions (colour, type, spacing, radius, shadow) that map cleanly to Bootstrap 5 Sass variables — see `references/bootstrap-foundation.md`. Tokens are the contract between design and build: the developer themes Bootstrap by overriding Sass variables from your token values, so name and structure them to map directly.

Token layers:
1. **Primitive** — raw values (`color-blue-600: #1d4ed8`).
2. **Semantic** — role-based aliases (`color-action-primary: {color-blue-600}`).
3. **Component** — component-specific (`button-primary-bg: {color-action-primary}`).

Design and hand off in semantic terms so the build stays maintainable.

## Imagery

- Real photography of real people and places served. No stock imagery (core principle 6) — it reads as inauthentic and erodes trust in a civic context.
- Every meaningful image needs alt text; decorative images get empty alt (`alt=""`). See content-design and accessibility-speech references.
- Optimise hard: correctly sized, modern formats (WebP/AVIF), lazy-loaded below the fold, to protect the <1MB page weight budget.
- Don't put essential text in images (SC 1.4.5 Images of Text) — real text scales, translates, and reads aloud.
