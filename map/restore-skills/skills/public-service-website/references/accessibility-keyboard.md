# Accessibility — Keyboard

Tab order, focus management, skip links, and keyboard testing. Read this when annotating focus order or specifying interactive behaviour.

## Contents
- The principle
- Tab order and focus order
- Visible focus
- Focus not obscured
- Skip links
- Focus management in dynamic UI
- No keyboard traps
- Keyboard testing checklist

## The principle

Everything operable by mouse must be operable by keyboard alone (WCAG 2.2 SC 2.1.1 Keyboard). Many users navigate only by keyboard: people with motor impairments, screen reader users, people using switch devices or voice control. If it can't be reached and operated with Tab, Shift+Tab, Enter, Space, and arrow keys, it's broken.

## Tab order and focus order

- Tab order must follow a logical, predictable sequence that matches the visual and reading order (SC 2.4.3 Focus Order).
- Rely on DOM order to drive tab order. Avoid positive `tabindex` values (`tabindex="1"` etc.) — they create brittle, surprising orders.
- Use `tabindex="0"` to make a custom interactive element focusable, and `tabindex="-1"` to make an element programmatically focusable (for moving focus) without putting it in the tab sequence.
- Annotate the intended tab order on every wireframe with numbered markers (see `templates/wireframe-annotation-guide.md`).

## Visible focus

- Every focusable element must have a clearly visible focus indicator (SC 2.4.7 Focus Visible).
- WCAG 2.2 raises the bar with **SC 2.4.13 Focus Appearance**: the indicator must be large enough (at least as large as a 2px-thick perimeter of the component) and have at least 3:1 contrast against adjacent colours.
- Never remove outlines without replacing them (`outline: none` with no substitute is a failure). Provide a strong custom `:focus-visible` style.
- Test the focus style against every background it can land on.

## Focus not obscured

- **SC 2.4.11 Focus Not Obscured (Minimum)**: when an element receives focus it must not be entirely hidden by author content. Sticky headers, sticky footers, and cookie banners are the usual culprits.
- Mitigate with `scroll-margin-top` on focusable elements equal to the sticky header height, so scrolling-to-focus doesn't tuck the element under the header.

## Skip links

- Provide a "Skip to main content" link as the first focusable element on the page (SC 2.4.1 Bypass Blocks).
- It may be visually hidden until focused, but it must become visible on focus.
- The target (`<main>` or the main content container) should receive focus when activated.

## Focus management in dynamic UI

- When opening a modal/dialog, move focus into it, trap focus within it while open, and return focus to the triggering element on close.
- When content is revealed (accordion, "show more"), focus order must remain logical.
- When a route changes in a single-page app, move focus to the new page's heading and update the page title.
- After form submission errors, move focus to the error summary at the top of the form.

## No keyboard traps

- A keyboard user must be able to move focus away from any component using standard keys (SC 2.1.2 No Keyboard Trap). The only acceptable "trap" is an intentional modal focus loop that releases on close/Escape.

## Keyboard testing checklist

Hand this to the tester (see `references/handoff-to-tester.md`):

1. Unplug the mouse. Complete every core journey with keyboard only.
2. Tab through the whole page — is the order logical and the focus always visible?
3. Is the skip link the first thing focused, and does it work?
4. Can every control be activated with Enter/Space as expected?
5. Do menus, accordions, and custom widgets respond to arrow keys where expected?
6. Open and close every modal/dropdown — does focus move in and return correctly?
7. Is focus ever hidden behind a sticky element?
8. Can you always escape — no traps?
