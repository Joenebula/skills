# Accessibility Core — WCAG 2.2

General accessibility and inclusive design beyond compliance. Read this for WCAG 2.2 structure, the new criteria, and inclusive-design thinking. For keyboard specifics see `accessibility-keyboard.md`; for screen reader / voice see `accessibility-speech.md`.

## Contents
- The standard and the floor
- POUR principles
- What's new in WCAG 2.2
- Inclusive design beyond compliance
- How to annotate for accessibility

## The standard and the floor

WCAG 2.2 AA is the floor for this skill, not the target — design past it where a real user need exists. WCAG 2.2 was published in October 2023 and supersedes 2.1. It keeps everything in 2.1 except the removed 4.1.1 Parsing, and adds nine new success criteria. Six of the new ones affect Level AA, which is the level public bodies in the UK are held to under PSBAR (see `references/compliance.md`).

Always cite the specific success criterion when giving advice (e.g. "SC 2.4.11 Focus Not Obscured") so the tester can test against it and the developer can verify.

## POUR principles

WCAG is organised under four principles:

- **Perceivable** — users can perceive the content (text alternatives, contrast, captions, reflow).
- **Operable** — users can operate the interface (keyboard, enough time, no seizure triggers, navigable, input methods).
- **Understandable** — content and operation are understandable (readable, predictable, input assistance).
- **Robust** — content works across browsers and assistive tech (valid markup, name/role/value).

## What's new in WCAG 2.2

The nine additions, with the ones that matter most for public service flagged:

**Level A**
- **2.5.7 Dragging Movements** — anything done by dragging must also work with a single pointer (e.g. tap targets, not just drag-and-drop). *Motor accessibility.*
- **3.2.6 Consistent Help** — if help (contact details, chat, help link) appears on multiple pages, it sits in the same relative place. *Cognitive accessibility — a core public service concern.*
- **3.3.7 Redundant Entry** — don't make users re-enter information they already gave in the same process (auto-populate or let them select it). *Reduces form friction.*

**Level AA** (the six that matter for compliance)
- **2.4.11 Focus Not Obscured (Minimum)** — the focused element isn't entirely hidden by other content (sticky headers/footers, cookie banners). *Common real-world failure.*
- **2.4.13 Focus Appearance** — focus indicators are large and contrasting enough to be clearly visible. *See keyboard reference.*
- **2.5.8 Target Size (Minimum)** — interactive targets at least 24×24 CSS px (with exceptions). *Mobile and motor.*
- **3.3.8 Accessible Authentication (Minimum)** — don't require a cognitive function test (like remembering or transcribing) to log in, unless an alternative exists. Allow paste, password managers, and avoid puzzle CAPTCHAs. *Cognitive.*
- (3.2.6 Consistent Help and 3.3.7 Redundant Entry above also commonly described alongside AA work.)

**Level AAA** (aim for where feasible)
- 2.4.12 Focus Not Obscured (Enhanced), 2.4.13's enhanced sibling, 3.3.9 Accessible Authentication (Enhanced).

**Removed:** 4.1.1 Parsing — modern browsers handle parsing errors gracefully, so it's no longer required. (Valid markup is still good practice.)

## Inclusive design beyond compliance

Compliance is a floor; inclusion is the goal. Design for the range of people actually using public services:

- **Cognitive load** — short pages, one main task per page, plain language (see `content-design.md`), clear next steps, no time pressure.
- **Situational and temporary impairments** — bright sunlight, a cracked screen, holding a baby, a noisy bus, English as a second language. Designing for permanent impairments helps everyone in these moments.
- **Low digital confidence** — forgiving forms, obvious affordances, no assumed knowledge, a clear way to get human help.
- **Low bandwidth and old devices** — the performance budget *is* an accessibility measure for a large part of the public.
- **No JavaScript** — core journeys must still work; treat JS as enhancement.

## How to annotate for accessibility

Use `templates/accessibility-annotation.md`. Every wireframe and design carries: heading structure, tab order, focus order, accessible names for controls, ARIA only where native HTML can't do the job, error-handling behaviour, and the specific SCs each annotation addresses. The handoff references explain what the developer and tester each receive.
