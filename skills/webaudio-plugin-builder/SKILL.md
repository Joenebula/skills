---
name: webaudio-plugin-builder
description: Build browser-based audio instruments and plugins — synths, samplers, drum machines, slicers, effect racks, sequencers, loopers, modular patch bays — as single-file HTML apps with a Web Audio engine, a transport, and a control surface. Use this skill whenever the user wants to build, extend, restyle, debug or refactor any audio tool that runs in a browser: "build me a synth", "make a sampler", "add a delay", "the sliders don't do anything", "the effect keeps playing when it's off", "make the grid sequence the effects", "why is it out of time", "add presets", "the rack won't animate". Also use it for the UI surface of such tools — panels, dials, sliders, step grids, patch cables, preset banks, help sheets — and whenever a plugin's audio graph, scheduler, or parameter automation is involved. It carries a working UI kit, a bootable starter, and a catalogue of the specific bugs that eat weeks in this domain.
---

# Web Audio Plugin Builder

This skill exists because building a browser audio plugin is a domain with a small number of
laws and a large number of ways to break them. Nearly every bug in this domain is one of
about a dozen mistakes wearing a different hat. If you know the laws, you build in days
what otherwise takes weeks of going round in circles.

It was distilled from building **SliceForge** — a sample slicer with a 16-row effect grid,
a modular patch rack with real cables, tempo detection, preset banks and a full transport.
Everything here was paid for in real bugs. The `references/pitfalls.md` catalogue is the
most valuable file in the skill; read it before you write audio code, not after.

## Read this in order

1. **This file** — process, architecture, the laws.
2. **`references/pitfalls.md`** — the bug catalogue. Symptom → cause → fix. Read it *early*.
   It will save you more time than anything else here.
3. **`references/audio-engine.md`** — Web Audio patterns: parameter writes, the scheduler,
   voice management, graph reachability, tempo sync.
4. **`references/ui-kit.md`** — the control surface: what a section looks like, what a
   control owes the user, the components.
5. **`assets/ui-kit.css` + `assets/starter.html`** — working furniture. Start from these,
   not a blank page.
6. **`references/verification.md`** — how to prove it works before claiming it does.
7. **`CHANGELOG.md`** — what changed and why. See *Keeping this skill current*.

---

## The build order that works

The temptation is to build the UI first because it's visible. Resist it. The order below is
the one that avoided rework.

**1. Decide the spine.** Every plugin in this domain is: *a source → a chain → an output*,
driven by *a clock*. Write down what each of those is for your plugin before anything else.
A sampler's source is slices; a synth's is oscillators; a drum machine's is one-shots. The
rest of the architecture is identical.

**2. Build the audio graph, with the transport, and nothing else.** Get sound out of the
speakers on a timer. No effects, no UI beyond a play button. If this is wrong everything
downstream is built on sand.

**3. Add ONE effect end-to-end.** Slider → state → audio param → readout. Prove the whole
path works for one control before you build fifteen. When it works, the sixteenth is free.
When it doesn't, you've found the bug once instead of sixteen times.

**4. Build the control surface from the UI kit.** Sections, panels, the standard header.

**Own the pixels for anything visual.** Native range orientation, canvas `roundRect`,
`appearance:slider-vertical`, `writing-mode` on inputs — all vary by engine version and by
shell (Electron ships older Chromium than your dev browser; a plugin WebView may be a third
engine again — WKWebView, WebView2, CEF each have their own quirks). Build faders, knobs,
meters and cells as custom-drawn controls with your own pointer math, and make sure the
*value model* itself is custom state, not a hidden native `<input type=range>` a custom skin
sits on top of — a skin over a native input still inherits every native-input quirk. It
renders identically everywhere and is the difference between one pass and six.

**Mock before you build, and delete what you replace.** For any non-trivial UI change,
agree a static mockup first (image or throwaway HTML), bake its sizes/colours into a written
spec, then wire it. When the new thing supersedes an old one, remove the old element + CSS +
handlers + state in the same change and grep to prove it's gone. One component per job —
never two styles of the same control.

**5. Add the sequencer / grid / modulation layer.** This is where the hardest bugs live,
because it's the first thing that writes to the same parameters the sliders write to.
Read the Automation Law before you start.

**6. Presets, randomisers, help.** Cheap once the state model is clean. If they're
expensive, your state model isn't clean — fix that instead.

**7. Verify.** See `references/verification.md`.

---

## The laws

These are not style preferences. Each one was a bug that cost real time.

