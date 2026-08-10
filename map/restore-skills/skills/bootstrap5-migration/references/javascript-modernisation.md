# JavaScript Modernisation

Replacing inline `onclick`, old jQuery, and ad-hoc scripts with modern, accessible JavaScript. Read this when modernising behaviour and animations.

## Contents
- First: check what's actually there
- Inline onclick → delegated listeners
- jQuery → vanilla / Bootstrap JS
- jQuery animations → CSS and Web Animations
- Bootstrap component JS
- Accessible interactivity
- Progressive enhancement

## First: check what's actually there

Before "updating the jQuery", confirm jQuery is actually used:
```bash
grep -rl 'jquery\|jQuery\|\$(' *.html js/*.js
grep -rho 'onclick' *.html | wc -l
```
Often the real situation is many inline `onclick=""` handlers and vanilla JS, with no jQuery at all. Tell the user what's really in the code, then modernise that. Don't migrate a library that isn't present.

## Inline onclick → delegated listeners

Inline handlers (`onclick="toggleMobile()"`) scatter behaviour through the HTML, can't be cleanly tested, and force global functions. Replace with event delegation in `main.js`:

```html
<!-- before -->
<div class="hamburger" onclick="toggleMobile()">…</div>
<!-- after -->
<button class="hamburger" data-action="toggle-menu" aria-expanded="false" aria-controls="nav">…</button>
```
```js
// main.js — one listener, dispatch by data-action
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'toggle-menu': toggleMenu(el); break;
    case 'add-to-cart': addToCart(el.dataset.id); break;
    // …
  }
});
```
Benefits: behaviour lives in one file, works for dynamically added elements, and the markup stays clean. Convert `onclick="window.location='cart.html'"` into a real `<a href="cart.html">` — navigation should be a link, not a scripted click.

## jQuery → vanilla / Bootstrap JS

If jQuery *is* present, common replacements:

| jQuery | Vanilla |
|---|---|
| `$('.x')` | `document.querySelectorAll('.x')` |
| `$el.on('click', fn)` | `el.addEventListener('click', fn)` |
| `$el.addClass('a')` | `el.classList.add('a')` |
| `$el.toggleClass('a')` | `el.classList.toggle('a')` |
| `$el.attr('x', v)` | `el.setAttribute('x', v)` |
| `$el.fadeIn()` / `.slideUp()` | CSS transition + class toggle (below) |
| `$.ajax` | `fetch()` |
| `$(document).ready(fn)` | `DOMContentLoaded` listener or `defer` script |

Most jQuery UI behaviours (modal, dropdown, collapse, tabs, carousel) have Bootstrap 5 equivalents that ship with accessibility — prefer those over re-implementing.

## jQuery animations → CSS and Web Animations

Replace `.fadeIn`, `.slideToggle`, `.animate` with CSS transitions/animations toggled by class, or the Web Animations API for sequenced motion. CSS is cheaper and runs off the main thread:

```css
.reveal { opacity: 0; transform: translateY(12px); transition: opacity .5s, transform .5s; }
.reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { transition: none; opacity: 1; transform: none; }
}
```
```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }});
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```
Use `IntersectionObserver` for scroll reveals instead of scroll-event handlers (smoother, no jank). **Always honour `prefers-reduced-motion`** (WCAG 2.2 SC 2.3.3) — gate or disable non-essential motion.

## Bootstrap component JS

Use Bootstrap's plugins for modal, offcanvas (mobile menu), collapse (accordion/FAQ), dropdown, toast, and tab. They manage ARIA states and focus for you. Trigger via data attributes (`data-bs-toggle="modal"`) or the JS API (`new bootstrap.Modal(el)`). Import only the plugins used to keep the bundle small.

## Accessible interactivity

- Interactive elements are `<button>`/`<a>`, not `<div onclick>` — they get keyboard and focus for free (SC 2.1.1).
- Custom widgets need keyboard support (Enter/Space/arrows/Escape) and correct ARIA states.
- Modals: move focus in, trap while open, return on close. Bootstrap's modal does this; verify it.
- Toasts/notifications: put them in an `aria-live` region so screen readers announce them (SC 4.1.3).
- Countdown timers and live regions: don't announce every tick — update politely.

## Progressive enhancement

- Core navigation and key journeys (browse, view product, reach checkout) should work with JS disabled. Links navigate, forms submit. JS enhances — it isn't the only path.
- Load scripts with `defer` (or at end of body) so they don't block render.
- Guard against missing elements (`if (!el) return;`) so one page's absent element doesn't throw and kill the shared script for the whole site.
