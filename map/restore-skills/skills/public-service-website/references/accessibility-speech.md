# Accessibility — Speech (Screen Readers & Voice Control)

Screen reader behaviour, ARIA, voice control, and accessible naming. Read this when annotating accessible names, deciding on ARIA, or specifying announcements.

## Contents
- Two different speech technologies
- Semantic HTML first
- The first rule of ARIA
- Accessible names
- Landmarks and headings
- Images and alt text
- Forms and errors
- Live regions and announcements
- Voice control specifics
- Screen reader testing checklist

## Two different speech technologies

- **Screen readers** (VoiceOver, NVDA, JAWS, TalkBack) read the interface aloud. Users navigate by headings, landmarks, links, and form controls. They need correct *names, roles, and values*.
- **Voice control** (Dragon, Voice Control, Voice Access) lets users operate the interface by speaking labels aloud ("click Submit"). It depends on the *visible label matching the accessible name*.

Both are served by good semantic HTML and accurate accessible names.

## Semantic HTML first

Use the right native element for the job: `<button>` for actions, `<a href>` for navigation, `<nav>`, `<main>`, `<header>`, `<footer>`, real form controls with `<label>`, real headings, real lists. Native elements come with correct role, keyboard behaviour, and naming for free.

## The first rule of ARIA

The first rule of ARIA is: don't use ARIA if a native element will do. Bad ARIA is worse than no ARIA. Reach for ARIA only to fill genuine gaps native HTML can't (e.g. `aria-expanded` on a custom disclosure, `aria-live` on a dynamic region). When you do use it, specify role, states, and properties explicitly in the component spec.

## Accessible names

- Every interactive control needs an accessible name. Prefer a visible `<label>` (forms) or visible text content (buttons, links).
- **SC 2.5.3 Label in Name**: the accessible name must contain the visible label text — critical for voice control. If a button shows "Send message", its accessible name must include "Send message", not be overridden to "Submit" via aria-label.
- Avoid `aria-label` where visible text exists; if you must, keep the visible words inside it.
- Don't rely on placeholder text as a label — it disappears on input and often fails contrast.
- Make link text meaningful out of context — "Read the housing policy", not "click here" / "read more" (SC 2.4.4 Link Purpose).

## Landmarks and headings

- One `<h1>` per page describing the page. Headings then nest in order (`h2` under `h1`, etc.) without skipping levels — screen reader users jump by heading.
- Use landmark elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) so users can jump between regions. One `<main>` per page.
- If there are multiple navs or regions of the same type, give them distinct accessible names (`aria-label`).

## Images and alt text

- Informative images: concise alt text conveying purpose/meaning, not a literal description of pixels.
- Decorative images: empty alt (`alt=""`) so screen readers skip them.
- Complex images (charts, maps): short alt plus a longer description nearby in text.
- Don't start alt with "image of" — the screen reader already announces it's an image.

## Forms and errors

- Every field has a programmatically associated `<label>`.
- Group related fields with `<fieldset>` and `<legend>` (e.g. a date split into day/month/year, or radio groups).
- Mark required fields in text, not colour alone; describe the format expected before the user types.
- On error: show an error summary at the top linking to each field, set focus to it, associate each inline error message with its field (`aria-describedby`), and use `aria-invalid`. Announce that errors occurred.
- Honour **SC 3.3.7 Redundant Entry** (don't ask twice) and **SC 3.3.8 Accessible Authentication** (allow paste/password managers, no cognitive puzzles).

## Live regions and announcements

- Use `aria-live="polite"` for non-urgent updates (a filter result count, a saved confirmation) and `assertive` only for genuinely urgent messages.
- Toasts/notifications must be in a live region or they go unannounced.
- Don't overuse live regions — constant chatter is as bad as silence.

## Voice control specifics

- Visible label = accessible name (see Label in Name above) so "click X" works.
- Targets must be big enough to select reliably (SC 2.5.8 Target Size).
- Don't hide the real control behind a custom one the user can't name.

## Screen reader testing checklist

Hand to the tester (see `references/handoff-to-tester.md`):

1. Navigate by headings — do they describe the page and nest logically?
2. Navigate by landmarks — can you jump to nav, main, footer?
3. Are all images sensibly described or correctly skipped?
4. Are all controls announced with a clear name and role?
5. Do form labels, required state, format hints, and errors all read correctly?
6. Do dynamic updates get announced (and not too much)?
7. Test on at least one desktop SR (NVDA or VoiceOver) and one mobile (TalkBack or VoiceOver).