### 1. One writer per parameter, one mechanism

Web Audio `AudioParam`s have an automation timeline. **Once a param has scheduled
automation, assigning `.value` is silently ignored — forever.** Not "until the automation
ends". Forever.

This is the single most expensive bug in the domain. In SliceForge it killed every slider
in the Colour section the instant the effect grid fired once, and it presented as "the
sliders don't work" — a symptom that points nowhere near the cause.

The fix is not to be careful. The fix is to make it structurally impossible: **write every
automatable parameter through one function, using one mechanism.**

```js
// The ONLY way any code writes an AudioParam.
const setParam = (p, v, tc = 0.02) => {
  if (!p) return;
  try { p.cancelScheduledValues(ctx.currentTime);
        p.setTargetAtTime(v, ctx.currentTime, tc); }
  catch { try { p.value = v; } catch {} }   // non-param fallback
};
```

If a slider and a sequencer both write to the filter cutoff, both go through `setParam`.
Last writer wins, predictably, and a slider move always beats a stale automation curve.

### 2. One source of truth for state — visuals derive from it

If the audio decides whether an effect is on, the UI must not decide separately. Every
"it says On but it's greyed out" bug is two flags that drifted apart.

Derive the visual from the audio state, never mirror it. And when a thing *looks* off, it
must *be* off — a module that renders dimmed while still processing is a lie the user will
chase for an hour.

### 3. Zero means zero

If a control reads 0%, that effect must be silent. No exceptions, no clever floors.

SliceForge had two violations. The effect grid fired each effect at a strength taken from
the *cell*, ignoring the effect's own amount — so Shatter at 0% still shattered. And the
reverb send forced the wet mix open to a fixed floor whenever any throw cell existed — so
reverb sounded with the fader at zero. Both were "helpful". Both were lies.

If a feature only works by faking a value, the feature is wrong. Make the dependency
explicit instead — and see law 4.

### 4. A control that cannot act must say so

The honest version of law 3 creates a new risk: paint cells into a row whose effect is at
0% and nothing happens, which feels broken. So the row *tells you*: it greys out and shows
a small **0%** tag meaning "raise my amount or I can't sound".

Silent failure is worse than visible failure. Whenever you gate something, render the gate.

### 5. A node graph is live only if signal can reach it AND escape it

For anything patchable — a modular rack, a routing matrix, a send bus — "is this module in
the signal path" is **not** a linear walk. Compute it properly:

```js
live = reachableForwardFrom(source) ∩ reachableBackwardFrom(sink)
```

A single forward walk breaks on the first branch, and marks modules dead that are audibly
alive. Two reachability sweeps handle any topology, cost nothing, and are correct.

Also render the third state: **patched, but the path dead-ends**. That's not "off", it's
"you forgot to connect the output" — and saying so turns a mystery into a two-second fix.

### 6. Musical time, not milliseconds

Anything rhythmic — delays, LFOs meant to sync, arpeggios — must be expressed in note
divisions and derived from the current BPM. Never store milliseconds.

Store the *division* (`"1/8."`), derive the milliseconds (`(60000/bpm) * mult`). Then:
randomisers pick a note and can't land off-grid; presets written at 120 BPM still work at
140; and changing the tempo drags the delay with it instead of leaving it behind.

### 7. Every voice must be stoppable

Keep a registry of every `AudioBufferSourceNode` you start:

```js
const voices = new Set();
const play = src => { voices.add(src); src.onended = () => voices.delete(src); src.start(); };
const stopAll = () => { voices.forEach(v => { try { v.stop(); v.disconnect(); } catch {} });
                        voices.clear(); };
```

Without this you cannot stop a sound you already scheduled — which is why loading a new
sample leaves the old one playing, and why "stop" doesn't stop.

And separately: **drain your feedback loops on stop.** Comb filters and delays with high
feedback ring forever otherwise. Set feedback gains to 0, let them decay, then restore.

### 8. Never write the same helper twice

A private copy of a shared function will drift from the original and reintroduce the bug the
original fixed. In SliceForge the rack's randomiser had its own copy of the dial-setter that
skipped the tempo-snapping — so every random roll put the delay out of time, even though the
real setter snapped correctly.

If you find yourself writing a local `setDial`, stop. Call the real one.

### 9. Metadata is a hint; the data is the evidence

Filenames lie. `VEC1 Loops BB140 077.wav` is 140 BPM, but a naive parser grabs the `077` and
blindly trusts it, and now the whole app plays at double speed.

