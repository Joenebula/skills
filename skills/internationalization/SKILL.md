---
name: internationalization
description: Invoke BEFORE hard-coding user-facing text, dates, money, or layout assumptions — externalise strings, format by locale, support multiple currencies, and don't assume English/LTR/one timezone. Retrofitting i18n late means touching every file; design for it early.
---

# internationalization — design for it early or pay for it later

The one core truth: **i18n is cheap as a habit and brutal as a retrofit.** Every hard-coded string, concatenated sentence, and `£`/MM-DD assumption is a place you'll have to find and fix later across the whole codebase. Externalise from the start even if you ship one language — the structure costs little now and saves a rewrite.

(*i18n* = build so it *can* be localised; *l10n* = the actual translations/regional data.) Storefront money/currency specifics live in [[commerce]].

## Law 1 — Externalise every user-facing string

- **No hard-coded display text** in code. Text lives in resource files keyed by id; code references the key.
- **Never concatenate** sentence fragments — word order differs by language. Use whole templated messages with named placeholders.
- **Pluralisation is a language rule**, not `if (n===1)` — use a plural-aware mechanism (languages have more than two plural forms).
- Give translators **context** (where it appears, what the variable is); a bare string mistranslates.

## Law 2 — Format by locale, never by assumption

| Data | Rule |
|---|---|
| **Dates/times** | Format per locale; store in UTC, display in the user's timezone. Never assume one order or zone. |
| **Numbers** | Decimal/thousands separators vary (`1,000.5` vs `1.000,5`). Use a locale formatter. |
| **Money** | Amount + currency code, minor-units integer ([[data-modelling]]). Symbol, placement, and decimals are locale-driven; don't hard-code `£`/`$`. |
| **Names/addresses** | Don't assume first/last order or a fixed address shape. |
| **Collation/search** | Sorting and case-folding are locale-specific. |

## Law 3 — Layout must flex for language

- **Text expands** (often 30%+) — don't build fixed-width labels/buttons that truncate when translated ([[responsive-design]]).
- **RTL** (right-to-left) languages mirror layout — use logical start/end, not hard left/right, so the design can flip.
- **Don't bake text into images**; it can't be translated.

## Law 4 — Content, URLs, and SEO

- **Locale routing**: a clear strategy (path, subdomain, or domain) for each language, with `hreflang` so search engines serve the right one ([[seo]]).
- **Translatable content** in the [[cms]] is modelled per-locale with a fallback; don't fork pages by copy-paste.
- A missing translation **falls back** gracefully (default locale), never shows a raw key or a blank.

## Stand this up in a new project

- Wire a **translation layer + locale formatters** from the first screen, even single-language — the seam is what matters.
- A **string catalogue** with keys + context, in source control, with a workflow to add/translate.
- Decide **locale detection** (user setting > account > Accept-Language > default) and persist the choice.
- Test pseudo-localised + an RTL locale early to catch concatenation, truncation, and hard-coded direction.

## Cross-links
- [[data-modelling]] — money as minor-units + currency; per-locale content modelling.
- [[commerce]] — multi-currency pricing, display, and settlement.
- [[cms]] — per-locale content with fallback.
- [[seo]] — locale routing and `hreflang`.
- [[responsive-design]] — layouts that absorb text expansion and mirror for RTL.
