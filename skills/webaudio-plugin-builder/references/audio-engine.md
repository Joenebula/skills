# The audio engine

Patterns that work, in the order you'll need them. Each has been through a real build.

## Contents

- [The spine](#spine)
- [Context lifecycle](#lifecycle)
- [Parameter writes — the one law](#params)
- [The lookahead scheduler](#scheduler)
- [Visual sync](#visual)
- [Voice management](#voices)
- [The effect chain](#chain)
- [Reorderable chains](#reorder)
- [A patchable graph](#graph)
- [Tempo: detection and sync](#tempo)
- [Sends and parallel busses](#sends)
- [Worklets vs ScriptProcessor](#worklet)
- [Neutral values and mute](#neutral)

---

<a name="spine"></a>
## The spine

Every plugin in this domain is the same shape:

```
SOURCE  ──►  CHAIN  ──►  OUTPUT
   ▲           ▲
   └── CLOCK ──┘
```

- **Source** — slices (sampler), oscillators (synth), one-shots (drum machine), a stream.
- **Chain** — serial effects, in a user-reorderable order.
- **Output** — master gain → limiter → destination.
- **Clock** — a lookahead scheduler driving both the source and any parameter automation.

Sends (reverb, delay) hang off the chain in parallel. A patch rack replaces the fixed chain
with a graph. Everything else is detail.

---

<a name="lifecycle"></a>
## Context lifecycle

An `AudioContext` cannot be created before a user gesture on mobile — but you still need to
decode and draw audio at boot. Use an `OfflineAudioContext` until the user actually plays
something:

```js
let ctx = null, decodeCtx = null;
function dctx() {                       // for decoding + drawing, no gesture needed
  if (ctx) return ctx;
  if (!decodeCtx) decodeCtx = new OfflineAudioContext(2, 1, 44100);
  return decodeCtx;
}
function ac() {                         // the real one; call on any user interaction
  if (!ctx) { ctx = new AudioContext(); buildGraph(ctx); initWorklet(ctx); }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
```

Call `ac()` at the top of every user-initiated handler. It's idempotent and cheap.

---

<a name="params"></a>
## Parameter writes — the one law

**Read pitfall 1 before writing any parameter code.** Summary: once an `AudioParam` has an
automation timeline, `.value = x` is silently ignored forever.

One function. Everything goes through it.

```js
const setParam = (p, v, tc = 0.02) => {
  if (!p) return;
  try {
    p.cancelScheduledValues(ctx.currentTime);
    p.setTargetAtTime(v, ctx.currentTime, tc);
  } catch { try { p.value = v; } catch {} }
};
```

**Scheduled gestures** (a sequencer firing an effect on a step) are the exception that proves
the rule — they *are* automation, so they compose correctly:

```js
// a momentary dive that returns to the user's setting
p.cancelScheduledValues(t);
p.setValueAtTime(peak, t);
p.exponentialRampToValueAtTime(restingValue(), t + span * 0.92);
```

Note `exponentialRampToValueAtTime` cannot target 0 — clamp to a small positive number.

---

<a name="scheduler"></a>
## The lookahead scheduler

Never schedule audio from `requestAnimationFrame` or `setTimeout` alone — they're not precise
enough. The standard pattern: a coarse timer that schedules *ahead* on the audio clock.

```js
let step = 0, nextTime = 0, timer = null;

function scheduler() {
  const c = ac();
  while (nextTime < c.currentTime + 0.1) {        // 100ms lookahead
    const pos = loopIn + (step % regionLength());
    const swung = pos % 2 ? swing * stepDur() * 0.5 : 0;
    const t = nextTime + swung;

    let st = applyGridToStep(mutate(order[pos], pos), pos, t);   // effects layer
    playStep(st, t);                                             // schedule audio AT t
    setTimeout(() => flash(pos), Math.max(0, (t - visualNow()) * 1000));   // schedule the light

    nextTime += stepDur();
    step = (step + 1) % Math.max(1, regionLength());
  }
}

function start() { playing = true; step = 0; nextTime = ac().currentTime + 0.06;
                   timer = setInterval(scheduler, 25); animate(); }
function stop()  { playing = false; clearInterval(timer); stopAllVoices(); drainTails(); }
```

`stepDur()` derives from BPM and division — never a stored constant:

```js
const stepDur = () => (60 / bpm) * (4 / division);
```

---

<a name="visual"></a>
## Visual sync

The playhead must follow the **audio** clock, not the wall clock, and must compensate for
output latency or it will run visibly ahead of what you hear.

```js
const outLatency = () => ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
const visualNow  = () => ac().currentTime - outLatency();

function animate() {
  if (!playing) { draw(); return; }
  const len = regionLength(), sd = stepDur();
  const origin = nextTime - step * sd;              // when step 0 of this cycle played
  let elapsed = (visualNow() - origin) / sd;        // in steps
  elapsed = ((elapsed % len) + len) % len;
  draw(loopIn + elapsed);                           // fractional step index
  requestAnimationFrame(animate);
}
```

---

<a name="voices"></a>
## Voice management

```js
const voices = new Set();
function register(src) { voices.add(src); src.onended = () => voices.delete(src); }
function stopAllVoices() {
  voices.forEach(v => { try { v.stop(); } catch {} try { v.disconnect(); } catch {} });
  voices.clear();
}
```

Every `createBufferSource()` gets registered. Without this you cannot stop sounds you already
scheduled — see pitfall 9.

**Choke groups** (hi-hat closing an open hat): keep `chokeGroup → currently-sounding gain`, and
ramp the previous one down fast when a new one starts.

**Fit modes** are worth building in from the start — what happens when a slice is longer than
its step:

- **Gate** — hard-cut to the step length. No overlap, no pile-up.
- **Stretch** — granular time-stretch to fit. See below.
- **Free** — let it ring. Voices pile up and the sum clips. Offer it, but don't default to it.

**Granular stretch** — overlapping windowed grains:

```js
function playStretched(buf, offset, inDur, outDur, when, rate, vol, dest) {
  const grain = 0.10, hopOut = grain * 0.5;
  const stretch = outDur / inDur, hopIn = hopOut / stretch;
  for (let i = 0; i < Math.ceil(outDur / hopOut); i++) {
    const tOut = when + i * hopOut;
    let posIn = offset + i * hopIn;
    const g = ctx.createBufferSource(); g.buffer = buf; g.playbackRate.value = rate;
    const gn = ctx.createGain();
    g.connect(gn).connect(dest);
    gn.gain.setValueAtTime(0.0001, tOut);                     // cosine-ish window
    gn.gain.linearRampToValueAtTime(vol, tOut + grain * 0.5); //   so grains sum
    gn.gain.linearRampToValueAtTime(0.0001, tOut + grain);    //   without clicking
    register(g);
    g.start(tOut, posIn, grain + 0.01);
    g.stop(tOut + grain + 0.02);
  }
}
```

---

<a name="chain"></a>
## The effect chain

```js
function createChain(c) {
  const input = c.createGain();
  const pre   = c.createGain();                    // drive gain into the shaper
  const shaper = c.createWaveShaper(); shaper.oversample = "4x";
  const comp  = c.createDynamicsCompressor();
  const filt  = c.createBiquadFilter(); filt.type = "lowpass";
  const duck  = c.createGain();                    // sidechain/pump
  const post  = c.createGain();                    // master
  input.connect(pre).connect(shaper).connect(comp).connect(filt)
       .connect(duck).connect(post).connect(c.destination);
  return { input, pre, shaper, comp, filt, duck, post };
}
```

**Pump/sidechain without a kick** — schedule the duck envelope across the playback window:

```js
function scheduleDuck(g, startTime, lengthSec) {
  const amt = pump / 100;
  g.gain.cancelScheduledValues(0);
  if (amt <= 0) { g.gain.setValueAtTime(1, startTime); return; }
  const beat = 60 / bpm, depth = 1 - amt * 0.85;
  for (let i = 0; i < Math.ceil(lengthSec / beat) + 1; i++) {
    const t = startTime + i * beat;
    g.gain.setValueAtTime(depth, t);                        // slam down on the beat
    g.gain.exponentialRampToValueAtTime(1, t + beat * 0.85);// breathe back up
  }
}
```

Re-arm it whenever the transport starts or the amount changes.

---

<a name="reorder"></a>
## Reorderable chains

If the user can drag effect rows to reorder the chain, the audio must follow. Keep the order
in the row list and rewire on change:

```js
function rewireChain() {
  nodes.forEach(n => { try { n.disconnect(); } catch {} });
  let prev = input;
  rows.filter(r => r.on && r.chain).forEach(r => { prev.connect(node(r.id)); prev = node(r.id); });
  prev.connect(post);
}
```

Only some rows are chain nodes; the rest are per-step modifiers. Mark them (`chain: true`).

---

<a name="graph"></a>
## A patchable graph (modular rack)

Cables are data. The audio graph is rebuilt from them.

```js
let cables = [];                                    // [{from:"eq:out", to:"flt:in"}]

function repatch() {
  MODULES.forEach(m => { try { M[m].out.disconnect(); } catch {} });
  const rackLive = cables.some(c => c.to === "out:in") && !rackMuted;
  try { dryPath.disconnect(ctx.destination); } catch {}
  if (!rackLive) dryPath.connect(ctx.destination);  // nothing patched -> dry still reaches the speakers
  cables.forEach(cb => {
    const from = nodeFor(cb.from), to = nodeFor(cb.to);
    if (from && to) { try { from.connect(to); } catch {} }
  });
  markActive(); showPath();
}
```

**Liveness** — two sweeps, never a linear walk (pitfall 4):

```js
function reach(dir) {
  const seen = new Set([dir === "fwd" ? "src" : "out"]);
  for (let pass = 0; pass < 24; pass++) {
    let grew = false;
    cables.forEach(c => {
      if (c.to.endsWith(":cv")) return;             // CV is control, not audio
      const from = c.from.split(":")[0], to = c.to.split(":")[0];
      const [a, b] = dir === "fwd" ? [from, to] : [to, from];
      if (seen.has(a) && !seen.has(b)) { seen.add(b); grew = true; }
    });
    if (!grew) break;
  }
  return seen;
}
const live = intersect(reach("fwd"), reach("back"));
```

**A CV source is live when the module it modulates is live** — an LFO carries no audio but is
absolutely doing something.

**Master mute vs unpatch.** Offer both, and make the difference obvious. *Unpatch* is
destructive (rips every cable). *Master mute* drops the rack out of the sound and hands the
dry signal back, with every cable, dial and power state preserved. Users want the second one
far more often than the first.

**Cables are drawn on a fixed full-viewport canvas above everything** — `position: fixed;
inset: 0; z-index: 9999; pointer-events: none`. Any other container will eventually clip them,
hide them, or collapse them to zero size. Redraw on scroll, resize, container resize, and every
frame during any animation that moves the jacks.

---

<a name="tempo"></a>
## Tempo: detection and sync

### Detection

Three sources, combined — never one trusted absolutely (pitfall 6):

1. **Loop length.** A clean loop is a whole number of bars. This is the strongest evidence.
2. **The filename.** A hint. Gather *all* candidates, validate each against the duration.
3. **Onset autocorrelation.** A rough estimate from the audio; tolerate octave errors.

```js
function detectTempo(buf, name) {
  const dur = buf.length / buf.sampleRate;
  const rough = bpmFromOnsets(buf);
  const cands = [];
  for (const bars of [1,2,3,4,6,8,12,16]) {
    const bpm = (bars * 4 * 60) / dur;
    if (bpm < 60 || bpm > 200) continue;
    cands.push({ bpm, bars, sc: score(bpm, bars, rough), source: "loop length" });
  }
  for (const c of nameCandidates(name)) {           // includes digits glued to letters!
    const fit = fitsDuration(c.v, dur);
    if (fit <= 0) continue;                         // it cannot explain this loop — discard
    const bars = Math.round(dur / ((4 * 60) / c.v));
    cands.push({ bpm: c.v, bars, sc: score(c.v, bars, rough) + 2.2 * fit, source: "filename" });
  }
  cands.sort((a, b) => b.sc - a.sc);
  return cands[0] || (rough ? { bpm: rough, bars: 1, source: "onsets" } : null);
}
```

Score candidates on: proximity to a typical tempo (~120), roundness, tidiness of the bar count
(powers of two are far likelier than 7), and agreement with the onset estimate.

### Sync

**Never store milliseconds for anything rhythmic.** Store the division; derive the time.

```js
const DIVS = { "1/32":0.125, "1/16T":1/6, "1/16":0.25, "1/8T":1/3, "1/16.":0.375,
               "1/8":0.5, "1/4T":2/3, "1/8.":0.75, "1/4":1, "1/2T":4/3, "1/4.":1.5, "1/2":2 };
const divMs = d => (60000 / bpm) * DIVS[d];
const nearestDiv = ms => inRange().reduce((a, b) =>
  Math.abs(divMs(b) - ms) < Math.abs(divMs(a) - ms) ? b : a);
```

Snap on: dial drag, preset load, randomisation. Re-derive on BPM change. Display the note.

---

<a name="sends"></a>
## Sends and parallel busses

Reverb and delay hang off the chain in parallel, not in series:

```js
spaceIn.connect(convolver).connect(revWet).connect(spaceBus).connect(master);
spaceIn.connect(delayL); /* ... */
```

**Per-voice sends are more powerful than a bus send**, because the voice knows *what it is*.
That's how you drown only the snares in reverb while the kicks stay dry — a plain bus send
can't do it, because a bus doesn't know what's passing through it.

```js
if (spaceIn && (revMix > 0 || dlyMix > 0)) {
  let amt = 1;
  if (ghostFilter !== "all") amt = (classify(slice) === ghostFilter) ? 1 : 0;
  if (amt > 0) { const s = ctx.createGain(); s.gain.value = amt;
                 voiceGain.connect(s).connect(spaceIn); }
}
```

Do **not** raise the global wet per-step — that's the "reverb forever" bug. Raise the *send*.

**Impulse responses can be generated**, no files needed:

```js
function makeIR(c, seconds, character) {
  const rate = c.sampleRate, len = Math.floor(rate * seconds);
  const ir = c.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = character === "reverse" ? Math.pow(t, 2)          // swells backwards
                : character === "plate"   ? Math.pow(1 - t, 3.5)
                : Math.pow(1 - t, 2.2);
      d[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return ir;
}
```

---

<a name="worklet"></a>
## Worklets vs ScriptProcessor

`ScriptProcessorNode` runs on the **main thread** — it glitches whenever the UI is busy.
Prefer `AudioWorklet`, and load it from a Blob so the app stays single-file:

```js
const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
await ctx.audioWorklet.addModule(url);
URL.revokeObjectURL(url);
node = new AudioWorkletNode(ctx, "my-processor", { outputChannelCount: [2] });
```

If you must fall back to `ScriptProcessor`, **keep it out of the audio path entirely unless
it's actually doing something.** Splice it in only when its effect is non-zero, and splice it
out again when it isn't.

---

<a name="neutral"></a>
## Neutral values and mute

Every effect needs a neutral value, or "mute everything" cannot return to the dry sound:

```js
const NEUTRAL = { drive: 0, crush: 0, squeeze: 0, tone: 100, pump: 0, width: 100,
                  reso: 0, shatter: 0, revMix: 0, dlyMix: 0 };
```

Muting parks the effect at neutral and *remembers where it was*, so unmuting restores. The
audio engine never needs to know about muting at all — which is the point.

Note that Tone (100 = open) and Width (100 = neutral) have no natural zero. That matters when
you decide which sequencer rows can be gated by their amount and which are intrinsically
momentary — see pitfall 2.
