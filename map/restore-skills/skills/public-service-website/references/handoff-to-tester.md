# Handoff to Tester

What the tester receives so they can produce a meaningful testing report. Read this when preparing a tester handoff or testing report structure.

## Contents
- The principle
- The testing package
- What to test against
- Test types and how to run them
- Reporting format
- Severity ratings

## The principle

The tester checks the build against the design intent and the standards — not against their own taste. So the handoff must give them something objective to test against: acceptance criteria and named success criteria. "It looks a bit off" is not a testable report; "Focus indicator on the primary button is 1.8:1 against the background, failing SC 2.4.13" is.

## The testing package

The tester receives:

1. **Acceptance criteria** for each screen, component, and journey (`templates/acceptance-criteria.md`).
2. **The annotated designs** so they can compare build to intent (tab order, focus order, ARIA, content priority).
3. **The user journeys** so they test whole tasks, not just pages.
4. **The list of relevant WCAG 2.2 success criteria** with the keyboard and screen reader checklists from the accessibility references.
5. **The performance budget and no-JS requirement** as pass/fail targets.
6. **Target browsers, devices, and assistive tech** to cover.

## What to test against

- **Functional** — does each journey complete and produce the expected outcome?
- **Accessibility** — WCAG 2.2 AA, using the checklists in `accessibility-keyboard.md` and `accessibility-speech.md`.
- **Responsive** — mobile-first behaviour, reflow at 320px (SC 1.4.10), no horizontal scroll, targets ≥24px (SC 2.5.8).
- **Performance** — page weight under budget, works on a throttled connection and a low-end device.
- **No-JS** — core journeys complete with JavaScript disabled.
- **Content** — copy matches the approved content, no lorem ipsum, links and buttons read meaningfully.
- **Visual** — matches tokens; no leftover Bootstrap defaults.

## Test types and how to run them

- **Manual keyboard test** — mouse unplugged, run the keyboard checklist.
- **Screen reader test** — at least one desktop SR (NVDA/VoiceOver) and one mobile (TalkBack/VoiceOver), run the SR checklist.
- **Automated scan** — axe / WAVE / Lighthouse to catch low-hanging issues. Automated tools find perhaps a third of issues — never sufficient alone, but a useful first pass.
- **Manual contrast checks** — sample text and UI components against backgrounds.
- **Device testing** — real low-end Android over throttled mobile data, not just a desktop emulator.
- **Cognitive walk-through** — can a first-time, low-confidence user complete the top task without help?

## Reporting format

Each issue in the report should carry:

- **Where** — page/component and steps to reproduce.
- **What** — observed behaviour vs expected (the acceptance criterion or SC it violates).
- **Standard** — the specific WCAG 2.2 SC or acceptance criterion ID.
- **Severity** — see below.
- **Evidence** — screenshot, recording, or SR transcript.

## Severity ratings

- **Critical** — blocks a core journey or makes content inaccessible to a group of users (e.g. a form that can't be completed by keyboard). Must fix before launch.
- **Major** — significant barrier or failure of an AA criterion that doesn't fully block. Fix before launch.
- **Minor** — usability friction or AAA-level gap. Fix or schedule.
- **Note** — observation or enhancement suggestion.

Tie launch readiness to the `checklists/pre-launch.md` gate: no Critical or Major accessibility issues open.
