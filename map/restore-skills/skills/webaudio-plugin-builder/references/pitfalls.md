# The pitfall catalogue

Every entry is a real bug from a real build. The shape is deliberate:

> **Symptom** — what the user actually says. This is what you'll be given.
> **Cause** — what's actually wrong. Almost never where the symptom points.
> **Fix** — the structural change, not the patch.

Read this before writing audio code. When you hit a new one, add it.

## Contents

1. [Sliders stop working after the sequencer runs](#1)
2. [An effect plays while its amount is at zero](#2)
3. [An effect is "on" but rendered as disabled](#3)
4. [A module looks dead but is audibly alive](#4)
5. [Turning a section off doesn't stop its sound](#5)
6. [A sample plays at double or half speed](#6)
7. [A file "reverts" to an old version](#7)
8. [The delay is out of time after a random roll](#8)
9. [Old audio keeps playing after you stop or reload](#9)
10. [Effects ring on forever after stop](#10)
11. [A control throws and aborts the whole operation](#11)
12. [A panel snaps into place instead of animating](#12)
13. [The page jumps sideways when a modal opens](#13)
14. [Scrolling a modal scrolls the page behind it](#14)
15. [The spacebar doesn't start playback](#15)
16. [The UI stutters during playback](#16)
17. [A randomiser produces mush](#17)
18. [A step sequencer retriggers instead of sustaining](#18)
19. [User presets vanish in the standalone file](#19)
20. [The label column drifts out of line with the grid canvas](#20)
21. [Knobs bleed into the neighbouring card](#21)
22. [A tempo change retunes one delay but not the other](#22)
23. [Undo "works" but restores nothing for some gestures](#23)
24. [Preset import silently drops parameters](#24)

---

<a name="1"></a>
## 1. Sliders stop working after the sequencer runs

**Symptom** — "I adjust any of the effect sliders and they don't work. Resonate is working
when I turn it up." (Note the tell: *one* control still works.)

**Cause** — The `AudioParam` automation timeline. The FX grid scheduled automation
(`setValueAtTime`, `setTargetAtTime`, ramps) on `pre.gain`, `filt.frequency`,
`comp.threshold`. The slider handler set those params by plain assignment: `p.value = v`.

Per the Web Audio spec, once a param has an automation timeline, `.value` assignments are
**silently ignored** — permanently, not just while the automation is running. So the moment
you played a Drive or Filter row, those sliders went dead for the rest of the session.

Resonate kept working purely by luck: its tuning function happened to use `setTargetAtTime`,
which *is* automation, so it won.

**Fix** — One write mechanism for every automatable param:

```js
const setParam = (p, v, tc = 0.02) => {
  if (!p) return;
  try { p.cancelScheduledValues(ctx.currentTime);
        p.setTargetAtTime(v, ctx.currentTime, tc); }
  catch { try { p.value = v; } catch {} }
};
```

Never mix `.value =` and automation on the same param. Ever. If one code path uses
automation, *all* paths must.

**Cost when missed:** this presented as a total mystery for a long time, because "the
sliders don't work" points at the slider code, which was perfect.

---

<a name="2"></a>
## 2. An effect plays while its amount is at zero

**Symptom** — "I have shatter playing but the effect is at zero and it still plays."

**Cause** — Two independent amounts for one effect. The step grid computed the effect's
strength from the *cell level alone* (`shatter = cellLevel/3 * 100`) and never consulted the
panel slider. A full cell meant 100% shatter regardless of the fader.

A related instance: the reverb send forced the wet mix open to a hardcoded floor (0.85)
whenever *any* throw cell was painted — so reverb sounded with the fader at 0. This had been
added deliberately, to make throws "work", and it was a lie.

**Fix** — A grid cell is a **gate**, not a second volume:

```js
const amt = rowAmount(row.id);      // 0..1, from the panel
if (amt <= 0) continue;             // the effect is off — the row CANNOT sound
const lvl = (cell / 3) * amt;       // cell level SCALES the amount you set
```

And delete any "floor" that fakes a value to make a feature work. If the feature needs a
non-zero amount, it needs the user to set one — see pitfall 4's sibling, law 4 in SKILL.md.

---

<a name="3"></a>
## 3. An effect is "on" but rendered as disabled

**Symptom** — "Effects are on but they're disabled. If they're disabled they should be off."

**Cause** — Two visual states rendered identically. A module that was *powered off* and a
module that was *powered on but not in the signal path* both got `opacity: .5`. Worse, the
dimming applied to the whole card including the power button, so a coral "On" button rendered
grey — the control contradicted itself.

**Fix** — Make the states visually distinct, and never dim the thing that reports the state:

| State | Meaning | Render |
|---|---|---|
| **Off** | power is off | the *only* greyed state; contents desaturate, name struck through |
| **Live** | in the signal path | accent ring, accent name |
| **Dangling** | patched, but the path dead-ends | warning ring + a `NO PATH OUT` tag |
| **Idle** | powered, no cables | barely recessed — *not* greyed |

The power button and module name never dim, so "On" always reads as On.

---

<a name="4"></a>
## 4. A module looks dead but is audibly alive (or vice versa)

**Symptom** — "I added a cable between the wavefolder and phaser but they're both greyed out,
even though they're now part of the chain."

**Cause (two of them, and both matter)** —

*The user was wrong*: the Phaser's input was empty and the Wavefolder's output went nowhere.
The pair was an island. Nothing fed it, nothing left it. It genuinely wasn't in the chain.

*But the code was also wrong*: the "is it live" check walked a single straight line from the
source, taking the first cable it found at each hop. Any branch, or a second path, was
mislabelled dead.

**Fix** — Two reachability sweeps, and a third UI state:

```js
const live = new Set();
const fwd = reach("fwd");     // what can the source get to?
const back = reach("back");   // what can get to the sink?
fwd.forEach(m => { if (back.has(m)) live.add(m); });   // reachable AND escaping
```

Then render **dangling** (wired, but not live) distinctly from **off** — with a tooltip that
says *why*: "patched, but the signal never reaches Main Out — check its In and Out jacks".
That turns an argument into a two-second fix.

**Lesson beyond the code:** when a user's mental model is wrong, say so plainly — *and* fix
the thing that made it easy to be wrong.

---

<a name="5"></a>
## 5. Turning a section off doesn't stop its sound

**Symptom** — "I turned it off top right and it didn't stop — one of the effects was still
playing."

**Cause** — The power flag was consulted by the UI but not by the audio. The section's
`tuneMod()` computed `const on = mode !== "off" && !!buffer` — and never looked at the power
state at all. The button toggled a class and nothing else.

**Fix** — The power flag gates the *audio*, and the UI derives from it (law 2). And "off"
must actually tear down: stop the sources feeding the effect, restore any parameter the
effect was driving, and drain the tails.

```js
function setSectionPower(on) {
  sectionOn = on;
  if (!on) { stopSources(); restoreParamsThisSectionDrove(); drainTails(); }
  tune();                       // and tune() must itself check sectionOn
  render();                     // visuals derive from state
}
```

---

<a name="6"></a>
## 6. A sample plays at double or half speed

**Symptom** — "The BPM wasn't right and it was playing twice as fast."

**Cause** — Tempo detection trusted the filename absolutely. `VEC1 Loops BB140 077.wav` — the
parser looked for a separator-delimited 2–3 digit number, found `077`, and returned 77. It
never saw the `140` because those digits are glued to letters. And a named BPM
**short-circuited the loop-length detector entirely**.

The loop-length detector would have got it right on its own: the file is 6.857s, which is
exactly 4 bars at 140.

**Fix** — Metadata is a hint; the audio is the evidence.

```js
// 1. Every plausible number in the name, including digits glued to letters
// 2. Test each against the ACTUAL duration — does it give a whole number of bars?
function fitsDuration(bpm, dur) {
  const bars = dur / ((4 * 60) / bpm);
  const near = Math.round(bars);
  const err = Math.abs(bars - near) / near;
  if (err > 0.02) return 0;                         // it simply isn't that tempo
  return [1,2,4,8,16].includes(near) ? 1 : 0.5;     // 7-bar loops are rare
}
// 3. Score name candidates AND loop-length candidates together; best wins.
// 4. If nothing survives, fall back to onset analysis.
```

`077` needs 2.2 bars to explain a 6.857s loop — discarded. `140` gives exactly 4 — it wins.

**Verify it against the real file.** Extract the detector, feed it the actual audio, print the
scores. Don't reason about it — run it.

---

<a name="7"></a>
## 7. A file "reverts" to an old version

**Symptom** — "The demo sample has reverted back to the old one."

**Cause** — Two code paths producing "the demo". Boot decoded an embedded WAV. The
File ▸ Demo menu item called `makeDemoLoop()`, which **synthesised a completely different
loop** from sine waves and noise. Same name, different sound. One click silently replaced the
real demo with the fake one.

The file on disk was correct the whole time — verified byte-for-byte.

**Fix** — One function, one source of truth. Both call sites go through the same
`loadDemoLoop()`. Delete the other path entirely.

**Diagnostic lesson:** before "fixing" a reversion, *verify the artifact*. `md5` the embedded
asset against the source. If they match, the bug is in a code path, not the file.

---

<a name="8"></a>
## 8. The delay is out of time after a random roll

**Symptom** — "When adding any delay randomly it must always be in time."

**Cause** — Delay time stored as **raw milliseconds** on a 20–1200ms dial. A random roll
picked an arbitrary number. Presets hardcoded `375`, `500`, `666` — values that are only
musical at one specific tempo. And nothing re-tuned when the BPM changed.

Compounding it: the randomiser had its own private copy of the dial-setter that skipped the
snapping the real setter did (see law 8).

**Fix** — Store the **division**, derive the milliseconds:

```js
const DIVS = { "1/32":0.125, "1/16T":1/6, "1/16":0.25, "1/8T":1/3, "1/16.":0.375,
               "1/8":0.5, "1/4T":2/3, "1/8.":0.75, "1/4":1, "1/2T":4/3, "1/4.":1.5, "1/2":2 };
const ms = div => (60000 / bpm) * DIVS[div];
```

- Randomisers pick a **note**, never a millisecond → cannot land off-grid.
- Presets get snapped on load → a preset written at 120 works at 140.
- BPM change re-derives → the echo follows the tempo instead of drifting.
- The readout shows the note (`1/8. · 321`), not a meaningless number.

---

<a name="9"></a>
## 9. Old audio keeps playing after you stop or reload

**Symptom** — Stop doesn't stop. Loading a new sample leaves the old one playing over it.

**Cause** — `AudioBufferSourceNode`s scheduled with `start(t)` in the future are fire-and-
forget. If you don't hold a reference, you cannot stop them.

**Fix** — A voice registry. See law 7 in SKILL.md. Every source you create gets registered and
self-removes on `onended`.

---

<a name="10"></a>
## 10. Effects ring on forever after stop

**Symptom** — You press stop and the delay keeps regenerating; the comb filter hums on.

**Cause** — Feedback loops don't know about your transport. A comb with 0.85 feedback will
ring for a very long time.

**Fix** — Drain on stop: drop the feedback gains to 0, let the loop decay, then restore the
user's settings so their patch survives.

```js
function drain() {
  const t = ctx.currentTime;
  fbNodes.forEach(fb => fb.gain.setTargetAtTime(0, t, 0.05));
  setTimeout(() => fbNodes.forEach((fb, i) => applyDial(fbIds[i], dialVals[fbIds[i]])), 400);
}
```

---

<a name="11"></a>
## 11. A control throws and aborts the whole operation

**Symptom** — "Loading a sample via the file button silently fails."

**Cause** — `$("graft").value = 35` where `#graft` had been removed from the markup months
earlier. `null.value` throws, the throw propagates up through `loadSample`, gets swallowed by
a `try/catch` that reports "couldn't load that sample", and the real cause is invisible.

**Fix** — Guard, or delete. And when you remove UI, **scan for dangling references** —
see `references/verification.md`. Don't rely on the code "looking" clean.

---

<a name="12"></a>
## 12. A panel snaps into place instead of animating

**Symptom** — "It needs to slide out rather than grow. Both sections need to move smoothly."

**Cause** — `display: none → block`. The moment the element exists, the flex row reflows
*instantly*: the main panel jumps to its new width while the new panel fades in. It reads as
"growing out of nothing".

You cannot transition `display`, and you cannot transition a layout that appears from nowhere.

**Fix** — Keep the element in the layout permanently and animate its **footprint**:

```css
#panel {
  display: block;                          /* always present */
  width: var(--w);
  margin-right: calc(-1 * var(--w));       /* PARKED: claims no space */
  transform: translateX(30px);
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: margin-right .42s var(--ease), transform .42s var(--ease),
              opacity .24s ease, visibility 0s linear .42s;
}
#panel.open {
  margin-right: 0;                         /* claims its width */
  transform: none; opacity: 1;
  visibility: visible; pointer-events: auto;
  transition: margin-right .42s var(--ease), transform .42s var(--ease),
              opacity .30s ease .05s, visibility 0s linear 0s;
}
body { overflow-x: hidden; }               /* the parked panel must not add a scrollbar */
```

Animating the margin makes the flex container hand over space *gradually*, so both panels
move as one continuous gesture. Reverses cleanly for free.

**If anything is positioned relative to the moving element** (patch cables on a fixed
canvas, say), redraw it every frame for the duration of the transition — in **both**
directions — or it detaches and snaps at the end.

---

<a name="13"></a>
## 13. The page jumps sideways when a modal opens

**Symptom** — "When opening the modal the app below jumps to the right."

**Cause** — `body:has(.modal.open) { overflow: hidden }` — the standard scroll-lock. Body
overflow propagates to the viewport, the scrollbar disappears, the page instantly gets ~15px
wider, and everything shifts.

**Fix** — Reserve the gutter permanently so there's nothing to remove:

```css
html { scrollbar-gutter: stable; }
```

---

<a name="14"></a>
## 14. Scrolling a modal scrolls the page behind it

**Symptom** — Scroll to the bottom of a file list and the app behind it starts scrolling away.

**Cause** — Scroll chaining. When a scroll container hits its end, the wheel event passes to
the parent.

**Fix** —

```css
.modal, .modal-body, .scroll-list { overscroll-behavior: contain; }
body:has(.modal.open) { overflow: hidden; }   /* plus pitfall 13's gutter fix */
```

---

<a name="15"></a>
## 15. The spacebar doesn't start playback

**Symptom** — "Can we add space stop and start?" — when it's already bound.

**Cause** — It *was* bound, but at the bottom of the key handler. If a button or `<select>`
had focus (i.e. immediately after clicking anything), the browser's default action fired
that control instead — and the transport either did nothing or double-fired.

**Fix** — Claim the key first and outright:

```js
if (e.code === "Space") {
  const t = e.target, tag = (t.tagName||"").toLowerCase(), ty = (t.type||"").toLowerCase();
  const typing = tag === "textarea" ||
    (tag === "input" && !["range","checkbox","radio","file","button"].includes(ty));
  if (typing) return;              // never steal space from a text field
  e.preventDefault();              // stops the focused button/select firing
  e.stopPropagation();
  document.activeElement?.blur?.();
  playing ? stop() : start();
  return;
}
```

---

<a name="16"></a>
## 16. The UI stutters during playback

**Symptom** — Audio glitches when the window is busy; the waveform is expensive to draw.

**Two causes, both worth knowing** —

*ScriptProcessorNode runs on the main thread.* It will glitch whenever the UI is busy. Use
`AudioWorklet` where you can, and keep any `ScriptProcessor` **out of the audio path entirely**
unless it's actually doing something.

*Full-buffer canvas redraws.* Rendering a waveform per frame scans the entire buffer 60×/sec.

**Fix** — Cache the picture, animate only the playhead:

```js
let cache = null, cacheKey = "";
function draw() {
  const key = `${w}x${h}|${sampleGen}|${slices.length}`;   // NOT the playhead
  if (!cache || cacheKey !== key) { cache = renderOffscreen(); cacheKey = key; }
  ctx.drawImage(cache, 0, 0);
  drawPlayhead();                                          // cheap, every frame
}
```

Deliberately excluding the playhead from the cache key is the whole trick.

---

<a name="17"></a>
## 17. A randomiser produces mush

**Symptom** — "When pressing random, each effect doesn't have to happen. All at once is a bit
much."

**Cause** — The dice filled *every* row, every time. Sixteen effects firing at once isn't a
beat, it's mud.

**Fix** — Cast a small ensemble:

```js
const pool = rows.filter(r => !isStarved(r.id));   // skip rows that CAN'T sound (see #2)
const want = roll < .30 ? 2 : roll < .65 ? 3 : roll < .88 ? 4 : 5;
const cast = pickRandom(pool, want);
rows.forEach(r => { if (!cast.has(r.id)) clear(r); else fill(r); });
```

Two refinements that matter more than they look:
- **Skip controls that can't act** — picking a row whose effect is at 0% wastes a slot and
  makes the dice feel broken.
- **Announce what it picked** — "FX grid: Filter, Stutter, Reverb" — so the user can tell what
  changed.

---

<a name="18"></a>
## 18. A step sequencer retriggers instead of sustaining

**Symptom** — "Can an effect trigger over more than one step — once over two sections rather
than every time?"

**Cause** — Every painted cell fired the effect independently, each snapping back within its
own step. Eight painted Filter cells = eight separate dives, not one sweep.

**Fix** — A **run** of adjacent cells is one gesture:

```js
function runAt(row, i) {
  if (!(row.cells[i] > 0)) return null;
  let a = i; while (a > 0 && row.cells[a-1] > 0) a--;
  let b = i; while (b + 1 < n && row.cells[b+1] > 0) b++;
  return { start: a, end: b, len: b - a + 1, first: i === a };
}
// For PARAM rows: act only on run.first, and stretch the return-to-rest across run.len steps.
if (held && !run.first) continue;
const span = (held ? run.len : 1) * stepDur();
param.setValueAtTime(peak, t);
param.exponentialRampToValueAtTime(rest, t + span * 0.92);   // ONE sweep across the run
```

**Crucially, not every row holds.** Rows that act on the *slice itself* — pitch, reverse,
shatter, gate, stutter, sends — must keep applying to every step of the run, because "held"
for them means "keep doing it". Split them:

```js
const HOLD_ROWS = ["filter","drive","crush","squeeze","pump","width","reso","haunt"];
```

And **draw the run as one continuous bar**, so the picture matches the sound.


---

<a name="19"></a>
## 19. User presets vanish in the standalone file

**Symptom** — Presets save fine while developing, and are gone every time the user opens
the file by double-clicking it. Nobody reports it, because it fails silently.

**Cause** — Persistence went through a hosting-app API (`window.storage`) that only exists
inside the host. From disk, `window.storage` is `undefined`; every save site was wrapped in
`if(window.storage)` so nothing threw — the saves just never happened.

**Fix** — Shim the host API with localStorage **keeping the same contract** (the host's
`get` returns `{key,value}`), so zero call sites change:

```js
if(!window.storage){
  window.storage={
    get: async k=>{ try{ const v=localStorage.getItem("app-"+k); return v==null?null:{key:k,value:v}; }catch(_){ return null; } },
    set: async (k,v)=>{ try{ localStorage.setItem("app-"+k, String(v)); }catch(_){} }
  };
}
```

And test persistence in a `file://`-like context, not just in the host. See
`references/product-layer.md` for the full persistence + session-restore pattern.

---

<a name="20"></a>
## 20. The label column drifts out of line with the grid canvas

**Symptom** — "The rows are out of alignment." HTML labels on the left, canvas lanes on the
right, drifting further apart down the column.

**Cause** — The label rows got their heights (rowH − gap) from the *layout* function only.
Seven code paths rebuilt the labels (`innerHTML = …`) without re-running layout, so fresh
rows fell back to content height (16px) while the canvas stayed at rowH (22px). It shipped
fine and broke later, when a new boot path (session restore) rebuilt labels before layout.

**Fix** — Sizing is part of *building*, not a separate pass. One `sizeLabelRows()` derived
from the same rowH constant the canvas uses, called by the label builder itself **and** by
layout. Two columns laid out from one geometry cannot disagree; a builder that doesn't size
what it builds is half a builder.

---

<a name="21"></a>
## 21. Knobs bleed into the neighbouring card

**Symptom** — A knob's tick ring overlaps the next card; a value reads with a line through
it (the neighbour's ring crossing the text); the last knob in a row is half-clipped.

**Cause** — Fixed-size controls in a flex row with `justify-content:space-between`. When
the card is narrower than the sum of the controls, flex squeezes the *boxes* but the SVG
inside (with `overflow:visible` for glows) keeps its size and spills.

**Fix** — Control rows are CSS grid with explicit columns; controls are `flex:0 0 auto`.
Before picking a column count, do the arithmetic: (card inner width − gaps) ÷ columns must
be ≥ the control's real width. Six knobs that don't fit become 3×2 plus a screen — never a
squeeze. See `references/nebula-ui-kit.md` (Fit laws).

---

<a name="22"></a>
## 22. A tempo change retunes one delay but not the other

**Symptom** — Change the BPM and the rack echo follows but the main delay stays at the old
tempo (or vice versa). A style-switch button makes it worse.

**Cause** — Two tempo-synced times, two update paths. The BPM slider called `retuneEcho()`
but never `tuneSpace()`; the style switch wrote `bpm =` directly, bypassing the transport
setter entirely, so *nothing* re-derived.

**Fix** — One transport setter; every BPM writer (slider, typed value, tap tempo, style
switch, preset load, MIDI) goes through it; the setter re-derives **every** synced time.
This is law 6 (musical time) plus law 1 (one setter) applied to the transport itself.

---

<a name="23"></a>
## 23. Undo "works" but restores nothing for some gestures

**Symptom** — Undo visibly works for grid edits, but undoing a morph-pad move or a preset
recall does nothing, silently.

**Cause** — Those gestures called `pushHistory()`, but `snapshot()` didn't carry the state
they change (FX values, pad position, voice params). The stack filled with snapshots that
couldn't represent the change, so applying them was a no-op.

**Fix** — The invariant: **everything that pushes history must be representable in the
snapshot.** Audit by listing every `pushHistory()` call site against the snapshot's fields.
Widening the snapshot is also what makes A/B compare and undoable-preset-recall one-line
features — see `references/product-layer.md`.

---

<a name="24"></a>
## 24. Preset import silently drops parameters

**Symptom** — Exported presets re-import "successfully" but sound different: five of twelve
parameters came back as defaults.

**Cause** — The import path normalised each preset through a hand-written object literal
that predated newer parameters. Export wrote all twelve; import kept seven. The two ends of
the same format were maintained separately (law 10, again).

**Fix** — One schema. Derive import normalisation from the same key list export uses (or
normalise via the factory-preset shape), and version the format so migration is explicit
(see `references/product-layer.md`). Any hand-maintained field list that exists twice will
eventually disagree.
