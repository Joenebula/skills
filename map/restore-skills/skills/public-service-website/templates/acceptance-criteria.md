# Template — Acceptance Criteria

Testable criteria for the tester. Each criterion is a single, observable pass/fail statement. No taste, no ambiguity.

## Format

Write each as something a tester can mark ✅ or ❌ without judgement calls:

> Given [context], when [action], then [observable result].

or as a plain checklist item where simpler:

> - [ ] [Observable, testable statement] — [SC or reference]

Good: "Submitting the form with an empty postcode shows an error summary at the top, moves focus to it, and links to the postcode field. (SC 3.3.1)"

Bad: "The form handles errors nicely." (not testable)

## Standard criteria to include on most screens

### Functional
- [ ] The core journey completes and produces the expected outcome / reference.
- [ ] All links and buttons go where their label says.

### Accessibility (WCAG 2.2 AA)
- [ ] Operable by keyboard alone, end to end. (SC 2.1.1)
- [ ] Tab order is logical and matches reading order. (SC 2.4.3)
- [ ] Focus is always visible and meets the appearance bar. (SC 2.4.7, 2.4.13)
- [ ] Focus is never fully hidden by sticky content. (SC 2.4.11)
- [ ] Headings: one H1, no skipped levels. (SC 1.3.1)
- [ ] Landmarks present and distinct. (SC 1.3.1)
- [ ] Every control has an accessible name containing its visible label. (SC 2.5.3)
- [ ] Text contrast ≥4.5:1; UI/boundary contrast ≥3:1. (SC 1.4.3, 1.4.11)
- [ ] No information conveyed by colour alone. (SC 1.4.1)
- [ ] Interactive targets ≥24×24px. (SC 2.5.8)
- [ ] Reflows to one column at 320px, no horizontal scroll. (SC 1.4.10)
- [ ] Form errors: summary, focus move, inline association, plain wording. (SC 3.3.1, 3.3.2)
- [ ] No information requested twice in one process. (SC 3.3.7)
- [ ] Login allows paste / password managers; no cognitive puzzle. (SC 3.3.8)
- [ ] Help appears in a consistent location. (SC 3.2.6)
- [ ] Animation respects prefers-reduced-motion. (SC 2.3.3)
- [ ] Screen reader test passed (NVDA/VoiceOver + mobile). (see speech reference)

### Responsive & performance
- [ ] Mobile-first layout correct at all breakpoints.
- [ ] Total page weight under the budget (state the number).
- [ ] Core journey works with JavaScript disabled.
- [ ] Loads acceptably on a throttled connection / low-end device.

### Content & visual
- [ ] Final copy present (no lorem ipsum); reads at target reading age.
- [ ] Matches design tokens; no leftover Bootstrap defaults.

### Compliance (if applicable)
- [ ] Accessibility statement present and accurate. (PSBAR)
- [ ] Cookie banner offers genuine reject, accessible, doesn't trap focus.
- [ ] Imprint present on every page (campaign sites), wording confirmed.

## How to organise

Keep one acceptance-criteria list per component, per screen, and per journey. The screen/journey lists cover integration; the component lists cover the parts. The tester works through all three (see `references/handoff-to-tester.md`).