Gather *every* candidate from the metadata, then **validate each against the actual data** —
a 6.857s loop cannot be 77 BPM, because that isn't a whole number of bars. Score the
candidates; let the evidence win. And if none survive, fall back to analysing the audio.

### 10. Two code paths for the same thing will diverge

SliceForge had a demo loop that boot loaded from an embedded WAV, and a File ▸ Demo menu item
that *synthesised* a different loop from sine waves. Same name, different sound. Clicking the
menu silently replaced the real demo with a fake one, and it read as "the file reverted".

One function. One source of truth. If two things must produce the same result, they call the
same code.

### 11. Cut features that don't earn their place

SliceForge had a "Sample B" modulator — a vocoder, ring mod and convolver driven by a second
sample. It was clever and it never worked musically. Three rounds of fixes made it *correct*
without making it *good*. We removed it, and the app got better.

Removal has a cost: dead references throw at runtime. Delete thoroughly, then scan (see
`references/verification.md`). But nursing a feature that isn't working is more expensive.

### 12. Cache the picture; animate only what moves

Redrawing a full waveform every frame means scanning the whole buffer 60 times a second.
Render the expensive picture once to an offscreen canvas, then per frame blit it and draw
*only* the playhead on top. Key the cache on what actually changes the picture — and
deliberately **not** on the playhead position.

---

## Architecture

**Single file, no build step.** One `.html` with `<style>`, markup and `<script>`. Assets
embedded as base64 data URIs. This is not a compromise — it means the user can double-click
it, email it, and you can hand back a working artifact every single turn. Never introduce a
build step unless the user asks.

**State lives in plain variables; the DOM is a view.** No framework. A control's `oninput`
updates a variable and calls one apply function. The apply function is the only thing that
touches audio.

**Sections are the unit of composition.** A section owns a group of related effects and has a
standard header: eyebrow title, hint, preset dropdown, Mute-all, power/bypass, dice, **?**.
Build the header once as a pattern and every new section is free. See `references/ui-kit.md`.

**Every effect needs a neutral value.** Drive 0, Tone 100, Width 100. If an effect has no
neutral, "mute everything" cannot return to the dry sound — and neither can the user.

**Presets should be functions, not recordings, wherever the target varies.** A saved chop
pattern is tied to a slice count and breaks on a different sample. A *generative* preset —
`(n, len) => steps` — works on any material. Same for grid patterns: `(row, step, q, n) => level`.

---

## Working with the user

**Ask before big changes; don't ask about small ones.** "Rebuild the modulator" is worth two
clarifying questions. "Fix this bug" is not.

**When they report a bug, find the actual cause — don't pattern-match to the symptom.** Every
single bug in this project had a cause in a different place from where it appeared. Sliders
"not working" was an automation-timeline problem. The sample "reverting" was a second code
path. Read the code, form a hypothesis, and *verify it against the real data* before fixing.

**Tell them what was actually wrong.** "Fixed" teaches nothing. "The grid schedules automation
on the same param the slider assigns to, and once a param has automation, `.value` is ignored"
means they'll spot it themselves next time. This is the difference between a contractor and a
collaborator.

**Push back when they're wrong.** The user believed the Phaser and Wavefolder were in the
signal chain. They weren't — the Phaser had no input. Saying so, plainly, was more useful than
"fixing" the display to agree with them. But *also* fix the real problem underneath: the UI was
communicating "not in the path" in a way that looked identical to "switched off".

---

## Keeping this skill current

This skill is a living document. It is wrong the moment a better pattern exists and isn't in it.

**When you find a better way that supersedes something here:**

1. **Update the law in place** in the relevant file. The skill should always read as the
   current best practice, not an archaeology of past ones.
2. **Record the supersession in `CHANGELOG.md`**: date, what changed, what it replaced, and
   *why the new way is better*. The "why" is the point — a future reader needs to know whether
   the change still applies to their situation.
3. **Prefer replacement to accumulation.** If a rule is dead, delete it. A skill that only ever
   grows becomes a swamp nobody reads. Length is a cost.

**When you hit a new bug in this domain that isn't in `references/pitfalls.md`, add it** — in
the same symptom → cause → fix shape. The catalogue is the skill's real asset and it should get
denser with every project.

**Triggers to review this skill:** finishing a plugin; a bug that took more than an hour;
discovering a Web Audio API that obsoletes a workaround here; the user saying "we did this the
long way round".
