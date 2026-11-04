---
group: C
name: responsive-design
description: Invoke BEFORE calling any UI done — design mobile-first, verify it across the device matrix, and never let content overflow or controls shrink below a usable size. Most visitors are on a phone; "looks fine on my laptop" is not tested.
---

# responsive-design — mobile-first, no overflow, real devices

The one core truth: **your design has to work on the smallest, most-constrained screen first — that's where most people actually use it.** Build up from a single narrow column, let the layout adapt at content-driven breakpoints, and verify on a real matrix. A layout only ever tested at desktop width is untested.

Pairs with [[design-system]] (responsive primitives — spacing scale, fluid type, grid — built once) and [[accessibility]] (target size, zoom, reflow overlap).

## Law 1 — Mobile-first, content-out

- Start at the **narrowest** width: one column, stacked, thumb-reachable. Enhance *up*, don't cram *down*.
- Add a **breakpoint where the content needs it**, not at fixed device sizes. The design dictates the break, not a phone model.
- Prefer **fluid** layout (flexible grids, `min/max`, intrinsic sizing) over fixed pixel widths; let it flex between breakpoints, not jump.

## Law 2 — Never overflow

- **No horizontal scroll** at any width. The usual culprits: fixed-width elements, long unbroken strings, wide tables, oversized images.
- **Images and media** are fluid (`max-width:100%`, height auto) and right-sized per viewport ([[performance]]).
- **Wide tables / data grids** get a deliberate small-screen treatment — horizontal scroll *within* the component, a card view, or prioritised columns — never a page that scrolls sideways ([[data-grids]]).
- Text **reflows** to fit; it never gets clipped or pushed off-screen.

## Law 3 — Fluid type and spacing

- Type scales smoothly between a sensible **min and max** (no 11px on mobile, no giant headings either).
- Use a **spacing scale** from the design system, not hand-picked pixels ([[design-system]]).
- Layout **reflows at 200% zoom** and at narrow widths without loss of content or function ([[accessibility]]).

## Law 4 — Touch, input, and orientation

- **Targets ≥ ~44px** with spacing so neighbours aren't mis-tapped.
- **Switch on touch vs mouse, not iPhone vs Android.** `@media (pointer: coarse)` asks the browser
  "is a finger the pointer?" — the page never knows the phone. In a browser 1px = 1pt (iOS) = 1dp
  (Android), so one value meets both: tap size **48 on touch** (Android 48dp, iOS 44pt), 44 with a
  mouse. WCAG 2.2 2.5.8's floor is 24.
- **Text fields 16px on touch.** Under 16px, Safari on the iPhone zooms the page in when the field
  is tapped, and does not zoom back. Vibe HQ had 96 of 100 fields under 16px.
- **Height and the home bar:** `100dvh`, not `100vh` (vh runs under the address bar);
  `env(safe-area-inset-bottom)` under anything fixed to the bottom.
- **Ready to copy:** [kit/mobile.css](kit/mobile.css) — the tokens (`--tap-min`, `--screen-h`,
  `--safe-bottom`) and the 16px field rule.
- No **hover-only** affordance — there's no hover on touch; everything has a tap/focus path.
- Works in **portrait and landscape**; nothing assumes one orientation.
- Respect the **safe area** (notches, rounded corners) and on-screen-keyboard resize.

## Law 5 — Verify on a matrix

**At the small-phone width (375px), three numbers — measured in the browser, not looked at:**

| Check | Pass | How |
|---|---|---|
| No sideways scroll | `document.documentElement.scrollWidth <= window.innerWidth` | one line of script on every page |
| Targets | every link, button and form control ≥ 44 × 44px (or spaced so neighbours can't be mis-tapped) | read each control's bounding box |
| Nothing clipped | no element with content wider than its box (`scrollWidth > clientWidth`) unless it scrolls on purpose | loop over elements, list offenders |

"It looked fine on my phone" is not one of the three.

**Run every check on three devices** — desktop (mouse), Android (Pixel 7, Blink) and iPhone
(iPhone 15, WebKit; every iPhone browser is WebKit). The same CSS can pass in one engine and break
in the other. Ready to copy: [kit/playwright-devices.ts](kit/playwright-devices.ts), and the
no-zoom check [kit/field-zoom.check.ts](kit/field-zoom.check.ts).

| Trap | What to do |
|---|---|
| CI gets slow: phones run after desktop (Vibe HQ: 38 → 60 min) | Phones in their **own CI job**, beside the main one (back to ~29 min) |
| Safari's Tab key skips links by default; a keyboard walk fails on every link | Skip the Tab walk on the iPhone, write down why; desktop and Android walk it |
| A phone check that has never failed | Plant a touch-only fault (crowded 16px buttons, a 14px field): phones must fail **by name**, desktop must pass |
| "Finished drawing" fires before some content appears | Wait until the count holds before measuring; assert a minimum count so an empty build can't pass |
| Emulated is not real | A real-device pass (BrowserStack, a phone in hand) before launch |

Test, don't assume:

| Axis | Cover |
|---|---|
| **Width** | small phone, large phone, tablet, laptop, wide desktop. |
| **Orientation** | portrait + landscape on touch. |
| **Input** | touch + mouse + keyboard. |
| **Browser engine** | the major engines, current + one back. |
| **Conditions** | slow network, large text setting, dark/light. |

## Stand this up in a new project

- Define the **breakpoint set and spacing/type scales** in the design system once; every screen inherits them.
- Build **responsive primitives** (container, grid, stack, cluster) so most layouts compose without bespoke media queries.
- Add **representative viewports** to the manual release pass and (where possible) automated visual checks ([[regression-testing]]).

## Cross-links
- [[design-system]] — breakpoints, fluid type, spacing scale, and responsive layout primitives.
- [[accessibility]] — target size, 200% zoom reflow, orientation, no hover-only.
- [[performance]] — responsive images and not shipping desktop-weight assets to phones.
- [[data-grids]] — the small-screen treatment for wide tabular data.
