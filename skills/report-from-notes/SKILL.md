---
name: report-from-notes
description: >
  Turn messy build-run notes into one readable HTML page — what still needs the reader,
  what was handed to someone else, what was built but never actually checked, and what is
  finished. Use when the user asks to "turn my notes into a report", "make this readable",
  "write up the run", or wants a status page they can open and share. Also use when they
  want that page produced somewhere with no tool access, by pasting into a plain chat.
  Do NOT use to run build work — this only sorts and writes; it never edits code, runs a
  test, or verifies anything.
---

# Report from notes

Notes are written in the order things happened. That is the wrong order for reading. The
reader wants to know one thing: **what is still mine to do?** — and notes never say.

This turns a notes file into a page that answers that, using a **fixed design** so every
report looks the same and nobody has to relearn the layout.

## Two ways to run it

**Here, with tools.** Read the notes, do the sorting yourself, write the JSON, paste it into
`report.html`. The rules you sort by are in `PROMPT.md` — read that file in full first. It
is the single source of truth for the rules; this file does not repeat them.

**Anywhere else, by pasting.** Hand the user `PROMPT.md` and tell them to paste it into a
fresh chat with their notes underneath. They get back JSON and paste it into `report.html`
themselves. Use this when the notes live somewhere you cannot reach, or when the user wants
the report produced without any tooling at all.

Both routes produce the same page from the same rules. The design never passes through a
model in either one.

## How the page is filled

`report.html` holds the whole design — every byte of CSS, the layout, the buttons, the
legend. It never changes. Near the bottom it has one block:

```
<!-- ================= BEGIN REPORT DATA ... -->
<script type="application/json" id="report-data">
  ...
</script>
<!-- ================= END REPORT DATA ================= -->
```

Everything between those two markers is replaced. Nothing else in the file is touched, ever.
If it is edited, two reports stop looking alike, which is the one thing a fixed design exists
to prevent.

Bad JSON does not half-render the page. It prints a red panel saying so, because a report
that is quietly missing a section is more dangerous than no report.

## Copy it into the project

The report belongs beside the notes it describes, not in this folder:

```bash
mkdir -p notes && cp report.html notes/REPORT.html
```

From then on, `notes/REPORT.html` is the live one. Rewrite its data block at the end of
**every task**, not only when the run stops — a page written once at the start and then
frozen shows "0 done" all run, and the reader concludes their finished work never
registered. That has happened.

## The one rule that is not in PROMPT.md

**Every removal is recorded in the notes file**, one line, dated:

```
> REMOVED: browser round-trip check - ran it, all three tabs correct (9 Aug)
```

The page is a worklist, so dealt-with items are deleted from it. The notes file is
append-only, so nothing is ever deleted from there. Without that line, *"I dealt with it"*
and *"it was quietly dropped"* look identical afterwards.

## Try it before trusting it

`example/` holds a scored test: messy notes with eight planted traps, and a worked answer.
Run it once before pointing this at real work — `example/TEST.md` has the five steps and the
scorecard.

It ships as a **separate download**, so it is often simply not there. That is not a fault;
the skill works without it. If it is missing and the user wants to test, tell them the test
pack is a separate file.

## Keeping the design honest

The design in `report.html` is shared with `keep-going/report-template.html`. They are the
same 155 lines of CSS, in two files, which is exactly how two files start disagreeing.

```bash
node verify.mjs
```

That rebuilds the worked example and **fails loudly** if the two stylesheets have drifted
apart. Run it after touching either one. It is a smoke alarm, not a fix — the real fix is
one stylesheet, and that means an approved edit to the other skill.

Both halves skip cleanly when the file they compare against is not installed, so this is
safe to run anywhere.

## What this cannot do, said plainly

- **It does not read code.** Every fact in the report comes from the notes.
- **It verifies nothing.** It sorts and writes. It never runs a test or opens a browser. An
  item is "not checked" because the notes said so.
- **The prompts it writes are unreviewed first drafts.** That is why every one of them ends
  with the discuss-first block, and why point 3 of that block asks the receiving chat what is
  wrong with the prompt itself.
- **Nothing stops a chat ignoring that block.** What actually prevents an edit is the user's
  own approval settings, not a sentence in a prompt.
