# Regulated Products — Age Gates, Compliance & Sale Terms

Handling regulated products (alcohol especially, but also vapes, tobacco, knives, fireworks) on a commercial site. Read this when the site sells or markets age-restricted goods. Practical guidance, not legal advice — confirm specifics with a qualified person, since stakes are legal.

## Contents
- Why this matters
- The age gate done properly
- Accessibility of the age gate
- Age verification at point of sale and delivery
- Marketing rules (alcohol)
- Terms of sale and required statements
- Checklist

## Why this matters

Selling alcohol to under-18s in the UK is illegal, and the duty to take "all reasonable steps" to verify age sits with the retailer at the point of sale — not just the delivery driver. A front-door age gate is necessary but not sufficient on its own; it sets the tone and is expected, but real compliance also covers checkout and delivery. Getting this wrong is a criminal-offence risk, not a UX preference, so treat the age gate and sale terms as real requirements.

## The age gate done properly

A front-of-site age gate (the "are you 18+?" interstitial) is standard for alcohol brands. Make it genuine, not theatre:
- Ask for date of birth or a clear 18+ confirmation, not just a "Yes" the muscle-memory clicks through. A DOB entry is stronger than a single yes/no.
- Block content until passed; don't let users see the shop behind it.
- Persist the pass for the session (sessionStorage) or a sensible period, but don't make it permanent on a shared device.
- State the legal basis plainly ("It is illegal to sell alcohol to anyone under 18").
- Provide a real path for under-18s (a polite block + a link to responsibility info), not a dead end that invites retrying.
- Apply Challenge 25 framing where relevant — the principle that anyone who looks under 25 should expect an ID check (this lands at delivery, but the site can set the expectation).

The age gate is a deterrent and a statement of policy; the binding verification happens at sale/delivery (below).

## Accessibility of the age gate

Age gates are a notorious accessibility failure. Build it as an accessible modal dialog:
- `role="dialog"` (or use Bootstrap's modal), `aria-modal="true"`, labelled by its heading.
- Move focus into it on open; trap focus while open; it should be the only interactive content.
- Operable by keyboard alone; visible focus; real `<button>`s and labelled `<input>`s, not `<div onclick>`.
- Don't hide the focused element behind it; don't break for screen readers (announce it).
- Reflows and is usable at 320px and at 400% zoom.

## Age verification at point of sale and delivery

- State in checkout and T&Cs that the customer must be 18+ and that age will be verified.
- Plan for verification at delivery (ID on receipt, Challenge 25) — the site should make this expectation clear so it isn't a surprise.
- If alcohol can be mixed into a larger cart, make sure the age requirement isn't "invisible" — flag age-restricted items in the cart and at checkout.
- Note that physical ID is currently required at the doorstep; digital ID acceptance is changing, so keep wording general and current.

## Marketing rules (alcohol)

UK alcohol marketing is governed by the CAP Code and enforced by the ASA. Key principles to respect in site content:
- Don't target or appeal particularly to under-18s; models/imagery should be and clearly look over 25.
- Don't link alcohol to social success, sexual success, daring, or enhanced confidence; don't imply it's necessary to an occasion.
- Don't encourage excessive or irresponsible drinking; show drinking responsibly.
- Include responsible-drinking messaging (e.g. a Drinkaware-style link) where appropriate.
- Be honest about strength (ABV) without glamorising high strength.

## Terms of sale and required statements

For a UK consumer-facing shop, make these present and findable (usually footer + checkout):
- **18+ only** statement in the T&Cs: sales only to persons aged 18 or over.
- Clear **terms of sale**: who you are (company name, registration, address), price inclusive of tax, delivery terms, and the customer's cancellation/return rights under consumer law.
- **Privacy notice** and **cookie consent** (UK GDPR / PECR) — honest consent, genuine reject, accessible banner that doesn't trap or obscure focus.
- **No dark patterns** around age or consent — the confirmation must be a real choice.
- Responsible-drinking/age notice in the footer on every page.

## Checklist

- [ ] Age gate present, genuine (DOB or real confirmation), blocks content, persists sensibly.
- [ ] Age gate is an accessible, keyboard-operable, focus-managed dialog.
- [ ] 18+ requirement stated at checkout and in T&Cs.
- [ ] Age-restricted items flagged in cart/checkout; verification-at-delivery expectation set.
- [ ] Marketing content complies with CAP/ASA principles; responsible-drinking link present.
- [ ] Company info, terms of sale, returns, privacy, cookies all present and findable.
- [ ] Footer age/responsibility notice on every page.
