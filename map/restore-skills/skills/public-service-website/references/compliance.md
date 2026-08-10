# UK Compliance

PSBAR, the Equality Act, GDPR, political imprints, and cookies. Read this when the project has UK legal obligations. This is practical guidance, not legal advice — confirm specifics with a qualified person where stakes are high.

## Contents
- PSBAR (public sector accessibility)
- The accessibility statement
- The Equality Act 2010
- UK GDPR and data protection
- Cookies and PECR
- Political imprints (campaigning sites)
- Quick compliance map

## PSBAR (public sector accessibility)

The Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018 (PSBAR) require public sector websites and apps to meet **WCAG 2.2 AA**. WCAG 2.2 replaced 2.1 as the PSBAR assessment standard on **1 October 2024**. Compliance is monitored and enforced by the Government Digital Service (GDS), with published reports.

Who it covers: central government, local authorities (councils), the NHS and healthcare providers, schools and universities, and many publicly funded bodies. If the project is for, or on behalf of, such a body, PSBAR applies.

What it requires:
1. Meet WCAG 2.2 AA (there may be valid legal reasons for limited exceptions — the "disproportionate burden" provision is narrow and must be justified and documented).
2. Publish and maintain an accessibility statement.

## The accessibility statement

A legally required document under PSBAR with a prescribed UK template. It must include:
- How accessible the site is (fully / partially / not compliant).
- Known accessibility problems and which WCAG criteria they fail.
- How users can report problems and request content in an alternative format.
- The enforcement procedure (the route to escalate — in England/Wales/Scotland the EHRC; in NI the ECNI).
- The date prepared and last reviewed, and how the site was tested.

Treat the statement as part of the deliverable, not an afterthought. Keep it honest and current — overclaiming compliance is itself a failure.

## The Equality Act 2010

Applies to public and private bodies alike. Requires reasonable adjustments so disabled people are not disadvantaged. Conforming to WCAG 2.2 AA, documenting decisions, and offering alternative formats on request is the practical way to demonstrate this for a website. Even non-PSBAR projects (charities, campaigns) carry Equality Act duties — so the accessibility floor in this skill applies regardless.

## UK GDPR and data protection

For any form or feature that collects personal data:
- **Lawful basis** — know and state why you're collecting each piece of data.
- **Data minimisation** — collect only what the task needs (this also serves SC 3.3.7 Redundant Entry).
- **Clear, specific consent** where consent is the basis — no pre-ticked boxes, granular options, as easy to withdraw as to give.
- **Privacy notice** — plain-English, linked from every data-collection point.
- **No dark patterns** — consent and choices must be honest and unmanipulated (core principle 4).

## Cookies and PECR

Under PECR, non-essential cookies (analytics, marketing) need prior consent:
- A consent banner that does not pre-consent and offers a genuine "reject" as prominent as "accept".
- Essential/strictly necessary cookies don't need consent but should be listed.
- The banner must not obscure the focused element (SC 2.4.11) or trap keyboard focus — a common accessibility failure of cookie banners.

## Political imprints (campaigning sites)

Election and campaign material in the UK must carry an imprint identifying who is responsible for it (who promoted it and on whose behalf, with an address). Digital imprint rules apply to online campaign material. For a party/candidate/campaign site:
- Include a clear imprint, typically in the footer, present on every page.
- Get the exact wording confirmed by the campaign's responsible person / agent — requirements differ for parties, candidates, and registered campaigners, and around regulated periods.
- This is project-specific; check the loaded profile (e.g. `profiles/nottingham-labour.md`) for the agreed wording.

## Quick compliance map

| Concern | Trigger | Obligation |
|---|---|---|
| PSBAR | Public sector body | WCAG 2.2 AA + accessibility statement |
| Equality Act | Any body, esp. services | Reasonable adjustments; alt formats |
| UK GDPR | Collecting personal data | Lawful basis, minimisation, privacy notice, honest consent |
| PECR / cookies | Non-essential cookies | Prior consent, genuine reject, accessible banner |
| Imprint | Campaign/election material | Imprint on every page; wording confirmed by agent |
