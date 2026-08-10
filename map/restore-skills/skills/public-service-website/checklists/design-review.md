# Checklist — Design Review

Run on a finished design before handoff. This is the craft-quality and inclusion gate.

## User need & content
- [ ] Does the page clearly answer "what is the user trying to do here?"
- [ ] Is the primary action obvious and prioritised?
- [ ] Is the copy plain English at the target reading age? (`references/content-design.md`)
- [ ] Do button and link labels describe the action/outcome (not "Submit", "click here")?
- [ ] Final content in place — no lorem ipsum?

## Visual quality (Bootstrap made invisible)
- [ ] No default Bootstrap look — blue primary, default radius/shadows/navbar all overridden?
- [ ] Consistent with the design tokens?
- [ ] Type: body ≥16px, line length 60–75 chars, line height 1.5?
- [ ] Generous whitespace; calm, uncluttered, trustworthy tone?
- [ ] Real photography, not stock? No decorative ornament competing with content?

## Accessibility
- [ ] Contrast: text ≥4.5:1, large text/UI ≥3:1 — checked, not eyeballed? (SC 1.4.3, 1.4.11)
- [ ] No information by colour alone? (SC 1.4.1)
- [ ] Heading structure: one H1, logical, no skips? (SC 1.3.1)
- [ ] Focus style designed, strong, meets appearance bar? (SC 2.4.13)
- [ ] Tab/focus order annotated and logical? (SC 2.4.3)
- [ ] Targets ≥24px, primary actions comfortable? (SC 2.5.8)
- [ ] Forms: labels, grouping, hints, error pattern designed? (SC 3.3.1–3.3.2)
- [ ] Accessible names match visible labels? (SC 2.5.3)
- [ ] Annotations complete per `templates/accessibility-annotation.md`?

## Responsive
- [ ] Designed mobile-first?
- [ ] Reflows to one column at 320px, no horizontal scroll? (SC 1.4.10)
- [ ] Nothing essential hidden on small screens?
- [ ] Sticky elements won't obscure focus (mitigation noted)? (SC 2.4.11)

## Trust & ethics
- [ ] No dark patterns, false urgency, hidden costs or commitments?
- [ ] Consent and choices honest and clear? (core principle 4)

## Performance
- [ ] Image weights and formats within budget?
- [ ] Web fonts subset/self-hosted, or system stack?
- [ ] Core journey designed to work without JavaScript?

## Handoff readiness
- [ ] Tokens, annotations, component specs, journeys, content all assembled? (`references/handoff-to-developer.md`)
