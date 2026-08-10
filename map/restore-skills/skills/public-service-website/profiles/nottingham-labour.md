# Profile — Nottingham Labour

Project-specific decisions for the Nottingham Labour ward/councillor campaigning site. These overlay the core skill. When a decision here conflicts with a core default, this profile wins (per SKILL.md working style).

> **Note:** items marked `[CONFIRM]` are placeholders to be agreed with the campaign's responsible person / agent before they're treated as settled. Don't invent specifics for these.

## What this site is

A campaigning and ward-representation site for Nottingham Labour councillors / candidates. Its job is to help residents: find their councillor and contact them, report local issues or get signposted, read what the councillors are doing, and (in regulated periods) learn about candidates and how to get involved.

This is a **campaigning site**, not a public sector body site — so PSBAR doesn't strictly bind it, but the Equality Act does, and the core accessibility floor (WCAG 2.2 AA) still applies as a matter of principle and good practice. See `references/compliance.md`.

## Top tasks (confirm against real demand)

1. Contact my councillor / find who represents my ward.
2. Report or raise a local issue (and get signposted to the council where appropriate).
3. See what the councillors are doing locally (news, casework themes, surgeries).
4. Find out about candidates / how to get involved (esp. around elections).
5. `[CONFIRM]` any others the campaign prioritises.

A clear distinction must be drawn between **council business** (signpost to the official council channels for statutory services like bin collections, council tax) and **campaigning/representation content**. Don't let the site imply it's an official council service.

## Compliance — campaign specifics

- **Political imprint:** required on **every page** (footer). Exact wording `[CONFIRM with agent]` — it differs for a party, a candidate, and a registered campaigner, and around regulated periods. Typical shape: "Promoted by [name] on behalf of [party/candidate], both at [address]." Confirm before launch; this is a legal requirement, not a design preference.
- **Data protection:** any contact form, casework form, or sign-up collects personal (often political-opinion) data — likely special-category under UK GDPR. Minimise, state lawful basis, clear privacy notice, honest consent, secure handling. `[CONFIRM]` how casework data is stored and who can access it.
- **No dark patterns:** especially around sign-ups, donations, and data capture (core principle 4). Consent to be contacted must be genuine and granular.
- **Cookies/analytics:** consent banner with a real reject, accessible, doesn't trap/obscure focus.

## Tone & content

- Local, plain, human, trustworthy. Reading age 9 (`references/content-design.md`).
- Lead with what residents can do, not party messaging.
- Real local photography of the ward and councillors — no stock (core principle 6).
- Clear, honest separation of "official council route" vs "your Labour councillors".

## Visual identity

- `[CONFIRM]` brand palette. Labour red is the obvious anchor, but **red text and red UI elements frequently fail contrast** — verify every pairing against SC 1.4.3 (4.5:1) and 1.4.11 (3:1), and set `$min-contrast-ratio: 4.5` in the Bootstrap theme (`references/bootstrap-foundation.md`). Use a darkened red for text/links where needed.
- `[CONFIRM]` logo/identity assets and any party brand guidelines that must be followed.
- Otherwise apply the core UI guidance and token structure (`references/ui-design-and-tokens.md`, `templates/design-tokens-starter.md`).

## Build

- Bootstrap 5, themed to disappear, per the core skill.
- Mobile-first and within the performance budget — residents will mostly arrive on phones.
- Core journeys (find councillor, contact, report) must work without JavaScript.

## Launch additions to the standard checklist

In addition to `checklists/pre-launch.md`:
- [ ] Imprint present on every page, wording confirmed by the agent.
- [ ] Casework/contact data handling confirmed and privacy notice live.
- [ ] Clear signposting to official council services where appropriate.
- [ ] `[CONFIRM]` any regulated-period requirements if launching near an election.
