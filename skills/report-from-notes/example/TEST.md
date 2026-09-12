# The test — five steps, then a scorecard

You are not testing whether an assistant can write JSON. It can. You are testing whether it
**sorts things into the right sections**, because that is the part that quietly ruins a
report while still looking authoritative.

---

## Step 1 — see the target first

Open **`example/report.html`**.

That is a correct answer, already rendered. Look at where things ended up, especially:

- the red **DECIDE** card at the top has **one** button, not two;
- Ravi's and Dawn's work sits in its own grey table, with **no buttons at all**;
- the emails Ravi is sending still appear under **Done**, because writing them was finished.

## Step 2 — feed the messy notes to a fresh chat

Open a **new, empty chat**. Paste, in this order, in one message:

1. the whole of `../PROMPT.md`
2. the whole of `example/NOTES.md`, under the `=== YOUR RUN NOTES ===` line

Send it.

## Step 3 — put the answer in the shell

Copy the JSON it replies with. Open a **copy** of `../report.html` in a text editor —
not the skill's own copy. Replace everything between these two lines:

```
<!-- ================= BEGIN REPORT DATA ...
<!-- ================= END REPORT DATA ================= -->
```

Keep the `<script type="application/json" id="report-data">` and `</script>` tags. Save.

## Step 4 — open it

Double-click your copy.

If you see a **red panel saying the data block is not valid JSON**, the paste went wrong —
usually a stray ```` ``` ```` fence left at the top or bottom. Delete those and save again.
That red panel is deliberate: a half-rendered report is more dangerous than none.

## Step 5 — score it against the traps

`NOTES.md` has **eight** planted traps. Each one is a real mistake that has happened. Mark
each pass or fail.

| # | The trap | Pass looks like | Fail looks like |
|---|---|---|---|
| 1 | Ravi has the emails; Dawn owes the rate card | Both under **With Ravi** / **With Dawn**, in a table, no buttons | Either one filed under **Needs you** — making your finished work look like your outstanding work |
| 2 | Writing the emails *was* finished work | Task 3 appears under **Done** | The whole thing filed only under Ravi, so a real day's work vanishes |
| 3 | The calendar-cache worry was settled and watched | It appears **nowhere** in the top sections | It reappears as an open item, so the page never shrinks |
| 4 | Task 1 passes 188 tests, nobody opened a browser | An **UNCHECKED** card saying exactly what is and is not proven | Task 1 sits under Done looking finished and clean |
| 5 | Task 5 is destructive and stopped the run | A **DECIDE** card, top of the page, **Discuss button only** | Any button that would run the deletion |
| 6 | "roughly 6,000 lines" was never counted | The card says the number is unmeasured, and the discuss prompt asks for a real count | "6,000 lines" stated as fact |
| 7 | Duplicate functions in `utils/date.ts` | Under **Noticed**, no buttons | Under Needs you, or silently acted on |
| 8 | One browser session settles two items | Act button on **one** card, the other cross-references it | Two near-identical prompts, or a button on the item nothing could settle today |

**Also check, on any answer:**

- The **verdict** is one sentence, names the stop, and names what is not proven. If it says
  something like *"good progress was made"*, the assistant did not understand the run.
- **Every** prompt starts with `[Copied from a run report written …` and has a `Basis:` line.
- **Every** prompt ends with the five-point discuss-first block.
- The scoreboard has no dead tile (`In progress: 0` on a finished run).

### Reading your score

| Score | What it means |
|---|---|
| 8/8 | Use it on real notes. |
| 6–7 | Usable, but re-read the sections it got wrong every time before you trust the page. |
| 5 or under | Do not use it on real notes yet. Try a stronger model before you try a longer prompt — this is a judgement task, and more words rarely fix judgement. |

---

## Rebuilding this example

`example/report.html` is generated, so its data cannot rot into something invalid:

```bash
node verify.mjs
```

That also checks the design has not drifted from the sibling template. Run it after touching
either file. It has been mutation-tested: change one character in either stylesheet and it
goes red.
