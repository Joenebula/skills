# Checklist — Pre-Launch (whole site)

Run before the migrated site ships.

## Consistency across pages
- [ ] Header, nav, footer identical on every page (single source).
- [ ] Theme consistent everywhere; no page still looks like default Bootstrap.
- [ ] Spacing, type scale, and component styling consistent site-wide.
- [ ] Every page passed `checklists/per-page.md`.

## Links & structure
- [ ] Every internal link resolves; no dead links or orphan pages.
- [ ] All asset paths (css/js/img/fonts) resolve on every page.
- [ ] Folder structure final; README documents structure and any build step.
- [ ] If pages were renamed/moved, old→new mapping recorded (and redirects if hosted).

## Responsiveness
- [ ] Tested on real mobile + desktop; all breakpoints reflow cleanly.
- [ ] 320px width and 400% zoom: no content loss, no horizontal scroll.

## JavaScript
- [ ] No inline handlers remain anywhere.
- [ ] Shared script runs cleanly on every page (no console errors from missing elements).
- [ ] Core navigation and key journeys work with JS disabled.
- [ ] Only the Bootstrap JS plugins actually used are loaded.

## Accessibility (WCAG 2.2 AA)
- [ ] Keyboard-only pass through every core journey (browse → product → cart → checkout).
- [ ] Screen reader pass: desktop (NVDA/VoiceOver) + mobile (TalkBack/VoiceOver).
- [ ] Automated scan (axe/Lighthouse) clean of errors.
- [ ] Contrast verified across the real palette and states.
- [ ] No Critical/Major accessibility issues open.

## E-commerce
- [ ] Cart persists and updates correctly; totals announced.
- [ ] Checkout completes end to end; redundant entry avoided; autocomplete set.
- [ ] No dark patterns; shipping/tax shown before final step.

## Compliance (regulated product)
- [ ] Age gate genuine and accessible; blocks content; persists sensibly.
- [ ] 18+ stated at checkout and in T&Cs; age-restricted items flagged; delivery verification expectation set.
- [ ] Marketing content complies with CAP/ASA; responsible-drinking link present.
- [ ] Company info, terms of sale, returns, privacy notice, cookie consent all present, findable, accessible.
- [ ] Footer responsibility/age notice on every page.

## Performance
- [ ] Page weight reasonable; images sized and modern-format; fonts swap.
- [ ] Lighthouse performance acceptable on mobile.

## Handover
- [ ] README updated (structure, build, how to run).
- [ ] Audit findings + "could be better" suggestions delivered.
- [ ] Outstanding items / future suggestions listed for the owner.
