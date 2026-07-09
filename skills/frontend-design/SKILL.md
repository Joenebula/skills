---
name: frontend-design
description: Use when choosing the aesthetic direction for a NEW interface or standing up a design system's visual identity — commit to a bold, intentional, context-specific look and execute it through tokens, avoiding generic AI-default styling. Where a documented design system already exists, design-system is the authority; this skill informs the token decisions, never bypasses them. Bold moves belong on brand/marketing/editorial surfaces — NOT on commerce trust surfaces (product, cart, checkout, payment, account), where convention and clarity win.
---

# frontend-design — a bold direction, executed through tokens

**Precedence — read this first.** If the project already has a documented design system, **[[design-system]] wins**: build from its tokens and components, full stop. This skill applies at **day zero** — when no system exists yet and you are choosing its visual identity (STEP 6 of [[design-system]]: tokens first). Every choice this skill inspires lands **as a token or a documented component decision** — never as an inline one-off. And the banned AI-default tells in [[design-system]] stay banned: distinctiveness comes from choices someone can defend, not decorative defaults nobody made.

## Design thinking — commit before you code

Before any code, understand the context and commit to a clear aesthetic direction:

- **Purpose** — what problem does this interface solve? Who uses it?
- **Tone** — pick a direction and hold it: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art-deco/geometric, soft/pastel, industrial/utilitarian… Choose one that is *true to the context*, not a favourite.
- **Constraints** — framework, performance budget ([[performance]]), accessibility ([[accessibility]]) — the direction must survive all three.
- **Differentiation** — what is the one thing someone will remember?

Bold maximalism and refined minimalism both work — **the key is intentionality, not intensity**. Choose a clear conceptual direction and execute it with precision.

## Where the boldness lives: the tokens

The direction becomes real in STEP 6 of [[design-system]] — it *is* the token decisions:

- **Typography** — choose distinctive, characterful faces; pair a display font with a refined body font. Avoid the defaults everyone reaches for (Inter, Roboto, Arial, system stacks) — and equally avoid converging on the *fashionable* default (every AI picks Space Grotesk; that's a tell too). The choice lands as the type-scale tokens.
- **Colour** — a dominant palette with sharp accents outperforms a timid, evenly-distributed one. It still resolves to the token rules: a neutral ramp, the semantic set, **exactly one accent** ([[design-system]] STEP 6). The boldness is *which* colours those tokens hold, not how many accents you smuggle in.
- **Motion** — micro-interactions and one well-orchestrated page-load with staggered reveals beat scattered effects. CSS-first; respect reduced-motion ([[accessibility]]). Documented as the system's motion convention, applied consistently.
- **Spatial composition** — asymmetry, overlap, diagonal flow, grid-breaking moments, generous negative space *or* controlled density — built on the system's spacing scale and layout primitives ([[responsive-design]]), so the drama is repeatable, not one screen's accident.
- **Atmosphere** — texture, depth, and background treatment matched to the direction (noise, geometric pattern, layered transparency, dramatic shadow). Only as **documented, tokened decisions** that fit the direction — the moment an effect is "the default look" rather than a choice, it's the AI-slop tell [[design-system]] bans (gradient-mesh wallpaper, glassmorphism-as-decoration, shadow-on-everything).

## The line this skill never crosses

- **No literal values in screens.** The direction is expressed once, in tokens and primitives; screens compose them (RULE ZERO, [[design-system]]).
- **No second accent, no emoji-as-icon, no un-tokened gradient** — the STEP 4 invariants hold whatever the aesthetic.
- **Accessibility survives the direction** — contrast-checked token pairings, visible focus, reduced-motion honoured ([[accessibility]]). A gorgeous interface that excludes people is broken, not bold.
- **Commerce trust surfaces are not the canvas.** On product, cart, checkout, payment, and account surfaces, convention, clarity, and trust are what convert — a surprised shopper abandons. Keep the grid-breaking and the drama on brand, marketing, and editorial surfaces; the money path follows [[commerce]] and the system's plainest patterns, in the same tokens.
- **Match implementation complexity to the vision** — maximalist directions need elaborate, well-organised effect code; minimalist directions need restraint and precision in spacing and type. Elegance is executing the vision well, not adding more.

## Cross-links
- [[design-system]] — the authority; this skill feeds its STEP 6 token decisions and obeys its bans.
- [[accessibility]] — contrast, focus, and motion constraints the direction must satisfy.
- [[responsive-design]] — the composition must hold from a small phone up.
- [[performance]] — atmosphere and motion inside the asset/JS budget.
