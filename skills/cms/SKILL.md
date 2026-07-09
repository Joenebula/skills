---
name: cms
description: Use when building content management or modelling editable content — content types, a page/block model, media library, navigation, SEO fields, and publishing. Model content as structured data, not blobs of HTML, and separate what editors own from what the app owns.
---

# cms — model content as structure, not soup

The one core truth: **content modelled as structured data is reusable, queryable, and safe to edit; content stored as a blob of markup is a trap.** The job of a CMS is to let non-developers change the right things safely — which means deciding deliberately what is editable content versus fixed application behaviour, and giving each content type a real shape.

Editable content is [[data-modelling]]; the editing UI is [[forms-and-input]]; discoverability is [[seo]].

## Law 1 — Editable content vs fixed app

- Draw the line explicitly: **editors own** copy, images, pages, menus, SEO text, promotional content; **the app owns** logic, layout rules, data behaviour.
- **Content is not catalogue.** On a commerce build, products, variants, prices, and inventory belong to [[ecommerce-admin]]'s modules — never modelled as CMS pages; and editorial pages (about, journal, landing) are CMS content — never admin modules. The two have different owners, lifecycles, and integrity rules.
- A control that *looks* editable but isn't wired (or vice-versa) is the [[ask-dont-guess]] failure — make the boundary honest.
- **Persist editable content to the data store**, not to files written at runtime; ship defaults as embedded code ([[data-modelling]], gotcha d in [[engineering-standards]]).

## Law 2 — Content types are structured

- Each content type (page, article, product copy, banner, FAQ) is a **defined schema** of typed fields — not one big rich-text blob.
- **Reusable blocks/components**: a page is composed of typed blocks (hero, rich text, gallery, CTA…), each with its own fields, reorderable. The editor assembles; it doesn't hand-write layout.
- **Relationships** are references (this article → that author/product), not copied text that drifts.

## Law 3 — The editor experience

| Capability | Rule |
|---|---|
| **Rich text** | A constrained editor that outputs clean, safe markup — sanitised, no arbitrary scripts ([[security]]). |
| **Media library** | Upload once, reuse; with alt text ([[accessibility]]), sensible sizes ([[performance]]), and organisation. |
| **Navigation/menus** | Editable, ordered, validated links — no dead/duplicate URLs ([[seo]]). |
| **Preview** | See it before it's live; draft vs published is unmistakable. |
| **SEO fields** | Per-page title/description/canonical/social, authored here ([[seo]]). |

## Law 4 — Publishing, versioning, and workflow

- **Draft → published** states are explicit; unpublished content never leaks to the public surface (no undisclosed fixture, [[ask-dont-guess]]).
- **Scheduling** (publish/expire at a time) runs via a job, not a hopeful check ([[background-jobs]]).
- **History/versioning** so an editor can see and revert changes; for multi-author, a review/approval step where it matters.
- **Localisation**: per-locale content with fallback, not copy-paste forks ([[internationalization]]).

## Stand this up in a new project

- Model the **content types and block catalogue first**; resist the single-rich-text-field shortcut — it can't be restyled or reused.
- Build the **block model + media library + nav editor** as the reusable core; new content types compose from it.
- Wire **draft/publish/schedule + SEO fields** from the start; they're painful to retrofit.

## Cross-links
- [[data-modelling]] — content types as structured schemas; references not copies; persist to the store.
- [[forms-and-input]] — the editor forms, validation, media upload.
- [[seo]] — per-page metadata, sitemap, canonical, structured data authored here.
- [[internationalization]] — per-locale content with fallback.
- [[background-jobs]] — scheduled publish/expire.
- [[security]] — sanitise rich-text/markup; safe media handling.
