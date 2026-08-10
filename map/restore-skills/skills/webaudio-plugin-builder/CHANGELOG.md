# Changelog

This skill is a living document. It is wrong the moment a better pattern exists and isn't in it.

## How to update it

When you find a better way that supersedes something here:

1. **Update the rule in place** in the relevant file. The skill should always read as the
   *current* best practice — not an archaeology of past ones.
2. **Record it below**: date, what changed, what it replaced, and **why the new way is
   better**. The "why" is the point: a future reader needs to judge whether the change applies
   to their situation.
3. **Prefer replacement to accumulation.** If a rule is dead, delete it. A skill that only
   grows becomes a swamp nobody reads. Length is a cost.

When you hit a new bug in this domain that isn't in `references/pitfalls.md`, add it in the
same *symptom → cause → fix* shape. The catalogue is the skill's real asset; it should get
denser with every project.

**Review triggers:** finishing a plugin · a bug that took more than an hour · a Web Audio API
that obsoletes a workaround here · the user saying "we did this the long way round".

---

## Entries

### 2026-07-13 — v1.0, distilled from SliceForge

First version. Built from a complete sample-slicer plugin: 16-row effect grid, modular patch
rack with real cables, tempo detection, five preset banks, transport, help system.

Everything in `references/pitfalls.md` (18 entries) is a bug that actually happened and cost
real time. The highest-value entries, in order:

1. **Pitfall 1 — the AudioParam automation law.** Cost the most, by far. Presented as "the
   sliders don't work", which points nowhere near the cause. If this skill only ever teaches
   one thing, this is it.
2. **Pitfall 2 — zero must mean zero.** Two separate violations, both introduced as
   "helpful" features.
3. **Pitfall 6 — metadata is a hint, the data is the evidence.** Double-speed playback from a
   filename parser that grabbed the wrong number and was trusted absolutely.
4. **Pitfall 7 — two code paths diverge.** A "reverted" file that had never changed.
5. **Pitfall 12 — animate the footprint, not `display`.** The reason panels snap instead of
   sliding.

**Superseded during the build itself** (recorded because the reasoning is instructive):

- *A linear walk to find live modules* → **two reachability sweeps**. The linear walk was
  simpler and wrong on any branching patch. Correctness cost about six lines.
- *A "Sample B" second-sample modulator* (vocoder/ring-mod/convolver) → **removed entirely**.
  Three rounds of fixes made it correct without making it good. The lesson generalised into
  SKILL.md law 11: cut features that don't earn their place. Nursing is more expensive than
  cutting.
- *Delay time in milliseconds* → **note divisions derived from BPM**. Milliseconds are never
  right for anything rhythmic, and the bug is invisible until you change the tempo.
- *Grid cells as an independent amount* → **grid cells as a gate on the panel amount.** The
  original design was defensible in the abstract and confusing in the hand.

**Open questions for the next build** — things not solved here, flagged honestly:

- No test harness for *audio output* itself. Everything is verified structurally (does it
  load, is it in time, does the number land on the grid). Whether it *sounds* right is still
  a human ear. A regression test that renders offline and compares spectra would be a genuine
  advance — if you build one, add it to `references/verification.md` and note it here.
- `OfflineAudioContext` rendering for export was used but not deeply exercised. Expect
  surprises with worklets in offline contexts.
- The UI kit is desktop-first. A touch-first control surface (dials especially) is unsolved.


## 2026-07-13 — the Nebula2 pair: product layer, dark UI kit, six new pitfalls

Shipped a sampler + drum machine to commercial standard from working sketches, then
redesigned their UI through four feedback passes. What changed in the skill:

- **New: `references/product-layer.md`.** The instrument/product gap, closed: the ship
  checklist (persistence in a double-clicked file, session restore, versioned schema +
  migration, replace-without-losing-work, A/B, MIDI learn, master limiter/meters, tap
  tempo, UI scale, shortcuts sheet), each with the working pattern. Also the *process* that
  avoided circles: audit-first with a holds/broken/missing table, evolve-don't-rewrite,
  exact-anchor patch scripts with count asserts, four-level verification per pass, the
  multi-writer law proof, and the sibling-port-via-subagent recipe (finished plugin #1 as
  the reference implementation). Why: every one of these was requested or hit on Nebula2,
  and none of it was in the skill.
- **New: `references/nebula-ui-kit.md` + `assets/nebula-preview.html`.** A second visual
  language — dark boutique (Echoform-class cards, machined SVG knobs with tick rings and
  bevelled caps, recessed screens, kaos-pad card, rack-as-a-page, per-cable gradients) —
  as a living HTML spec. The light hardware kit remains; pick one per project. Why: the
  original kit couldn't produce the commercial-reference look the user wanted, and the
  four mockup passes (flat→depth→fit→screens) are repeatable.
- **New pitfalls 19–24**: presets vanish in standalone files (host storage API shimmed with
  the same `{value}` contract); label column drifts from canvas lanes (builders must size
  what they build); knobs bleed into neighbours (grid with explicit columns, never
  squeezed flex); BPM retunes one delay but not the other (one transport setter re-derives
  every synced time); undo no-ops for some gestures (everything that pushes history must be
  representable in the snapshot); preset import drops parameters (one schema for both ends
  of a format).
- **SKILL.md**: added the evolve-don't-rewrite law, and routed the reading order through
  the two new references. Superseded nothing — the existing laws all held in practice;
  law 10 (two code paths diverge) caught its third and fourth instances (a demo loader
  bypassing the commit path, and a style switch bypassing the transport setter).
