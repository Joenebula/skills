---
name: design-system
description: Use BEFORE building or changing ANY UI (page, screen, component, form, modal, or stylesheet) — build every UI from a documented design system (tokens + a component catalogue + a live gallery), never invent one-off classes or values; also covers standing a design system up from scratch, including choosing its aesthetic direction — bold, intentional, context-specific — when none exists yet.
---

# design-system

A UI built without a system always gets redone. Hand-picked colours drift, one-off classes multiply, two screens that should match don't, and the day you decide to "make it consistent" you rewrite all of it. The fix is to make consistency the path of least resistance: every screen is assembled from a small set of documented components and tokens, and there is a place you can SEE them all. This skill is the UI authority — the "components" stage of the [[engineering-standards]] build pipeline defers to it.

**RULE ZERO — NEVER invent a class or hand-pick a pixel / colour / spacing value, and NEVER hand-copy one either. Build only from documented components and design tokens — and take every value from the source mechanically, not by eye.** If the value you want isn't a token and the thing you want isn't a documented component, STOP and resolve that (find it, or follow STEP 5) before you write a line of UI.

> **A token whose NAME reads right is not a token whose VALUE is right.**
>
> A primary button was hand-transcribed from a vendored design system. The source said `color:#fff`. A check banned raw hex, so a token was reached for instead — `--vh-on-accent`, which reads exactly like "text on an accent button" and resolves to `#0a0012`, near-black. **The button shipped with black text and the check went green**, because a token had been used. The user found it on screen.
>
> Re-checked afterwards, the same transcription had also drifted on border width, line height, padding and two font sizes. None of it showed in a diff: every line looked like a reasonable token choice.
>
> **Hand-copying values is guessing with extra steps.** See *EXTRACT, NEVER TRANSCRIBE* below.

> **And a token is a SOURCE, not a RESULT.** Using one proves the value came from the system. It never proves the value *does anything*. Where a token is carrying a visible difference — a state, a highlight, an emphasis, a hover — **measure the difference**, and if it is imperceptible, say so and choose again rather than ship a rule that looks like a decision.
>
> 28 Aug 2026: a field's "filled in" state was tinted with the next surface token up. Correct by every rule in this file. Measured against the field it sat on: **1.03 contrast** — a rounding error, invisible. Two rules were about to ship doing nothing at all, which is worse than none, because they read as a decision somebody made. The palette had no token for that job; the honest answer was to drop the state, not to invent a colour to rescue the plan.

> **List the states that only exist for SOME people, and style them on purpose.** Browser-autofilled, password-manager-filled, spellcheck-underlined, browser-translated, forced-colours / high-contrast, print. **None of them appear on the developer's screen. All of them appear on somebody's.**
>
> Same day, same project: browser autofill paints its own background on the `<input>` — which is not the field. It stopped 13px short down each side and squared off four corners the field had rounded. A search for "autofill" across the app **and the whole vendored design system** returned nothing: the state had never been styled anywhere, by anyone. Five screens shipped before a user pointed at it, because it only appears once somebody has a saved password.

An unsystematic build is not "faster" — it is a debt you pay back by redoing it. The generic **AI-default look** (thick borders, purple→blue gradients, glassmorphism, emoji — see *No generic / AI-default design* in STEP 4) is the most common form of this, and it is banned outright.

---

## EXTRACT, NEVER TRANSCRIBE

When the system is a **vendored artefact** — an export, a package, a copied folder — its values are already written down somewhere. Retyping them into your own stylesheet is a copy that starts drifting the moment either side changes, and every drift looks like a reasonable decision in the diff.

- **Lift the values mechanically.** Most exports ship their CSS inline in each component file. `extract-design-css.mjs`, beside this skill, pulls each component's CSS out verbatim into one generated stylesheet, and `--check` fails the build the moment the copy and the source disagree. Copy it into the project (e.g. `scripts/`), wire `--check` into the verify script, and **mutation-test it both ways** — change the source, watch it fail; hand-edit the generated file, watch it fail.
- **Then use the system's own class names** (`vh-btn vh-btn--primary`), so components are thin wrappers and *no value is authored at all*.
- **Never rewrite the vendored copy** to fix a problem — that forks it, and the next re-export arrives as a diff made entirely of your own edits. Fix it upstream, or wrap it.
- **If the system cannot be extracted** (values are computed, or scattered), say so out loud, and treat every hand-written value as a known risk with a named owner. Do not report it as "built from the design system".

