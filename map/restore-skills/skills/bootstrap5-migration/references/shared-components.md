# Shared Components — One Source of Truth for Chrome

How to define the header, nav, footer, and other repeated pieces once and use them across many static HTML pages. Read this when the nav/footer is duplicated or JS-injected.

## Contents
- The problem
- Option A: JS-injected partials (no build)
- Option B: HTML includes / templating (build step)
- Option C: server includes
- The accessible navbar
- Footer essentials
- Keeping "active page" state

## The problem

Multi-page static sites repeat the header, nav, and footer on every page. Three failure modes: (1) copy-pasted and now divergent between pages; (2) injected by a big JS template literal that writes `innerHTML` (works, but the nav doesn't exist for no-JS users or until JS runs); (3) no system at all. The goal is one definition, consistent everywhere, that doesn't depend on JS for core navigation.

## Option A: JS-injected partials (no build step)

If the site already injects chrome via JS (e.g. a `NAV_HTML` constant written into the page), it's maintainable but has a no-JS gap. Improve it rather than scatter copies:
- Keep the single definition in `main.js`.
- **Also place the real nav markup in each page's HTML** as the baseline, and let JS enhance it (highlight active link, wire the cart count) rather than create it from nothing. Core links must work with JS off.
- If you must inject, inject as early as possible and ensure the `<main>` and skip link are real HTML, not injected.

This is a judgement call: full no-JS support means the nav lives in the HTML. If the project explicitly accepts a JS dependency, document it.

## Option B: HTML includes / templating (build step)

With any build step, use partials and compose pages at build time (Eleventy, Nunjucks, Handlebars, even a tiny include script). One `_nav.html` / `_footer.html`, included everywhere, output as static HTML. This is the cleanest answer when a build step is acceptable.

## Option C: server includes

If served by a web server, SSI or the host's include mechanism can compose partials server-side. Only relevant when there's a real server, not `file://`.

## The accessible navbar

Use Bootstrap's navbar, themed, with the accessibility wired correctly:

```html
<nav class="navbar navbar-expand-lg" aria-label="Primary">
  <div class="container">
    <a class="navbar-brand" href="index.html">Brand</a>
    <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#nav"
            aria-controls="nav" aria-expanded="false"
            aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav">
        <li class="nav-item"><a class="nav-link" href="shop.html">Shop</a></li>
        <!-- aria-current="page" on the active link -->
      </ul>
    </div>
  </div>
</nav>
```
Key points:
- `<nav aria-label="Primary">` (and a distinct label if there's more than one nav).
- The toggler is a real `<button>` with `aria-controls`, `aria-expanded`, and `aria-label` — not a `<div onclick>` with three spans.
- Bootstrap's collapse JS manages `aria-expanded`. If hand-rolling the mobile menu, manage it yourself and trap/return focus.
- Mark the current page with `aria-current="page"`.
- Cart/account icon buttons need accessible names (`aria-label="Cart, 2 items"`), not just an SVG.

## Footer essentials

A single themed footer with: brand, primary links repeated, legal links (privacy, terms, cookies), company/registration info, and — for regulated products — the responsibility/age statement and any required notices (see `references/regulated-products.md`). Use a `<footer>` landmark.

## Keeping "active page" state

Highlight the current page so users stay oriented:
- Build step: set the active class in the template from the current URL.
- JS-injected: in `main.js`, compare `location.pathname` to each link's `href` and add `active` + `aria-current="page"`.
Don't hard-code a different "active" class into each page's copy — that's how copies drift.
