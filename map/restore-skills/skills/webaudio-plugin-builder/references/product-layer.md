# The product layer

A working instrument is not a product. This file is the distance between the two, paid for
on the Nebula2 pair (sampler + drum machine): what a plugin must ship with, the code
patterns that deliver each piece cheaply, and the *process* that got two plugins done
without going in circles. Read this when a build works and the job is to finish it — or
when starting plugin #2 and you want #1's spine without #1's detours.

## Contents

- [The workflow that worked](#workflow)
- [The ship checklist](#checklist)
- [Persistence that survives a double-click](#storage)
- [Session restore](#session)
- [Versioned schema + migration](#migration)
- [Replace-without-losing-work](#replace)
- [A/B compare](#ab)
- [MIDI in + MIDI learn](#midi)
- [Master bus: limiter + meters + latency](#master)
- [Small wins: tap tempo, UI scale, shortcuts sheet](#small)
- [Porting the layer to a sibling plugin](#sibling)

---

<a name="workflow"></a>
## The workflow that worked (and the one that didn't)

**1. Audit before touching anything. Measure, don't vibe.** Grep for the state variables,
the setters, every `window.storage`/persistence call, every `.value =` on an AudioParam,
`pushHistory` coverage, and duplicated code paths. Produce a holds / broken / missing table
*first*. On Nebula2 this took ~20 minutes and prevented the biggest mistake available:

**2. Do not rewrite a working build. Evolve it.** The brief said "rebuild"; the audit showed
the engine already honoured the laws. A from-scratch rewrite would have lost polish and
reintroduced solved bugs. The right move was to keep the instrument and add the product
layer around it. Say this to the user explicitly — they asked for a rebuild, tell them why
they're getting an evolution.

**3. Patch with exact-anchor replacements, not freehand edits.** On a 5–7k line single file,
apply every change as a script (python heredoc) that does
`assert s.count(anchor)==1` before each replacement. A failed assert is a cheap early
warning that the file isn't what you think it is; a silent mis-edit costs an hour. Batch
related edits into passes (storage pass, files pass, master pass, controls pass).

**4. Verify at the four levels after every pass** (see `verification.md`): syntax → dangling
IDs → jsdom boot with a Web Audio stub → drive the actual feature in the DOM. The stub that
works: real objects with no-op methods (`mkParam`/`mkNode`/`mkCtx`), *not* a Proxy —
Proxies explode the first time the code does arithmetic on `sampleRate`.

**5. Prove the setter law by driving every writer.** One parameter, every writer that can
touch it — slider drag, typed value, preset recall, dice, undo, A/B, MIDI — dump stored
value and every view after each write. All must agree. This catches drift that reading the
code never will, and it is the proof the user actually wants to see.

**6. UI redesigns happen in a static mockup first, never in the working build.** Iterate the
look in a dead file (see `nebula-ui-kit.md` and `assets/nebula-preview.html`) — three or
four passes of user feedback cost minutes there and days in the live code. Only port the
system once the user says "this is the standard".

**7. Port to the sibling with a subagent + a reference implementation.** See
[below](#sibling).

**What went wrong, so it doesn't again:** large single file-writes can be silently
truncated by file sync (~43KB seam) — after writing a big file, check it ends with
`</html>` and count `</script>`; append the remainder rather than rewriting. Mounted
output folders may be write-once from the shell — build in `/tmp`, copy in, and request
delete permission when replacing.

---

<a name="checklist"></a>
## The ship checklist

Everything below, or a stated reason why not. This is the list a stranger's bad review is
written from:

- Persistence that works in a **double-clicked file** (not just a hosting artifact) — and
  full **session restore** on reopen.
- **Versioned schema + migration** for every preset/project format, written the same day
  as the field it protects.
- **Replace the source material without losing the work** (fractional remapping + an
  explicit keep/fresh choice when the material differs wildly).
- **A/B compare** with copy-across. **Undo ≥ 100 deep, preset recall = one step.**
- **MIDI in** (notes trigger, CCs learnable on every control, mapping list, persisted).
- **Master limiter** (on by default, bypassable) + **in/out meters** + **latency readout**.
- **Tap tempo**, and one transport setter that re-derives *every* tempo-synced time.
- **UI scale** (75/100/125/150%), persisted.
- **Shortcuts/contract sheet** on `?`; right-click menu (learn / clear / reset) on every
  control; relink prompt for missing files; human error messages; empty state that teaches.
- Export: if a person can make something in it, they can get it out (WAV, stems, MIDI).

Defensible cuts from the Nebula2 brief, with the defenses that were accepted: macro knobs
(the XY pad *is* a four-corner macro system), song mode (a loop instrument; chaining belongs
in the host), a dedicated sidechain source (the pump effect already is one).

---

<a name="storage"></a>
## Persistence that survives a double-click

The fatal bug this section exists for: presets saved via `window.storage` — a hosting-app
API that **does not exist when the file is opened from disk**. Every save silently vanished.
The fix costs nine lines and zero call-site changes, because the shim keeps the host API's
`{value}` contract:

```js
if(!window.storage){
  window.storage={
    get: async k=>{ try{ const v=localStorage.getItem("app-"+k); return v==null?null:{key:k,value:v}; }catch(_){ return null; } },
    set: async (k,v)=>{ try{ localStorage.setItem("app-"+k, String(v)); }catch(_){} }
  };
}
```

Prefix keys per app (`n2s-`, `n2d-`) so two plugins on one origin don't fight.

---

<a name="session"></a>
## Session restore

"Reopening restores the last session exactly." State → localStorage; bulky binary (the
loaded sample) → IndexedDB. Poll-and-diff beats change hooks — no plumbing through every
setter:

```js
let last="";
function tick(){ try{ const j=JSON.stringify(projectData(false));
  if(j!==last){ last=j; localStorage.setItem("app-session", j); } }catch(_){} }
setInterval(tick, 2500);
window.addEventListener("beforeunload", tick);
```

Boot order matters: `restoreSession()` runs **before** the default demo/kit load, and the
same `applyProject()` used by File ▸ Open does the applying — one code path (law 10).
If the IndexedDB sample is gone, load the demo *but keep the state*: the work survives even
when the audio doesn't. `decodeAudioData` detaches buffers — `.slice(0)` first.

---

<a name="migration"></a>
## Versioned schema + migration

```js
const PROJ_VERSION=2;
function migrateProject(p){
  let v=p.version||1;
  if(v<2){ p.limiterOn=p.limiterOn!==false; p.wavHash=p.wavHash||null; v=2; }
  p.version=v; return p;
}
```

Every load path calls it: File ▸ Open, session restore, preset import. Decide and *state*
what a preset contains. The line that held: section presets = parameters only, never audio;
projects embed the audio **by default** (browser files can't hold path references), with a
"light" save storing name + content hash → a **relink prompt** on open (Locate / Keep
current / Use demo), never a crash, never silent silence.

---

<a name="replace"></a>
## Replace-without-losing-work

The single most important file behaviour, and the one hobby builds get backwards. Positions
are **fractions of the slice/step count**, not seconds. On swap: capture the work, let the
normal load run, then remap:

```js
const remapS=v=> v<0? v : Math.max(0,Math.min(newN-1, Math.round(v/oldN*newN)));
order=Array.from({length:newN},(_,i)=>{
  const src=keep.order[Math.min(L-1,Math.round(i/newN*L))];
  return {...src, s:remapS(src.s)};
});
// grid lanes and loop cues resample the same way; undo/redo stacks are restored, not cleared
```

If the new material chops wildly differently (>1.6x either way), don't guess — a two-button
modal: **Keep my pattern / Fresh start**. And route *every* loader through the one commit
function — the Nebula2 demo loader had its own inline reset path, which is how the demo
bypassed all of this (pitfall 7's shape, again).

---

<a name="ab"></a>
## A/B compare

Nearly free once undo snapshots are honest: a slot = the undo snapshot + transport + master
+ rack dial values. Switching stores the live slot, applies the other; the copy button
copies the live slot across.

```js
function abSwitch(to){
  if(to===abCur) return;
  abStore[abCur]=perfSnapshot();
  if(abStore[to]) perfApply(abStore[to]);
  abCur=to; renderAB();
}
```

The prerequisite that usually isn't met: **the snapshot must represent everything that
pushes history** (pitfall 24). Extending `snapshot()` to carry FX + space state is what made
both A/B *and* "preset recall is undoable" one-line features.

---

<a name="midi"></a>
## MIDI in + MIDI learn

The payoff for the single-setter law: learn-on-everything costs ~120 lines total.
**CC writes dispatch through each control's own input handler** — the exact path the mouse
takes — so views follow and tempo-snapping still applies:

```js
function midiWrite(t,n){                     // n = 0..1 from d2/127
  if(t.kind==="rack"){ const el=q(`[data-dial="${t.id}"]`);
    const mn=+el.dataset.min, mx=+el.dataset.max;
    setRackDial(t.id, el.dataset.log==="1" ? mn*Math.pow(mx/mn,n) : mn+(mx-mn)*n); return; }
  const el=$(t.id), mn=+el.min||0, mx=+el.max||100;
  el.value=mn+(mx-mn)*n;
  el.dispatchEvent(new Event("input"));      // ONE path: the slider's handler IS the setter
}
```

Notes from C1 (36) trigger pads/voices via the same function the QWERTY keys use. Learn is
armed from a right-click context menu on any control (with Clear mapping and Reset to
default beside it); mappings persist through the storage shim; a modal lists and clears
them. Esc cancels learn.

---

<a name="master"></a>
## Master bus: limiter + meters + latency

Nothing ships that can blow up a monitor on a preset change. Every terminal connection —
main chain, rack out, rack-bypass dry path — lands on one bus:

```
everything → masterBus → [limiter −1.5dB brick] → analyser (meter tap) → destination
```

The limiter is a `DynamicsCompressor` (threshold −1.5, knee 0, ratio 20, attack 2ms,
release 120ms), ON by default, bypassed by rewiring around it — one `wireMaster()` owns the
topology. Build it inside the same `build(ctx)` the offline bounce uses, so **exports render
through the identical bus**. The meter draws from `getFloatTimeDomainData` at ~20Hz and
repaints **only when the displayed value changes** (key the frame on quantised peaks).
Latency honesty is free: `(ctx.outputLatency||ctx.baseLatency)*1000` in the meter tooltip.

---

<a name="small"></a>
## Small wins that read as professionalism

- **Tap tempo**: average the last ≤6 intervals, reset after 2.2s of silence, write through
  the BPM control's own handler so every synced time follows.
- **UI scale**: `document.body.style.zoom = scale/100`, four stops, persisted. Two lines,
  and 4K-laptop users notice.
- **Shortcuts + contract sheet**: one HELP entry listing the keys *and* the control
  contract (drag / shift-fine / double-click default / click-to-type / right-click learn).
  Bound to `?` and a menu item.
- **Preset recall pushes history.** One `pushHistory()` in each recall handler — but only
  works if snapshots carry what presets change (see A/B).

---

<a name="sibling"></a>
## Porting the layer to a sibling plugin

Two plugins, one session, no circles — this is the recipe:

1. Finish plugin #1 completely, laws proven.
2. Spawn a subagent whose prompt contains: the skill paths to read, the sibling's source
   path, **the finished plugin #1 as the reference implementation** (named searchable
   section markers: `PRODUCT LAYER`, `MASTER BUS`, `A/B COMPARE`…), the working jsdom
   stub/test harness paths, the audit-first method, and the exact deliverables.
3. Require the same four-level verification and the same law proof; require a report of
   holds/broken/missing *before* changes.
4. The sibling will have its own bugs in the same classes — the drum machine's undo
   couldn't represent morph gestures, and its style switch wrote `bpm=` directly, skipping
   the setter and leaving the rack echo at the old tempo. The audit finds these because the
   classes are now known.

Shared UI comes from the same tokens and components (`nebula-ui-kit.md`): identical header,
Space card, grid, morph pad, output rail and rack page on both instruments — "they work
exactly the same" is a structural outcome, not a styling one.