### When you must change a vendored value

Sooner or later the export is wrong for the real screen — type too small to read, a colour that fails contrast in context. Two bad answers: edit the vendored copy (the next export silently overwrites it, and nothing shows the change ever existed), or remember to re-apply it every time (works until the once it does not).

- **Put local changes in their own stylesheet**, loaded after the extracted one, and let nothing else in the project hand-write a value.
- **Record, per block, which component it overrides and a fingerprint of that component as it was when the override was written.** A re-export cannot overwrite the override — it does not live in the design system. But when the design system CHANGES UNDER one, the fingerprint stops matching and **the build fails**, naming what moved. The override might now be redundant, or it might be fighting a deliberate upstream decision; a person decides, rather than nobody noticing. `extract-design-css.mjs` does this, and `--accept-overrides` re-records the fingerprints after a human has looked.
- **Every override states WHY, and is a debt** — it is meant to be pushed back into the design system and deleted. Without that, the override file quietly becomes a second design system.

> **A gate that bans the literal without supplying the real value pushes you into inventing a substitute.** Banning `#fff` in components is right. Banning it with no mechanical path to the real value is how a wrong token gets chosen — and passes.

This is why an automated check can report green on a UI that visibly does not match: it can prove a value came from *somewhere approved*, not that it came from *the right place*. Extraction is what closes that gap.

---

## STEP 1 — Read the system before writing anything

Do all four, in order, every time. Skipping this is how drift starts.

1. **Read the written catalogue / style guide.** Tokens, the component list, and the hard rules — what already exists and what you're allowed to use.
2. **Skim the LIVE gallery.** The page that renders every component and every variant. Reading about a component is not seeing it — open the gallery and look at the real thing and its states.
3. **Search the stylesheet for the exact class you intend to use** and confirm it already exists. If your search returns nothing, you were about to invent a class. Stop.
4. **Find the most similar EXISTING screen and match it.** The closest shipped screen is your template — copy its structure, its components, its spacing. Consistency beats cleverness.

---

## STEP 2 — Use documented components

Map the need to the documented component. Never reach past this table to raw styling.

| Need | Use |
|---|---|
| Page shell / layout frame | The documented page/shell layout (header, content width, padding) |
| Long-form / prose text | The prose / long-form text component |
| A form input | The form-field component (label + control + hint + error slot) |
| A field's error / hint | The field error element + field hint element (see STEP 3) |
| An action | The button component + its documented variants (primary / secondary / quiet / destructive) |
| Filter / toggle / segmented choice | The filter / toggle component |
| State or category label | The status badge component (semantic colour carries the meaning) |
| A metric or chart | The stat-tile / chart component |
| A list that opens a detail | The list-row → detail pattern |
| A grouped block of content | The card component |
| A dialog / confirm / sheet | The one reusable modal/dialog (see STEP 4) |
| An icon | A monochrome icon from the documented set (see STEP 4) |
| Any colour, space, radius, type size, border, line-height | A **TOKEN** — never a literal |

If a need has no row, it's a candidate for STEP 5 — not an excuse for a literal.

---

## STEP 3 — Forms validate INLINE, always

Field-level errors belong on the field. Never in a toast, never in a top-of-page alert.

The pattern (copy it from an existing form rather than re-deriving):

1. Every field renders a **per-field error element** and (where useful) a hint element.
2. **On submit, validate each field.** For any invalid field: set its error text, put the field in its invalid state, and **focus the first invalid field**.
3. **Clear a field's error on input**, as the user fixes it.
4. **Mirror every check server-side.** Client validation is UX; the server is the gate, and the two rule sets must agree — see trust-the-server in [[engineering-standards]].
5. **NEVER use a toast/alert for a field-level error.** Toasts are for transient global outcomes, not "this field is wrong."

