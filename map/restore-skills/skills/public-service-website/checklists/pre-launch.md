# Checklist — Pre-Launch

Before the site goes live. This is the last gate. Launch readiness is tied to the tester's report (`references/handoff-to-tester.md`): no Critical or Major accessibility issues open.

## Accessibility sign-off
- [ ] Automated scan (axe/WAVE/Lighthouse) run — no outstanding errors.
- [ ] Manual keyboard test passed on every core journey. (`references/accessibility-keyboard.md`)
- [ ] Screen reader test passed — desktop (NVDA/VoiceOver) + mobile (TalkBack/VoiceOver). (`references/accessibility-speech.md`)
- [ ] Contrast verified across the real palette and states.
- [ ] All WCAG 2.2 AA criteria met, or any gaps documented in the accessibility statement.
- [ ] No Critical or Major accessibility issues open in the tester's report.

## Functional
- [ ] Every core journey completes end to end on real devices.
- [ ] Forms submit, validate, and confirm correctly; reference numbers issued.
- [ ] Core journeys work with JavaScript disabled.
- [ ] 404 and error pages are helpful and on-brand.
- [ ] Search returns sensible results.

## Responsive & performance
- [ ] Tested on real low-end Android + iOS, throttled mobile data.
- [ ] Reflow at 320px, no horizontal scroll, nothing essential hidden.
- [ ] Page weight within budget; images optimised; fonts subset/self-hosted.
- [ ] Lighthouse performance acceptable on mobile.

## Content
- [ ] All copy final, proofed, plain English; no lorem ipsum or placeholder.
- [ ] Links work (no 404s); link and button text meaningful.
- [ ] Alt text present and meaningful; decorative images empty alt.

## Compliance
- [ ] Accessibility statement published, accurate, on the correct template (PSBAR), with reporting route and review date.
- [ ] Privacy notice published and linked from data-collection points (UK GDPR).
- [ ] Cookie consent: genuine reject, accessible, doesn't trap or obscure focus (PECR).
- [ ] Imprint present on every page with confirmed wording (campaign sites).
- [ ] Check project profile for any project-specific launch items.

## Operational
- [ ] Analytics consented and configured.
- [ ] A way for users to report accessibility problems is live and monitored.
- [ ] Post-launch metrics to watch agreed (completion, drop-out, contact volume).
- [ ] Plan and owner for fixing issues found after launch.
