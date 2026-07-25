---
name: accessibility
description: Invoke BEFORE calling any UI done — labels, contrast, keyboard, focus, semantics, and motion. Accessibility is a release gate (zero critical issues), not a polish pass. If it can't be used by keyboard and screen reader, it isn't finished.
---

# accessibility — a gate, not a garnish

The one core truth: **an interface that excludes people isn't "mostly done" — it's broken for those people.** Accessibility is measurable, mostly mechanical, and cheapest when built in. Treat **WCAG 2.2 AA** as the bar and zero critical issues as a release gate, the same way [[regression-testing]] gates behaviour.

This pairs with [[design-system]] (accessible components built once) and [[forms-and-input]] (the highest-risk surface). Build it into the tokens and components and most screens inherit it.

## The four principles (POUR)

| Principle | Means |
|---|---|
| **Perceivable** | Text alternatives for images; captions/transcripts for media; sufficient contrast; never colour as the *only* signal. |
| **Operable** | Everything works by keyboard; visible focus; no keyboard traps; enough time; nothing that flashes dangerously. |
| **Understandable** | Clear labels, predictable behaviour, helpful error messages, consistent navigation. |
| **Robust** | Valid semantic markup so assistive tech can parse it; correct roles/names/states. |

## Law 1 — Semantics first

- Use the **right native element** — a button is a button, a link navigates, a list is a list. A clickable `div` is a bug. Native elements bring keyboard + role + state for free.
- **One main heading per page**, then a logical heading order with no skipped levels.
- **Landmarks** — header / nav / main / footer — so a screen-reader user can jump.
- Reach for ARIA only when native won't do it, and then get role + name + state right (wrong ARIA is worse than none).

## Law 2 — Everything works by keyboard

- Tab order follows reading order; **focus is always visible** (never `outline:none` with no replacement).
- Every interactive control is reachable and operable with keys alone; menus/modals/dialogs trap focus *while open* and restore it on close.
- No action requires a hover or a mouse-only gesture.

## Law 3 — Perceivable content

- **Contrast**: ≥ 4.5:1 for normal text, ≥ 3:1 for large text and meaningful UI/graphics. Verify, don't eyeball.
- **Images**: meaningful ones get descriptive `alt`; decorative ones get empty `alt` so they're skipped.
- **Don't rely on colour alone** — pair it with text, icon, or pattern (error states, status, charts).
- **Resize & reflow**: text scales to **200%** (1.4.4) and content **reflows to a 320px width** (1.4.10) with no loss of content/function and no horizontal scroll. *There is no minimum font size in WCAG — this is the real requirement.*
- Respect **reduced-motion** preferences; no essential information conveyed only by animation.

## Law 4 — Names, labels, and errors

- Every input has a **programmatic label** (not just a placeholder). Icon-only buttons get an accessible name.
- Errors are **announced, specific, and tied to the field** — "Enter a valid email", next to the input, not a generic banner. Detail in [[forms-and-input]].
- Status changes (saved, loading, error) are announced to assistive tech, not just shown.

## New in WCAG 2.2 — the six AA criteria added in 2023

AA and current; a build targeting "AA" in 2026 must meet these, not just the 2.1 set above.

- **2.4.11 Focus Not Obscured** — a focused control is never fully hidden behind a sticky header/footer or an overlay. Test by tabbing with sticky elements present.
- **2.5.7 Dragging Movements** — any drag action (reorder, slider, map pan) has a single-pointer alternative (tap/click).
- **2.5.8 Target Size (Minimum)** — interactive targets are **≥ 24×24 CSS px**, or have ≥ 24px spacing between them. *(Aim ≥ 44px for primary controls — comfortably clears the floor.)*
- **3.2.6 Consistent Help** — help/contact routes appear in a consistent place across pages.
- **3.3.7 Redundant Entry** — don't re-ask for information already provided earlier in the same process; auto-populate or let the user pick it.
- **3.3.8 Accessible Authentication** — no cognitive-function test (memorising, transcribing, puzzle-solving) is required to log in; allow paste, password managers, and OAuth. *(Admin Google sign-in passes this; any future password flow must too.)*

Four of these — 2.4.11, 2.5.7, 3.2.6, 3.3.7 — are largely **behavioural**, proven by a manual pass, not a static check.

## Stand this up in a new project

- Bake a11y into the **design system**: accessible components (focus, labels, contrast tokens) built once, reused everywhere ([[design-system]]).
- Run the **accessibility-auditor** agent on every UI diff — the read-only static pass that names each barrier with its fix, and declares what only a manual pass can prove.
- Add an **automated a11y check** to CI/preflight (catches contrast, missing labels, bad roles) — necessary but not sufficient.
- A **manual pass** per release: tab through it, run a screen reader on the key flows, zoom to 200%. What the auditor marks UNVERIFIED, this pass proves.
- Make "zero critical a11y issues" part of the definition of done ([[regression-testing]], [[reviewing-code]]) — it's a named row in the domain must-pass catalogue.

## Cross-links
- [[design-system]] — accessible components and contrast-checked tokens, built once.
- [[forms-and-input]] — labels, error association, and announcements (the riskiest surface).
- [[responsive-design]] — target sizes, zoom/reflow, and orientation that a11y also requires.
- [[regression-testing]] — a11y as a release gate, automated + manual.