Re-using an existing form's validation wiring is mandatory — it's the change-once principle from [[engineering-standards]].

---

## STEP 4 — Behaviour conventions

These are system-wide invariants. Breaking one is a UI bug even if it "looks fine."

- **ONE accent colour.** Exactly one accent carries "primary action / brand." Every other colour is **semantic** and appears only when it means its thing (success / warning / danger / info). A second decorative accent is forbidden.
- **Consistent close/back behaviour.** Closing a modal or going back **pops a history/navigation stack** — never hard-codes a destination. Hard-coding "go to X on close" breaks the moment the screen is reached from somewhere else.
- **One reusable modal/confirm.** All dialogs and confirmations route through the single documented modal. No bespoke per-feature popups.
- **Monochrome icons only.** Icons inherit the current text colour. **NO emoji, NO colour/multicolour icons** — anywhere, including any generated content or messages.
- **One brand spelling & casing.** The product name has exactly one spelling and one casing. Match it everywhere.
- **No generic / AI-default design.** The tells of machine-generated, templatey UI are banned outright — each is a RULE ZERO violation (an un-tokened value nobody decided on). Build distinctive, intentional UI from the system; if you can't say *why* a value was chosen, it's a tell — replace it with a token or a decision. **Banned tells:**
  - **Uniform thick borders** — the **2–3px border on every card, input and button**. Borders are 1px hairlines from the token, used to *separate*, never to decorate. No outline-everything.
  - **The default purple/indigo→blue gradient and gradient text** ("AI purple"), plus blobby gradient-mesh / aurora backgrounds. One accent from the tokens; a gradient only if the system documents one.
  - **Generic soft drop shadows on everything** (`0 4px 6px rgba(0,0,0,.1)`). Elevation comes from the token scale, used sparingly.
  - **Over-rounded corners / pills everywhere.** Radius is a token, applied consistently and on purpose.
  - **Glassmorphism / frosted-blur** cards as decoration.
  - **Emoji as icons or in headings** — see the monochrome-icons rule above.
  - **Layout clichés** — the centred hero with a huge gradient headline and two pill buttons, "bento grids", fake/Lorem testimonials, "Welcome to [Product], the all-in-one…" copy, generic stock hero imagery, a rainbow of accent colours, and spacing picked off the scale.

---

## STEP 5 — A genuinely new component (only if unavoidable)

First exhaust STEP 1 — most "new" components are an existing one you didn't find. If a new component is truly unavoidable:

1. **Build it from tokens.** No literals. It composes existing primitives and token values only.
2. **Document it in the catalogue AND add it to the gallery — in the SAME change.** Same commit, same PR.

> A new component that is not in BOTH the catalogue and the gallery is a bug. No exceptions.

---

## STEP 6 — Standing up a design system from scratch

When a project has no system yet, this is also the moment its visual identity gets decided — the two choices are inseparable: you can't pick a token value before deciding what the tokens should express.

**Commit to a direction before you pick a single token value.**

- **Purpose** — what problem does this interface solve? Who uses it?
- **Tone** — pick a direction and hold it: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art-deco/geometric, soft/pastel, industrial/utilitarian… Choose one true to the context, not a favourite.
- **Constraints** — framework, performance budget ([[performance]]), accessibility ([[accessibility]]) — the direction must survive all three.
- **Differentiation** — what's the one thing someone will remember?

Bold maximalism and refined minimalism both work — **the key is intentionality, not intensity.**

**The direction becomes real AS the tokens below** — it doesn't sit beside them, it *is* them:

