---
name: privacy-and-compliance
description: Invoke when collecting, storing, processing, or sharing personal data — consent, lawful basis, retention, subject-access/erasure, cookies, and age gating. Collect the minimum, keep it the shortest time, and let people see and delete their own data.
---

# privacy-and-compliance — collect the minimum, honour the request

The one core truth: **personal data is a liability you are holding, not an asset you own.** Every field you collect is something you must protect, justify, retain correctly, surface on request, and delete on demand. The cheapest way to comply is to not hold it in the first place.

Privacy is the *why* and *what* of holding personal data — the technical controls that protect it (encryption, access, audit) live wherever they're implemented.

## Law 1 — Data minimisation

- Collect a field **only** if a current feature needs it. "Might be useful later" is not a basis.
- Store the **least identifying** form that works (a hash, an age bracket, a region — not a full record).
- Set a **retention period** per data type and actually enforce deletion when it expires ([[background-jobs]] runs the purge).

## Law 2 — Lawful basis and consent

- Know **why** you may process each data type (consent, contract, legitimate interest…). Record it.
- **Consent is specific, informed, freely given, and revocable** — a pre-ticked box is not consent. Granular toggles (analytics vs marketing vs essential), not one all-or-nothing.
- **Cookies / trackers**: nothing non-essential fires before consent. The banner sets the actual behaviour, not just a preference that's ignored.
- **Age / consent gating** where required: gate before the restricted content, remember the result, and fail closed.

## Law 3 — Subject rights are features, not favours

People can ask to **see, correct, export, and delete** their data — build these as real, tested flows:

| Right | What you build |
|---|---|
| **Access / portability** | Export everything you hold about a person, in a readable, machine-portable format. |
| **Erasure** | Delete or irreversibly anonymise on request — across the database, backups policy, logs, and any synced third party ([[integrations]]). |
| **Rectification** | Let them correct wrong data. |
| **Object / withdraw** | Turn off a processing type (e.g. marketing) and have it actually stop. |

A "delete my account" button that leaves data in three other tables is a broken-promise, and a compliance breach.

## Law 4 — Sharing, transfers, and records

- Every **third party** that touches personal data is documented (what, why, where) and bound by an agreement — see [[integrations]] for the sync-side mechanics.
- Know **where data lives** (region/jurisdiction) if cross-border rules apply.
- Keep a **record of processing**: what you hold, why, how long, who it's shared with. This is also your map for an erasure request.

## Law 5 — Breach readiness and honest copy

- A **breach plan** exists *before* you need it: detect, contain, assess, notify within the required window.
- **Legal/policy pages** (privacy policy, cookie policy, terms) describe what you actually do — copy that overstates or understates real behaviour is the failure mode. Keep them in sync with the build.

## Stand this up in a new project

- A **data inventory** from day one: every personal field, its basis, its retention, its consumers. It drives minimisation, retention jobs, and erasure.
- **Consent + cookie management** wired before any tracker ships.
- **Export and erase** as first-class, tested account features — not bolted on at audit time.
- A **retention job** ([[background-jobs]]) that purges expired data automatically.

## Cross-links
- [[integrations]] — propagate erasure/rectification to synced third parties; document data sharing.
- [[email-and-notifications]] — where marketing consent and unsubscribe are actually enforced at send time.
- [[auth-and-accounts]] — the delete-account and data-export flows live in the account lifecycle.
- [[background-jobs]] — scheduled retention purges and export generation.
- [[cms]] — where the legal/policy pages are authored and kept current.
