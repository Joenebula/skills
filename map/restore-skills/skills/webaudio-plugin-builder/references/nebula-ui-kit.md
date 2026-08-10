# The Nebula UI kit — dark boutique instrument surface

The second visual language this skill carries. `assets/ui-kit.css` is *studio hardware in
daylight* (light chassis, recessed screens). This one is *boutique dark plugin* — glassy
cards, glowing accents, machined knobs — distilled from four passes of user feedback on the
Nebula2 pair, with commercial references (Echoform-style delay UIs, Antares Slice density,
RC-505 colour rings) judged and cherry-picked. `assets/nebula-preview.html` is the living
spec: open it, view-source it, lift components from it.

Pick ONE language per project and commit. Mixing them reads as broken.

## Contents

- [Direction: what was taken and what was rejected](#direction)
- [Tokens](#tokens)
- [The depth grammar](#depth)
- [The machined knob](#knob)
- [Cards, blocks and the hairline](#cards)
- [Screens: give spare room a readout](#screens)
- [Fit laws — how knobs stop bleeding](#fit)
- [Type scale](#type)
- [Shared-surface law for plugin families](#shared)
- [The kaos pad](#kaos)
- [Rack as a page](#rack)
- [Process: mockup passes](#process)

---

<a name="direction"></a>
## Direction: taken and rejected

Judged against real commercial plugin references with the user:

- **Taken — Echoform-class glassy dark**: card-per-section with one glowing accent, big
  value-forward knobs (the delay knob reads `1/8 · dot`, not milliseconds), vertical output
  meter column, recessed wells for anything visual.
- **Taken — Antares-style section discipline** for dense grid screens: strong section
  headers, uniform control rows, no decoration where data lives.
- **Taken — RC-505 colour rings** for voice identity on a drum rail: a ring in the voice's
  hue with an LED core reads instantly and scales to N voices.
- **Rejected — texture-heavy aggro skins** (flame/grunge): age fast, fight legibility.
- **Rejected — white/neumorphic-light**: waveform and grid screens want dark wells; a light
  chassis around dark screens is *the other kit*, not this one.
- **Rejected — rompler-style centrepiece art** (planets, mascots): pixels that don't work.

**The colour law survives any reskin**: hue = which block of the app you are in (Nebula2:
coral = Colour/tone, cyan = Space, violet = Morph, teal-green = Rack). Level is brightness,
identity is position + label. Restyle changes the *voices* of the hues, never their job.

---

<a name="tokens"></a>
## Tokens

```css
:root{
  --bg:#080b13; --card:#131a2e; --card2:#0f1526; --well:#05070d;
  --line:rgba(255,255,255,.075); --hiline:rgba(255,255,255,.11);
  --ink:#eef1f9; --sub:#9aa3bd; --faint:#5d6580;
  /* block hues, each with a -hi sibling for crests/gradients */
  --colour:#ff6a4d; --colour-hi:#ffa38f;
  --space:#3fe0d4;  --space-hi:#9ff2ec;
  --morph:#a37dff;  --morph-hi:#cdb6ff;
  --rack:#31e3a1;   --rack-hi:#a4f8d6;
  --r:14px;
  --card-sh:0 16px 40px rgba(0,0,0,.5), 0 3px 10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.07);
  --well-sh:inset 0 3px 14px rgba(0,0,0,.8), inset 0 1px 2px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.05);
  --btn-sh:0 3px 7px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.09);
}
```

Every accent needs its `-hi` sibling: gradients (`linear-gradient(180deg, var(--x-hi),
var(--x))`) are what make filled buttons and lit cells read as *lit* rather than flat.
Fonts: a characterful technical display face for labels (Chakra Petch worked), a mono for
every value (IBM Plex Mono), `font-variant-numeric:tabular-nums` so values don't wiggle.

---

<a name="depth"></a>
## The depth grammar

The rule that killed "it looks 2D": **every surface is either raised or recessed — nothing
is flat.**

- Raised (cards, buttons, knob caps, pads, voice tiles): top border-highlight
  (`border-top-color:var(--hiline)`), vertical gradient, drop shadow below, inset 1px white
  top line. Active/accent states add an outer glow in the block hue.
- Recessed (grids, meters, waveform, XY pad, preset display, jacks): `var(--well)` fill,
  `--well-sh` inset shadow, near-black border.
- Pressed: `:active{transform:translateY(1px)}` + reduced shadow.
- The chassis itself gets a fine `feTurbulence` grain overlay at ~4% alpha so it reads as
  material, not vector fill.

---

<a name="knob"></a>
## The machined knob

The centrepiece component, stamped by JS from `data-` attributes
(`data-l` label, `data-v` value text, `data-n` 0..1, `data-a` accent). Full source in
`assets/nebula-preview.html` (`stampKnobs`). Anatomy, outside-in:

1. **Tick-dot ring** just outside the arc; dots the value has passed light in the accent.
2. **Track arc**: a dark recessed stroke under a faint white one (280°, −140°→+140°).
3. **Value arc** in the accent with `drop-shadow` glow, plus a short bright **crest cap**
   (`-hi`, ~55% width) at the leading edge — that crest is what reads as light on metal.
4. **Cap**: radial gradient (`#39456e → #1d2440 → #0e1326`, highlight at 36%/27%), a rim
   stroke of a vertical white→black gradient, an `feDropShadow` under the whole cap, and a
   soft specular ellipse upper-left.
5. **Pointer**: rounded line from centre, accent + glow when n>0, grey at zero.

Three sizes only — big (R=52, hero parameter, value 17px), standard (R=27), small (R=19).
Value text: `-hi` glow on the big knob only; quiet ink elsewhere; `--faint` at zero.
Zero-state is part of the design: grey pointer, no arc, dim value — a knob at rest is quiet
(the loud/quiet layer law, for free).

---

<a name="cards"></a>
## Cards, blocks and the hairline

A card = one `.chead` row (power LED with halo ring · block-hue title, letterspaced ·
one-line hint · mini-buttons right) + content. Two wayfinding devices, both quiet:

- the title glows faintly in the block hue;
- a **2px hairline** of the hue along the card's top edge
  (`linear-gradient(90deg,transparent,hue 25%,hue 75%,transparent)` at 50% opacity).

That's all the colour a card's chrome gets. The content carries the rest.

---

<a name="screens"></a>
## Screens: give spare room a readout, never padding

When a card has empty space, fill it with a **recessed screen showing what the audio is
doing** — this was the single most-praised move of the redesign:

- Space card → **echo-tap decay display**: bars at the delay division falling off at the
  feedback rate (first tap `-hi`, glow on all).
- Colour card → **transfer-curve screen**: the actual tanh drive curve, steepening with the
  drive value, dashed identity diagonal behind it.
- Drum voice card → **transient scope**: decaying pitch-falling sine, i.e. the kick you'd
  hear.
- Waveform screen: gradient-filled mirrored envelope, glowing crest line, dB gridlines,
  slice-handle triangles, bracketed loop region, playhead with a soft light spill.

Pattern: `.screen` (well + inset) with an absolute canvas and a `.scap` corner caption
(`tube · drive 32%`). Draw once per state change; these are not 60fps surfaces.

---

<a name="fit"></a>
## Fit laws — how knobs stop bleeding

The recurring layout bug (three user complaints, one cause): **fixed-size controls in a
flex row get squeezed** and their tick rings bleed into the neighbouring card, or clip.

- Knob rows are **CSS grid with explicit columns**, never `justify-content:space-between`
  flex: `.krow{display:grid;grid-template-columns:repeat(4,1fr);gap:18px 6px;justify-items:center}`.
- Controls are `flex:0 0 auto` / fixed width; **a control must never be larger than its
  grid cell** — check the arithmetic (card inner width − gaps) ÷ columns ≥ control width
  *before* choosing the column count. 6 knobs that don't fit become 3×2 + a screen, not a
  squeeze.
- One spacing scale: 14 (row/card gaps), 16 (card padding), 18 (knob-grid gaps). No other
  values.
- The chassis is a fixed width (1280). Cards get explicit widths or `flex:1`; the same
  bottom-row recipe (block card grow · Space 448 · Morph 300) on every page of every
  plugin in the family.

---

<a name="type"></a>
## Type scale

Small type was the #1 "not professional" signal. Floor sizes: control labels 10px semibold
letterspaced caps; values 12.5px mono (17px on hero knobs); section titles 11px/700 at
.26em; hints 10px; footer/meta 10px mono. Nothing under 8.5px anywhere, and 8.5px only for
captions inside screens.

---

<a name="shared"></a>
## Shared-surface law for plugin families

"They both have to work exactly the same" is structural, not cosmetic. Across every plugin
in a family, these are **the same component with the same layout, pixel for pixel**:
the header (logo · preset browser · A/B ⇄ · undo · BPM+tap · transport), the output rail
(meters, LIM, latency), the Space card, the step grid, the morph pad, and the rack. A
person who learns one plugin has learned them all; a component fixed once is fixed
everywhere.

---

<a name="kaos"></a>
## The kaos pad

A morph/XY pad earns card status, not corner-widget status. Recipe: square recessed well
with a **dotted coordinate field** (`radial-gradient(rgba(255,255,255,.07) 1px, transparent
1.4px)` at 33px spacing) + crosshair; corner labels as small chips; the position dot has a
radial glow *and* a breathing animation (2.8s shadow pulse); a 2–3 step motion trail behind
it; and 2–3 small knobs beneath (glide / drift / depth) so the card does a job.

---

<a name="rack"></a>
## Rack as a page

If the main view and the rack feel like different products, the fix is structural: the rack
becomes a **page** with the identical header and card language, toggled by a MAIN/RACK
segment in the footer of both. Modules are the same cards; the four states render as:
LIVE (accent ring + badge), NO PATH OUT (red-warn ring + badge — render the dangling state,
it ends arguments), OFF (contents desaturated, name struck, badge), IDLE (plain, badge).
Cables: bezier with a black under-stroke shadow, an accent **gradient along the run**
(userSpaceOnUse, teal→green), glow, and dashed for CV.

---

<a name="process"></a>
## Process: mockup passes

Restyle in a **static preview file** with view tabs (one per page), fake data stamped by
tiny JS, nothing wired. Each user pass is minutes. The observed sequence, likely universal:
pass 1 lands the direction (expect "too flat, too small, doesn't fit"); pass 2 is the depth
pass (shadows, wells, type up a step); pass 3 fixes fit structurally (grids, fixed columns)
and grows the hero component; pass 4 fills spare room with screens. Only after explicit
sign-off does the system get ported into the working builds.
