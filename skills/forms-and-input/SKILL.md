---
name: forms-and-input
description: Invoke when building any form, input, or data-entry flow — validation, clear errors, required/optional, multi-step, autosave and unsaved-changes guards, and file upload. A form is where users hand you their work; never lose it and never confuse them.
---

# forms-and-input — never lose their work, never confuse them

The one core truth: **a form is the moment a user trusts you with their effort — losing it or blocking them on a bad error is the fastest way to break that trust.** Validate clearly, fail helpfully, save defensively, and make the path obvious. This is also the highest-risk surface for [[accessibility]].

Built from documented components ([[design-system]]); the server-side validation behind it is [[security]] + [[api-design]].

## Law 1 — Labels and structure

- **Every field has a visible, programmatic label** — never a placeholder masquerading as one (it vanishes on focus and fails screen readers, [[accessibility]]).
- Mark **required vs optional** explicitly and consistently; don't make users guess.
- Group related fields; order them in the sequence a person actually thinks; use the right input type so mobile shows the right keyboard ([[responsive-design]]).

## Law 2 — Validate at the right time, in the right place

- **On the client for fast feedback, on the server for truth.** Client validation is UX; the server re-validates everything ([[security]]).
- **Validate at the helpful moment** — on blur or on submit, not aggressively on every keystroke before they've finished. Re-validate a fixed field immediately so the error clears.
- **Never trust client-sent** prices, totals, ids, or flags — re-derive server-side.

## Law 3 — Errors that help, not scold

| Do | Not |
|---|---|
| Specific: "Enter a date in the future." | Generic: "Invalid input." |
| **Next to the field**, and announced ([[accessibility]]). | A single banner that hides which field. |
| Preserve **all** the user's input on error. | Clear the form and make them start over. |
| Summarise + link to the first error on long forms. | Make them hunt. |
| Plain language, no codes. | "Error 0x2F." |

## Law 4 — Don't lose their work

- **Autosave** long or valuable forms (draft state), or **warn before leaving** with unsaved changes — never silent data loss on a back button or reload.
- **Disable the submit during processing** and show a busy state — the per-row/async busy mechanism in [[engineering-standards]] — to prevent double submission; pair with an idempotent endpoint ([[api-design]]).
- On success, confirm clearly and show the result; on failure, keep the data and explain.

## Law 5 — Multi-step and file upload

- **Multi-step**: show progress, allow back without losing entered data, validate per step, only commit on final confirm.
- **File upload**: show progress, validate type/size **client and server**, handle failure/retry, and never execute or trust the file ([[security]]). Image uploads get preview + sensible constraints.
- **Destructive form actions** (delete, overwrite) confirm through the shared confirm dialog — never a naked submit ([[ask-dont-guess]]).

## Stand this up in a new project

- A **form component set** in the design system: field + label + help + error wired once, accessible by construction ([[design-system]]).
- A **shared validation schema** reused on client and server so the rules can't drift ([[api-design]]).
- An **unsaved-changes guard** and an **upload component** built once and reused.

## Cross-links
- [[design-system]] — documented field/label/error components, built once.
- [[accessibility]] — labels, error association, announcements; the riskiest a11y surface.
- [[security]] — server-side validation, never trust client values, safe file handling.
- [[api-design]] — shared validation schema, idempotent submits, consistent error shapes.
- [[ask-dont-guess]] — destructive submits confirm; a dead/no-op submit is a broken promise.
