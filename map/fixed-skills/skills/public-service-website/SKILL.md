---
name: public-service-website
description: Use this skill whenever the user is working on a public service, civic, political, council, charity, or campaigning website — UX research, information architecture, user journeys, wireframes, UI design, design tokens, component specs, accessibility annotations, content design, developer handoff, tester handoff. Trigger whenever the user mentions building, designing, scoping, reviewing, auditing or improving any website for a public audience where accessibility, plain English, inclusion and trust matter more than commercial conversion. Owns WCAG 2.2 compliance, keyboard accessibility, screen reader and voice control work, and design systems for civic projects. For the Bootstrap 5 mechanics of a civic rebuild — grid conversion, component system, folder structure, replacing jQuery — use bootstrap5-migration and keep this skill for the research, IA, content and accessibility layer.
---

# Public Service Website Skill

A skill for designing and scoping high-quality public service, civic, and campaigning websites. The user is the UX/UI lead and hands off to a developer and a tester. The skill exists to make that handoff clean, the output inclusive, and the design tone appropriate to public service work.

## Core principles (always apply)

These apply to every public service project regardless of profile.

1. **User needs first.** Every page answers "what is the user trying to do here?" Information architecture follows user mental models, not organisational structure.
2. **Accessibility is the brief, not the bolt-on.** WCAG 2.2 AA is the floor. Keyboard navigation and screen reader / voice control compatibility are first-class design concerns, annotated on every wireframe and design.
3. **Plain English at reading age 9.** Short sentences. Active voice. Common words. No jargon unless defined.
4. **Trust is earned through restraint.** No dark patterns. No manipulative urgency. No hidden costs or commitments. Honest tone, clear consent, visible compliance.
5. **Mobile-first, performance-budgeted.** Designed for the smallest screen and slowest connection first. Under 1MB page weight target. Works without JavaScript for core journeys.
6. **Documentary, not decorative.** Real photography of real people and places. No stock imagery. No ornamentation for its own sake.
7. **The handoff is part of the design.** Every artifact carries the information the next person needs — content priority, tab order, acceptance criteria, design tokens.

## When to consult which reference

Read the relevant reference file when working on these topics. Don't read all of them upfront — load what's needed for the current task.

| If the user is working on... | Read this reference |
|---|---|
| User research, journeys, IA, sitemaps, user needs | `references/ux-research-and-ia.md` |
| Visual design, typography, colour, layout, components, design tokens | `references/ui-design-and-tokens.md` |
| Bootstrap 5 theming, customisation, component decisions | `references/bootstrap-foundation.md` |
| General accessibility, WCAG 2.2, inclusive design beyond compliance | `references/accessibility-core.md` |
| Tab order, focus management, skip links, keyboard testing | `references/accessibility-keyboard.md` |
| Screen reader behaviour, ARIA, voice control, accessible naming | `references/accessibility-speech.md` |
| Plain English, voice, tone, readability | `references/content-design.md` |
| What to give the developer at handoff | `references/handoff-to-developer.md` |
| What to give the tester for testing reports | `references/handoff-to-tester.md` |
| UK legal: PSBAR, GDPR, political imprint, cookies | `references/compliance.md` |

## When to load a project profile

Profiles overlay project-specific decisions on top of the core skill. Load the profile when the user mentions the project by name or context.

| Profile | Load when |
|---|---|
| `profiles/nottingham-labour.md` | User mentions Nottingham Labour, the ward/councillor site, the campaigning site, or works on artefacts clearly belonging to that project |

## Templates available

When producing structured deliverables, start from these templates rather than from scratch:

- `templates/user-journey.md` — User journey map structure
- `templates/wireframe-annotation-guide.md` — How to annotate wireframes for content, tab order, ARIA
- `templates/component-spec.md` — Per-component spec including acceptance criteria
- `templates/design-tokens-starter.md` — Design tokens in a format that maps to Bootstrap Sass variables
- `templates/accessibility-annotation.md` — Conventions for annotating designs with accessibility intent
- `templates/acceptance-criteria.md` — Testable criteria format for the tester

## Checklists to run at key gates

- `checklists/pre-design.md` — Before starting design on a new page or component
- `checklists/design-review.md` — Reviewing a finished design before handoff
- `checklists/pre-handoff.md` — Final check before developer receives the work
- `checklists/pre-launch.md` — Before the site goes live

## Foundation framework: Bootstrap 5

This skill assumes Bootstrap 5 as the build foundation. The reasoning, the customisation strategy, and the component decisions are in `references/bootstrap-foundation.md`. Bootstrap is treated as scaffolding to be made invisible through a strong theme layer — not as the visible design. If a project specifically rejects Bootstrap, the rest of the skill still applies; only the framework reference changes.

## Working style

- When the user asks a broad design or scoping question, ask one or two clarifying questions before producing artefacts — never more than that in a single turn.
- When producing structured artefacts (journeys, specs, checklists), use the templates as a starting point and adapt them, don't reinvent the structure.
- When giving design or accessibility advice, name the standard or principle being applied (e.g. "WCAG 2.2 SC 2.4.7 Focus Visible") so the user can verify and the tester can test against it.
- When a decision is project-specific, check the loaded profile first before defaulting to the core principles.
- Default to brevity and specifics. The user is senior in their craft and doesn't need accessibility explained from first principles — they need it applied to their current artefact.
