---
name: seo
description: Invoke when building public pages or content that should be found — titles/metadata, sitemap, robots, structured data, canonical URLs, and social cards. Make every public page tell search engines exactly what it is, once, without duplicates.
---

# seo — make every public page legible to machines

The one core truth: **a page a crawler can't understand or can reach by five different URLs won't rank, no matter how good it is.** Most SEO is mechanical hygiene: a correct title, one canonical URL per thing, clean structure, and machine-readable metadata. Get the plumbing right and content does the rest.

Public content is usually authored in a [[cms]]; the URL-shape discipline is the clean-URL rule in [[engineering-standards]].

## Law 1 — One page, one URL, one purpose

- **Canonical URLs**: each piece of content has exactly one canonical address; every variant (trailing slash, query params, www) points to it. Duplicate URLs split ranking and are the most common own-goal.
- **Every entity type owns its path** and all sites that build/parse URLs agree on the shape — a wrong default silently creates duplicates ([[engineering-standards]]).
- **Redirects**: when a URL changes, 301 the old one; never leave a dead link or a soft-404.

## Law 2 — Per-page metadata that matches the page

| Element | Rule |
|---|---|
| **Title** | Unique, descriptive, front-loaded; one per page. |
| **Meta description** | Unique, accurate summary; it's the search snippet, not a keyword dump. |
| **Canonical tag** | Points to the one true URL. |
| **Headings** | One H1 that states the topic; logical order ([[accessibility]] shares this). |
| **Robots directives** | Index what should be found; `noindex` thin/duplicate/private pages deliberately. |

Generic, copy-pasted titles/descriptions across pages are the failure mode — make them per-page.

## Law 3 — Structured data and social cards

- **Structured data** (schema markup) for the things that have a recognised type — product, article, event, FAQ, breadcrumb. It earns rich results and tells machines what the page *is*. Keep it accurate to the visible content (lying gets it ignored).
- **Open Graph / social cards** so shared links render a title, description, and image instead of a bare URL.

## Law 4 — Crawlability and site structure

- **`robots.txt`** allows the crawl and **points to the sitemap**; don't accidentally block what should rank.
- **Sitemap** lists canonical URLs, stays current (generated from real content, not hand-maintained), and excludes noindex/dead pages.
- **Internal links** give every page a path in; nothing important is an orphan. A sensible hierarchy beats a flat dump.
- **Crawl budget**: don't make crawlers wade through infinite filtered/paginated permutations — canonicalise or noindex them.

## Law 5 — The fundamentals still apply

- **Speed and mobile** are ranking factors — [[performance]] and [[responsive-design]] are part of SEO.
- **Real, useful content** with the words people search; metadata can't rescue an empty page.
- **Accessibility overlaps**: semantic markup, alt text, and heading order help crawlers and assistive tech alike ([[accessibility]]).

## Stand this up in a new project

- A **metadata layer** so every public route emits a correct title/description/canonical/OG by construction, with per-page overrides authored in the [[cms]].
- A **generated sitemap + robots** wired to real content, not a static file that rots.
- A **structured-data helper** per content type.
- An **SEO check** in preflight: missing/duplicate titles, missing canonical, broken redirects, orphan pages ([[regression-testing]]).

## Cross-links
- [[cms]] — where per-page SEO fields and content are authored and kept current.
- [[engineering-standards]] — clean, type-owned URLs that all sites agree on (no duplicate URLs).
- [[performance]] / [[responsive-design]] — speed and mobile as ranking factors.
- [[accessibility]] — semantic markup, one H1, alt text shared with crawlers.
