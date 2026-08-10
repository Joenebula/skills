# Checklist — Pre-Handoff

Final check before the developer receives the work. The test: could a developer build this correctly without asking you anything? (`references/handoff-to-developer.md`)

## The package is complete
- [ ] Design tokens, mapped to Bootstrap Sass variables. (`templates/design-tokens-starter.md`)
- [ ] Annotated screens — mobile and desktop.
- [ ] Component specs — one per component, with states and acceptance criteria. (`templates/component-spec.md`)
- [ ] User journeys for the relevant tasks. (`templates/user-journey.md`)
- [ ] Final/near-final content — no lorem ipsum.
- [ ] Acceptance criteria for screens, components, journeys. (`templates/acceptance-criteria.md`)

## Decisions are explicit, not implied
- [ ] Layout at each breakpoint specified.
- [ ] Content priority / what stacks/hides on mobile specified.
- [ ] Every interactive state shown or described.
- [ ] Tab order and focus order numbered.
- [ ] Accessible names stated where non-obvious.
- [ ] Native element expected; ARIA only where named with reason.
- [ ] Error-handling behaviour spelled out.
- [ ] Focus style defined; "don't suppress outlines" stated.

## Standards are traceable
- [ ] Accessibility annotations tagged with WCAG 2.2 SCs.
- [ ] Keyboard and screen reader checklists included for the tester.

## Constraints stated as targets
- [ ] Performance budget as a number.
- [ ] No-JS requirement for core journeys.
- [ ] Target browsers, devices, assistive tech listed.

## Compliance items flagged
- [ ] PSBAR / accessibility statement need noted (if public sector).
- [ ] GDPR / privacy notice points noted (if data collected).
- [ ] Cookie banner requirements noted (if non-essential cookies).
- [ ] Imprint requirement and confirmed wording noted (if campaign site).

## Common developer pitfalls pre-flagged
- [ ] Bootstrap defaults to override, focus suppression, div-as-button, placeholder-as-label, skipped headings, colour-only states, modal focus, full-bundle shipping. (`references/handoff-to-developer.md`)
