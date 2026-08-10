# Folder Structure

How to organise the migrated site's files. Read this when restructuring or setting up the project.

## Contents
- Goals
- A static-site structure
- A build-step structure
- Asset organisation
- Path discipline
- Migrating without breaking links

## Goals

A good structure makes the site easy to navigate, keeps shared code in one place, separates source from build output, and keeps paths predictable so links don't break. The structure depends on whether there's a build step.

## A static-site structure (no build, opens in browser)

For a site that must run from the file system or a plain static host, keep it flat and predictable:

```
sitename/
├── index.html
├── about.html
├── shop.html
├── …other pages…
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css        (or vendored)
│   │   └── theme.css                (brand overrides — loaded AFTER bootstrap)
│   ├── js/
│   │   ├── bootstrap.bundle.min.js
│   │   └── main.js                  (shared site JS)
│   ├── img/                         (local images, if any)
│   └── fonts/                       (self-hosted fonts)
└── README.md
```
Keep one `theme.css` and one `main.js` as the single sources of truth for styling and behaviour. Load order matters: Bootstrap CSS, then `theme.css`; Bootstrap JS, then `main.js`, both before `</body>`.

## A build-step structure (Sass/bundler)

If theming via Sass or bundling JS:

```
sitename/
├── src/
│   ├── scss/
│   │   ├── _tokens.scss
│   │   ├── theme-overrides.scss     (Sass vars before bootstrap import)
│   │   └── main.scss
│   ├── js/
│   │   └── main.js
│   └── pages/ or *.html
├── dist/                            (build output — what ships)
├── package.json
└── README.md
```
Source in `src/`, output in `dist/`. Never hand-edit `dist/`. Document the build command in the README.

## Asset organisation

- One folder per asset type (`css`, `js`, `img`, `fonts`) under `assets/`.
- Name files by role, not by page (`main.js`, not `index-script.js`), since they're shared.
- Optimise and locally store hero/critical images; offsite CDN images are fine for non-critical but note the internet dependency.

## Path discipline

- Use consistent relative paths. For a flat structure, assets are `assets/css/…` from every page (all pages at root, so no `../`).
- If pages move into subfolders, every relative path must be re-based — a common source of broken links after restructuring. Prefer keeping pages at root for a static site unless there's a strong reason.
- Avoid mixing absolute (`/assets/…`) and relative (`assets/…`) paths; absolute paths break on `file://` and on hosts served from a subpath.

## Migrating without breaking links

1. Decide the final structure before moving files.
2. Move files, then update every internal `href`/`src` to match.
3. Re-run the link check from the audit (`grep -rho 'href="[^"]*\.html"'`) and confirm each target exists.
4. Check asset references (`css`, `js`, `img`, fonts) on every page, not just the home page.
5. Keep filenames stable where possible; if a page is renamed, add the old→new mapping to the README (and a redirect if the host supports it).