- **Typography** — distinctive, characterful faces; pair a display font with a refined body font. Avoid the defaults everyone reaches for (Inter, Roboto, Arial, system stacks) — and equally avoid converging on the *fashionable* AI default (Space Grotesk is a tell too).
- **Colour** — a dominant palette with sharp accents outperforms a timid, evenly-distributed one, resolved into the neutral ramp + semantic set + exactly one accent below. The boldness is *which* colours the tokens hold, not how many accents you smuggle in.
- **Motion** — one well-orchestrated page-load with staggered reveals beats scattered effects. CSS-first; respect reduced-motion.
- **Spatial composition** — asymmetry, overlap, diagonal flow, grid-breaking moments, generous negative space *or* controlled density — built on the spacing scale below, so the drama is repeatable, not one screen's accident.
- **Atmosphere** — texture, depth, and background treatment matched to the direction, only as documented tokened decisions. The moment an effect is "the default look" rather than a choice, it's a RULE ZERO tell (gradient-mesh wallpaper, glassmorphism-as-decoration, shadow-on-everything — see STEP 4).

Two things a bold direction never gets to break: **accessibility** — contrast-checked token pairings, visible focus, reduced-motion honoured; a gorgeous interface that excludes people is broken, not bold — and **the money/trust path**. On checkout, payment, and account surfaces, convention and clarity outrank novelty; a surprised shopper or user abandons. Keep the grid-breaking for brand, marketing, and editorial surfaces, and use the plainest version of the same tokens there. Match implementation complexity to the vision: a maximalist direction earns elaborate, well-organised effect code; a minimalist one earns restraint.

Then build in this order. Each layer depends only on the layer below it.

1. **Tokens first.** Define once, at the root, as the single source of values:
   - **Colour** — a neutral ramp, the semantic set (success / warning / danger / info), and **exactly ONE accent**.
   - **Spacing scale** — a small fixed step scale, not arbitrary pixels.
   - **Radii**, **type scale**, **line-height**, **border/line** — each a short fixed list.
   - Nothing downstream hand-picks a value; everything references a token.
2. **Primitives next.** Build **button, field, card, modal, badge** — composed ONLY from tokens. These are the alphabet every screen is spelled with.
3. **A living gallery page.** One route that renders **every component and every variant/state** (default, hover, disabled, error, loading, empty). The source of truth you can SEE — if it's not in the gallery, it doesn't exist.
4. **A written catalogue.** Each component, its name/handle, and **when to use it** (the need it answers). This is what STEP 1 and STEP 2 read.
5. **Enforce it.** Stand up the design-system-auditor plus a standing rule: **nothing ships that adds styling which is neither a token nor a documented component.** Wire that rule to fail the build, not just leave a comment — see Layer A in [[regression-testing]].

Build in this order even under deadline — primitives-from-tokens is cheaper than a restyle later.

---

## VERIFY

**Run these after each COMPONENT, not after the screen.** Ten components deep, a wrong value is buried in a diff nobody re-reads, and the cost of finding it moves from seconds to a user noticing it on screen. The end-of-screen pass is for composition; per-component is for values.

- **Run the extractor's `--check`** if the system is vendored — it is the only one of these that can prove a value matches its source.
- **Scan the diff for undocumented classes and literals** — raw colour values, raw pixel spacing, class names absent from the stylesheet. Any hit is a RULE ZERO violation — fix before shipping.
- **Confirm forms validate inline** (per-field error, focus-first-invalid, server mirror) per STEP 3.
- **Delegate the diff to the design-system-auditor agent** to catch what a search can't: wrong component for the need, a second accent, a hard-coded close destination, a missing catalogue/gallery entry.
- **Run the accessibility-auditor alongside it** — an off-token value is also an unverifiable contrast, and a bespoke widget is a keyboard/focus risk; the two audits pair on every UI diff.

This is the "components" gate of the build pipeline in [[engineering-standards]]; the full pre-ship gauntlet lives in [[regression-testing]] and the release flow in [[releasing]]. When the system itself is ambiguous, don't guess — name the gap and ask. The system carries three concerns that have their own depth: [[accessibility]] (bake it into the tokens/components so screens inherit it), [[responsive-design]] (breakpoints, fluid type, the spacing scale), and [[forms-and-input]] (the validation/error/upload behaviour STEP 3 starts).

---

## KEEP DOCS CURRENT

Any new or changed component updates the **catalogue AND the gallery in the same change** (STEP 5). The gallery is the source of truth you can see; the catalogue is the source of truth you can read. If they fall behind the code, the system rots and the next person reinvents what they can't find. Treat doc drift as a build break.
