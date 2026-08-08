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

### 2026-07-15 — v1.1, learnings from Nebula2

Built a breakbeat instrument (chopped-sample layer + synthesised drum machine on one shared
clock, shared FX grid + modular rack, 3-strip mixer console) that shipped, but with far more
back-and-forth than it should have. Added pitfalls 19–26 to `references/pitfalls.md`, all paid
for in real turns. The through-line: **most of the churn was UI/rendering, not DSP** — the DSP
we could verify blind (EQ curve from biquad coefficients, crush anti-alias band energy, drum
synthesis finiteness, MIDI byte-validity, offline-render math) landed first-try; the UI cost
turns because we trusted browser primitives and iterated live instead of mocking first.

Net new rules folded into SKILL.md's build order (see the "Own the pixels" and "Mock before you
build" notes after step 4): **own the pixels for anything visual, including the value model
under a skinned control, not just its paint** — a custom SVG knob drawn over a hidden native
`<input type=range>` still inherits every native-range quirk, and multiplies across engines the
moment the same UI needs to run in more than one WebView (pitfall 19); **mock-before-build for
non-trivial UI** (pitfall 23); **delete what you supersede in the same change** (pitfall 20);
**one component per job** (pitfall 21).

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
