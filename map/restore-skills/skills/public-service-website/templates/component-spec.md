# Template — Component Spec

One spec per component. Copy and fill. The acceptance criteria at the end are what the tester checks against.

---

## Component: [Name]

**Purpose:** [What user need does this serve? When is it used?]
**Based on:** [Bootstrap component, if any — see `references/bootstrap-foundation.md`]

### Anatomy

[List the parts: e.g. container, label, input, hint, icon, error message. A labelled sketch helps.]

### States

| State | Appearance | Notes |
|---|---|---|
| Default | | |
| Hover | | |
| Focus | | Must meet SC 2.4.13 Focus Appearance |
| Active / pressed | | |
| Disabled | | Don't rely on colour alone |
| Error | | Message + icon + text, not colour alone (SC 1.4.1) |
| Loading / empty | | If applicable |

### Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (<576px) | |
| Tablet (≥768px) | |
| Desktop (≥992px) | |

Target size ≥24×24px, 44px preferred for primary actions (SC 2.5.8).

### Tokens used

[List the design tokens — colour, type, spacing, radius — from `templates/design-tokens-starter.md`. Reference semantic tokens, not raw values.]

### Semantic HTML

[The native element(s) expected, e.g. `<button>`, `<a>`, `<fieldset>`. Prefer native over ARIA.]

### Keyboard behaviour

- Focusable: [yes/no, order]
- Activation: [Enter / Space / arrows]
- Escape / dismiss: [if applicable]
- Focus management: [where focus goes on open/close/change]

### ARIA (only if native HTML can't do it)

| Attribute | Value | Why |
|---|---|---|
| | | |

### Accessible name

[How the control is named; must contain visible label text — SC 2.5.3.]

### Content rules

[Label wording, character limits, plain-English requirements, error message wording — see `references/content-design.md`.]

### Acceptance criteria

Use `templates/acceptance-criteria.md` format. Examples:

- [ ] Renders correctly in all states listed above.
- [ ] Operable by keyboard alone; focus order logical; focus visible (SC 2.4.7, 2.4.13).
- [ ] Accessible name contains the visible label (SC 2.5.3).
- [ ] Meets contrast: text 4.5:1, UI boundaries 3:1 (SC 1.4.3, 1.4.11).
- [ ] Target ≥24px (SC 2.5.8).
- [ ] Errors announced and associated; focus moves to summary (SC 3.3.1).
- [ ] Works without JavaScript / degrades gracefully.
- [ ] No leftover Bootstrap default styling.
