---
name: design-system
description: Use BEFORE building or changing ANY UI (page, screen, component, form, modal, or stylesheet) — build every UI from a documented design system (tokens + a component catalogue + a live gallery), never invent one-off classes or values; also covers standing a design system up from scratch.
---

# design-system

A UI built without a system always gets redone. Hand-picked colours drift, one-off classes multiply, two screens that should match don't, and the day you decide to "make it consistent" you rewrite all of it. The fix is to make consistency the path of least resistance: every screen is assembled from a small set of documented components and tokens, and there is a place you can SEE them all. This skill is the UI authority — the "components" stage of the [[engineering-standards]] build pipeline defers to it.

**RULE ZERO — NEVER invent a class or hand-pick a pixel / colour / spacing value. Build only from documented components and design tokens.** If the value you want isn't a token and the thing you want isn't a documented component, STOP and resolve that (find it, or follow STEP 5) before you write a line of UI. An unsystematic build is not "faster" — it is a debt you pay back by redoing it. The generic **AI-default look** (thick borders, purple→blue gradients, glassmorphism, emoji — see *No generic / AI-default design* in STEP 4) is the most common form of this, and it is banned outright.

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

When a project has no system yet, build it in this order. Each layer depends only on the layer below it.

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

- **Scan the diff for undocumented classes and literals** — raw colour values, raw pixel spacing, class names absent from the stylesheet. Any hit is a RULE ZERO violation — fix before shipping.
- **Confirm forms validate inline** (per-field error, focus-first-invalid, server mirror) per STEP 3.
- **Delegate the diff to the design-system-auditor agent** to catch what a search can't: wrong component for the need, a second accent, a hard-coded close destination, a missing catalogue/gallery entry.
- **Run the accessibility-auditor alongside it** — an off-token value is also an unverifiable contrast, and a bespoke widget is a keyboard/focus risk; the two audits pair on every UI diff.

This is the "components" gate of the build pipeline in [[engineering-standards]]; the full pre-ship gauntlet lives in [[regression-testing]] and the release flow in [[shipping]]. When the system itself is ambiguous, don't guess — see [[ask-dont-guess]]. The system carries three concerns that have their own depth: [[accessibility]] (bake it into the tokens/components so screens inherit it), [[responsive-design]] (breakpoints, fluid type, the spacing scale), and [[forms-and-input]] (the validation/error/upload behaviour STEP 3 starts).

---

## KEEP DOCS CURRENT

Any new or changed component updates the **catalogue AND the gallery in the same change** (STEP 5). The gallery is the source of truth you can see; the catalogue is the source of truth you can read. If they fall behind the code, the system rots and the next person reinvents what they can't find. Treat doc drift as a build break.
