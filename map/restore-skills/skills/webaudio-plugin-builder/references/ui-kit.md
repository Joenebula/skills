# The control surface

The look is *studio hardware, rendered honestly* — light chassis, recessed screens, physical
controls. It is not a "web app" aesthetic and it should not drift into one.

`assets/ui-kit.css` is the working stylesheet. `assets/starter.html` boots with it. This file
explains the reasoning so you can extend it without breaking it.

## Contents

- [Tokens](#tokens)
- [The section pattern](#section)
- [What a control owes the user](#owes)
- [Controls](#controls)
- [The step grid](#grid)
- [Modals and help](#modals)
- [Sliding panels](#panels)
- [Announce (accessibility)](#announce)
- [Keyboard](#keyboard)

---

<a name="tokens"></a>
## Tokens

Everything is a CSS variable, and there are two themes. **Never hardcode a colour** — a
literal `#f2f3f6` looks right in light mode and wrong in dark. Use `var(--card2)`, which *is*
`#f2f3f6` in light and its dark-mode counterpart otherwise.

```css
:root{
  --page:#dfe2e8; --chassis:#eef0f4;              /* the box */
  --card:#fff; --card2:#f2f3f6; --card3:#e7e9ee;  /* surfaces, in depth order */
  --well:#1b1f27;                                 /* screens: DARK in both themes */
  --ink:#39404b; --sub:#79818e; --faint:#8e95a1;  /* text, in weight order */
  --line:#e4e6eb;
  --teal:#127e88;  --coral:#c9432c;               /* accent, alert */
  --warn:#a86a12;                                 /* "this can't act" */
  --on-coral:#fff;                                /* text ON a filled accent */
  --shadow:0 1px 2px rgba(16,24,40,.07), 0 10px 26px rgba(16,24,40,.07);
  --inset:inset 0 2px 10px rgba(0,0,0,.5);        /* recessed screens */
  --r:6px;
}
```

Two subtleties worth keeping:

- **Screens stay dark in both themes.** A waveform display is a screen; it doesn't turn white.
- **`--on-coral` / `--on-accent` exist because white text fails on a teal fill.** Any time you
  fill a control with an accent colour, the text on it needs its own token.

---

<a name="section"></a>
## The section pattern

A section is a `.panel` owning a group of related effects. Build the header once; every
subsequent section is then nearly free. This is the single biggest lever on build speed.

```html
<div class="panel">
  <div class="fxhead">
    <span class="eyebrow">Colour</span>
    <span class="hint">saturation, crush, pump &amp; resonance</span>
    <div class="spacer"></div>
    <select class="preset">…</select>          <!-- factory + user presets -->
    <button class="fxbtn" data-ic="mute">Mute all</button>
    <button class="fxbtn on" data-ic="power">FX On</button>
    <button class="fxbtn iconbtn" data-ic="dice"></button>
    <button class="fxbtn iconbtn helpbtn" data-ic="help" data-help="colour"></button>
  </div>
  <div class="fxrow">…controls…</div>
</div>
```

Every section gets the same six affordances, in the same order, always:

| | Why it matters |
|---|---|
| **Presets** | Factory bank + user saves, in separate `<optgroup>`s. ~30 factory presets is the right number — enough that the dice always finds something good. |
| **Mute all** | Parks every effect at its neutral value. Requires every effect to *have* a neutral. |
| **Power** | Bypasses the section. Must gate the **audio**, not just the CSS (pitfall 5). |
| **Dice** | Randomise. Casts a small ensemble, never everything (pitfall 17). |
| **?** | Explains every control in the section. See below. |
| **Hint** | One line. If it needs two, it belongs in the **?** sheet. |

**Keep headers to one row.** If they wrap, split into two explicit rows rather than letting
flex do it — a wrapped header squashes the preset dropdown to "Patc∨" and looks broken.

---

<a name="owes"></a>
## What a control owes the user

This is the part that separates a plugin that feels good from one that feels like a form.

1. **It must be readable at a glance.** Label, value, and units. Always show the number.
2. **It must be typeable.** A `contenteditable` value field beside every slider. Dragging is
   for feel; typing is for precision. You need both.
3. **It must say when it can't act.** A row whose effect is at 0% shows a `0%` tag and greys
   out. A module not in the signal path says so. Silent failure is the enemy (SKILL.md law 4).
4. **It must show what it's doing.** Painted grid cells pulse when they fire. The playhead
   moves. Live modules ring. If something is happening in the audio, something should move.
5. **It must be undoable.** `pushHistory()` before any destructive change.
6. **It must announce itself** to screen readers — see [Announce](#announce).

---

<a name="controls"></a>
## Controls

### Slider (`.fx` / `.sl`)

A pill containing: power LED (per-effect mute) · label · range · editable value.

```html
<div class="fx off" id="fxDrive">
  <span class="lbl">Drive</span>
  <input type="range" id="drive" min="0" max="100" value="0">
  <span class="valmono edit" id="driveVal" contenteditable inputmode="numeric">0%</span>
</div>
```

`.off` greys the readout; `.hot` warms the pill's background when the effect is doing
something. That single class is how the user scans a wall of forty controls and instantly
sees which six are live.

The track is a recessed channel (`--card2` + inset shadow), 6px, with a floating 15px thumb.
**The vertical variant is the same pill, stood on end** — same track, same thumb,
`writing-mode: vertical-lr`. A bare vertical slider with no pill looks broken next to
horizontal ones that have one.

### Dial

An SVG arc + a cap with an indicator line, `cursor: ns-resize`. Drag accumulates on a
*continuous* raw value and snaps only for display and audio — otherwise stepped dials feel
sticky:

```js
const n = clamp(norm(raw) + dy / 170 * (e.shiftKey ? 0.25 : 1));  // shift = fine
raw = denorm(n);
set(raw, true);
```

Support: drag, shift-drag (fine), double-click (default), arrow keys, and a `data-log="1"`
flag for frequency-style dials.

### Segmented control (`.seg`)

Mutually exclusive choices. Always for enumerations (filter type, reverb character, note
division). Never a dropdown for fewer than six options — a `<select>` hides the choices.

### Power button (`.fxbtn[data-ic=power]`)

Filled accent when on, flat when off. **Its label changes** — "On"/"Off", not just a colour.
And it never dims when its parent card dims, or "On" ends up rendering grey (pitfall 3).

---

<a name="grid"></a>
## The step grid

A canvas, one row per effect, one column per step. This is the highest-value component in the
whole kit — it turns a static effect rack into an instrument.

**Rules that matter:**

- **A cell is a gate, not a second volume.** `level = (cell/3) * panelAmount` (pitfall 2).
- **A run of adjacent cells is one held gesture**, not N retriggers (pitfall 18). Draw runs as
  one continuous bar with a bright cap on the firing cell, so the picture matches the sound.
- **Row order = chain order.** Dragging rows reorders the audio.
- **Rows whose effect is at 0% show a `0%` tag** and grey out.
- **Cells pulse when they fire** — stamp the time, decay over ~280ms on an ease-out cubic.
  Not a hard on/off; that strobes.

```js
const now = performance.now();
if (head !== lastHead) {                          // playhead moved to a new column
  lastHead = head;
  rows.forEach((r, i) => { if (r.cells[head] > 0) flash[i + "_" + head] = now; });
}
// per cell:
const age = now - flash[key];
if (age < 280) {
  const k = 1 - age / 280, e = k * k * k;         // ease-out cubic: quick bloom, soft tail
  g.globalAlpha = Math.min(1, alpha + 0.5 * e);
  g.shadowColor = row.colour; g.shadowBlur = 4 + 20 * e;
  g.fillRect(x - (e * 1.2), y - (e * 1.2), w + e * 2.4, h + e * 2.4);   // swells a hair
}
```

Clear the flash stamps on stop, or cells are left glowing.

---

<a name="modals"></a>
## Modals and help

**Every section gets a `?` next to its dice**, opening a sheet that explains each control.

**Write the help from the code, not from the labels.** The valuable lines are the ones the UI
can't say by itself:

- "Ghost send needs Analyse first — that's what classifies each slice."
- "Ratchet is a *chance* that rerolls every pass; Stutter is deterministic and happens every
  time." (They look identical in the grid and behave completely differently.)
- "A row whose effect is at 0% can't sound."

If you find yourself writing help that just restates the label, delete it.

**Modal mechanics** — both of these are non-obvious and both bite:

```css
html { scrollbar-gutter: stable; }                          /* or the page jumps (pitfall 13) */
.modal, .sheetbody, .scroll-list { overscroll-behavior: contain; }  /* pitfall 14 */
body:has(.modal.open) { overflow: hidden; }
```

Close on ✕, Esc, and click-outside. All three.

---

<a name="panels"></a>
## Sliding panels

See pitfall 12. Short version: never `display: none → block` for something you want to
animate. Keep it in the layout, park it with a negative margin, animate the margin. The
neighbouring panel then reflows smoothly instead of snapping.

If anything is drawn relative to the moving panel (cables on a fixed canvas), redraw every
frame for the duration, in both directions.

---

<a name="announce"></a>
## Announce (accessibility)

One live region, one function, called on every meaningful state change:

```html
<div class="sr" id="announcer" role="status" aria-live="polite"></div>
```
```js
const announce = msg => { const a = $("announcer"); if (a) a.textContent = msg; };
```

It costs almost nothing and it doubles as your user-facing log — "FX grid: Filter, Stutter,
Reverb", "Patch: Acid Line — Beat → Filter → Folder → Out". Users read it even when they don't
need it.

Also: `aria-pressed` on toggles, `role="slider"` + `aria-valuenow` on dials, real `<label>`s,
and visible focus rings (`:focus-visible`).

---

<a name="keyboard"></a>
## Keyboard

- **Space = play/stop.** Claim it *first* in the handler, `preventDefault`, and blur the
  focused element — otherwise a focused button eats it (pitfall 15). Never steal it from a
  text field.
- **Ctrl/Cmd+Z / Shift+Z** — undo/redo.
- **A pad-per-key row** (QWERTY → steps) if you have steps. It makes the thing playable.
- **`[` and `]`** to nudge the loop region; with Shift, by a whole loop length.
