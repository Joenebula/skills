# PROMPT.md — paste this whole file into the chat, then paste your run notes under it

Everything from the line below down to `=== YOUR RUN NOTES ===` is the instruction.
Under that marker, paste your raw notes. Send it. You get back one JSON block.

---

You are turning a messy set of build-run notes into one JSON object that fills a fixed
report page. The page's styling and layout already exist and you never touch them.

## What you output

**A single JSON object, and nothing else.** No preamble, no "here you go", no explanation
after it, no markdown code fence. The first character you emit is `{` and the last is `}`.
If you cannot do part of the job, say so *inside* the JSON — in the verdict — rather than
outside it.

If any field would contain the characters `</script>`, write `<\/script>` instead.

## The eight rules that decide what goes where

These matter more than the schema. A well-formed JSON that files things in the wrong
section is worse than useless, because it looks authoritative.

1. **This page is a worklist, not a record.** It lists only what is still outstanding. If
   the notes say something was resolved, it does **not** appear in the top sections. Do not
   tick it, do not strike it through, do not add a "resolved" section. The length of the
   page is how much is left to do.

2. **Only drop an item when the notes say its resolution was observed.** The decision was
   answered; the check actually ran and was seen to pass; the assumption was confirmed. If
   the notes only imply it is probably fine, it **stays**. Turning "not checked" into
   "checked" is the single worst thing you can do to this page.

3. **"Needs you" means the reader, and nobody else.** This is the rule most often broken.
   Work waiting on a client, a colleague, a supplier or an account holder is **not**
   outstanding for the person reading — their part is finished. It goes in `withThem`,
   under the name of whoever actually holds it. Ask of every item: *outstanding for whom?*
   If the answer is not the reader, it does not belong in their list.

4. **The work that produced a handover still goes in `done`.** Writing three emails is
   finished work even though sending them is somebody else's. Both facts are true and they
   live in different sections. And if the reader still owes that person something before
   they can move — an answer, a file, a decision — *that part* is genuinely the reader's
   and gets its own item in `needsYou`.

5. **A check that did not run is never reported as passed.** If the notes say the code
   compiles and the tests pass but nobody opened it, that is an `unchecked` item. Say
   precisely what *is* proven, then precisely what is not, and why it could not be proven
   automatically.

6. **Never invent.** No number, command, file name, date or outcome may appear in the JSON
   unless it is in the notes. If something important is missing, say so in the verdict —
   "the notes do not say whether the migration ran" is a useful sentence. A plausible
   guess is not.

7. **Every section stays, even when empty.** Just send an empty array. The page prints its
   own empty state.

8. **The verdict is one sentence and it is the hardest line to write.** What this run did,
   and the single biggest thing that is *not* proven. It exists because the most important
   fact about a run is otherwise spread across five cards and never stated once.
   - Good: *"The rack is gone — 5,075 lines and 48 settings — and nothing in this run has
     been opened, listened to, or loaded by a real host."*
   - Bad: *"Good progress was made on the strip-down."* Says nothing, proves nothing.

## The five labels

| Label | Use it when | `tone` |
|---|---|---|
| `DECIDE` | Work has **stopped** and cannot continue until the reader answers. Something destructive, a new dependency, or a genuine fork in the road. | `decide` |
| `BLOCKED` | One task got stuck, so it was parked and the rest of the run carried on around it. | `blocked` |
| `ASSUMED` | A call was made without asking because it was cheap and reversible. Say how easily it can be undone. | `assumed` |
| `UNCHECKED` | Built, but something was not verified — and why. | `unchecked` |
| `IDEA` | Noticed and deliberately not done, so the run does not drift. | `idea` |

`DECIDE` and `BLOCKED` go in `needsYou`, riskiest first. `ASSUMED` goes in `needsYou`
after them. `UNCHECKED` goes in `unchecked`. `IDEA` goes in `ideas`.

## Writing the copy-prompts

Every item in `needsYou`, `unchecked` and `next` carries at least one button. The button's
`prompt` is a block of text the reader copies and pastes into a **brand new chat that has
never seen this run**. It must therefore stand completely alone: name the full project
path, the branch, and tell the receiving chat to read the notes file first.

Each prompt has three parts, in this order, and none of them is optional.

**Part 1 — the freshness stamp.** First, always. A report overwrites itself; a clipboard
does not. Someone copies a prompt, sits on it for an hour, and pastes it after the thing
was already done.

```
[Copied from a run report written DAY DATE, TIME.
Basis: WHAT THIS PROMPT RESTS ON.
If time has passed this may already be out of date: read NOTES-FILE first and tell me if
this has already been done or overtaken. Do not act on a stale instruction.]
```

The **Basis** line is the half that is tempting to fudge. It says in one line what the
prompt actually rests on. Write the honest one:
- a **transcription** — *"task 4's done-when verbatim, plus the two gotchas in the notes"* —
  means the reader already approved this plan;
- an **invention** — *"my own reading; nothing in the notes covers this"* — means the
  approach was made up on the spot and reviewed by nobody.

Until this line existed the two looked identical on the page.

**Part 2 — the job.** What to do, in plain English, with every fact the receiving chat
needs: what must not be deleted, the mistake already made twice, the gate that decides
done. That is what stops the next session repeating them.

**Part 3 — the discuss-first block.** Last, always, verbatim, on every prompt including the
ones that only ask a question:

```
Before doing any of it, stop and tell me:
  1. what you understand the job to be, in one line
  2. exactly what you would change - every file, and what happens to each
  3. what is WRONG with this prompt itself - it was written in one pass by a session
     with less context than you have now, and nobody reviewed it. Name at least one
     thing you would do differently, or say explicitly that you checked and found
     nothing worth changing
  4. anything in the notes you think is wrong - check it, don't take it on trust, it
     was written by a previous session that made mistakes
  5. what could go wrong, and what the undo is

Then WAIT. Do not edit, delete, build, install or commit until I reply "go".
If I reply "go" with conditions attached, those conditions win over anything above.
```

### Which items get which buttons

**Discuss** (`"kind": "discuss"`) is primary, always first, always present. Its prompt talks
the item through and **changes nothing** — end its Part 2 with *"do not edit, delete, build,
install or commit anything in this reply."*

**Act** (`"kind": "act"`) is second. Label it with the real verb — *"Change it"*, *"Check
it"*, *"Run task 4"* — never a generic *"Copy prompt"*, because a generic label is how the
wrong button gets clicked. Add it **only when both** of these hold:

- there is one unambiguous action, **and**
- the Basis line honestly reads as a *transcription*, not an invention.

Nothing the reader never agreed to should be one click from running.

| Item | Buttons |
|---|---|
| `DECIDE` | **Discuss only.** Nothing has been decided, so there is nothing to act on. The item that deletes the most is the item with no button that deletes anything. |
| `BLOCKED` | Discuss only, unless the notes show the fix is already agreed. |
| `ASSUMED` | Both. Act = *"Change it"*, written as if the reader disagrees — that is the only reason they will click it. |
| `UNCHECKED` | Both. Act = *"Check it"*: one step at a time, waiting after each, saying what to look at and what *wrong* looks like, and refusing to claim any step passed until the reader reports what they saw. |
| `next` | Both. Act = *"Run task N"*. |
| `IDEA` | No buttons. |

Two more, both learned the hard way:

- If nothing the reader could do today would settle an item, give it **no** act button and
  say so in `meta`: `"**No button** — nothing you could do today would settle it"`. A
  button that cannot help is noise; a missing button with no explanation looks like an
  oversight.
- If **one** session would settle several items, put the act button on **one** of them and
  cross-reference from the others in `meta`: `"Settled by: **Check it** on the card above"`.
  Three near-identical prompts is not three times the help.

## The schema

Text fields take two bits of markdown and nothing else: `**bold**` and `` `code` ``.

```jsonc
{
  "project":    "short name, used in the browser tab",
  "headline":   "what this run is doing, in the reader's words — not the branch name",
  "kicker":     "Run report",
  "updated":    "Thursday 28 August 2026, 09:40",
  "resumed":    3,                 // optional, omit if unknown
  "branch":     "strip-effects",   // optional
  "startedFrom":"eb905e6",         // optional, the save point it started from
  "notesFile":  "notes/RUN-NOTES.md",  // optional, linked at the foot of the log

  "verdict": {
    "tone": "amber",               // amber = something unproven (the usual)
                                   // green = everything built was checked and seen to pass
                                   // red   = work has HALTED and needs the reader
    "lead": "ONE SENTENCE:",       // optional bold opener
    "text": "..."
  },

  // 4 to 6 tiles. "Needs you" and "Not checked" are ALWAYS present, even at 0.
  // Drop any tile whose number is meaningless — "In progress: 0" on a finished run is a
  // dead tile that teaches the reader to skim the row. The last tile is the run's own
  // headline number: tests passing, lines removed, pages built, records migrated.
  "scoreboard": [ { "n": "7", "l": "Done", "tone": "green" } ],   // tone: green|amber|red|""

  "needsYou": [ /* item */ ],
  "withThem": [ { "holder": "Sarah",
                  "rows": [ { "what": "short, does not wrap",
                              "detail": "what they do with it, what they need from you, and WHEN it went to them — 'sent 19 Aug' — so a thing sitting for a month looks different from a thing that went yesterday" } ] } ],
  "unchecked":[ /* item */ ],
  "next":     [ /* item */ ],
  "done":     [ /* task */ ],
  "ideas":    [ /* item, no buttons */ ],
  "log":      [ /* task — the setup entry, then anything not already under done */ ]
}
```

**item**

```jsonc
{
  "tag":   "DECIDE",            // or BLOCKED / ASSUMED / UNCHECKED / IDEA / "TASK 4"
  "tone":  "decide",            // decide|blocked|assumed|unchecked|idea|next
  "title": "one line: for a DECIDE, phrased as what it costs the reader",
  "status": { "text": "— in progress", "tone": "amber" },   // optional; tone amber|green|grey
  "body":  "What is at stake, in plain English. What the undo is, honestly — 'recoverable from the save history but not from the running app' is a real answer; 'reversible' alone is not.",
  "meta":  [ "Blocks: `task 4`", "Undo: how" ],
  "buttons": [
    { "kind": "discuss", "label": "Discuss it", "hint": "lays out the options, changes nothing", "prompt": "..." },
    { "kind": "act",     "label": "Check it",   "hint": "…and this one walks you through checking it", "prompt": "..." }
  ]
}
```

**task** (used by `done` and `log` — a collapsed row that opens)

```jsonc
{
  "num":  "4",
  "pill": "done",               // done | prog | pend   (pend prints as "Setup")
  "name": "what it achieved, in the reader's terms",
  "sections": [
    { "h": "What changed", "p": "plain English" },
    { "h": "What was planned, and what happened", "p": "ONLY when they differed. Silence here means they matched." },
    { "h": "Commands run, and what they actually printed", "pre": "suite   -> ALL PASS" },
    { "h": "One thing went wrong", "p": "only if something did — what broke, why, and the rule adopted so it does not recur" },
    { "h": "Not checked", "p": "repeat the unchecked item here so the evidence and its caveat travel together" }
  ]
}
```

In a `pre`, the words `PASS`, `ALL PASS`, `FAIL` and `ERROR` are coloured for you. Put the
**real** output in there, not a summary of it.

---

=== YOUR RUN NOTES ===

<!-- paste your raw notes below this line -->
