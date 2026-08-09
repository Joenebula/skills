---
name: keep-going
description: >
  Work continuously through an agreed queue of build tasks without stopping to ask
  "what's next?" — resuming cleanly across sessions from a queue file on disk. Use
  whenever the user says "keep going", "keep building", "carry on", "continue building",
  "don't stop", or asks to set up / add to / check the status of a build queue. Also use
  when the user wants a long unattended build run with safety gates, or asks to resume
  a run started earlier. Do NOT use for one-off tasks the user is watching in real time.
---

# Keep going

The user is not a developer. They are trusting you to build unattended and to stop at
the right places. Getting this wrong is expensive for them in a way it is not for you:
they cannot easily tell good output from confident nonsense, so the cost of a quiet
mistake is high and the cost of a stop is low. When genuinely torn, stop.

## Honest limits — state these once, don't oversell

A skill changes disposition, not the shape of a turn. You cannot run for hours
unattended. What this actually delivers: long uninterrupted stretches of work, then a
clean stop with the queue updated so the next "keep going" resumes with zero
re-explanation. Long runs also consume the user's usage allowance, so a run may end on
limits rather than on anything being wrong. Say so plainly if it happens.

## Two modes

**Pre-flight** — no `keep-going/QUEUE.md` exists in the project. Set the run up and stop
for approval.

**Resume** — the queue file exists. Read it, find the first task not yet done, carry on.
No re-planning, no re-asking, no summarising the previous session back at them.

Open a resume with a single line naming what you are about to work on — *Picking up:
tasks 4–7 (settings page, then the save button)* — then start. Do not wait for a reply.
This gives the user a chance to redirect before you get going without turning every
resume into another approval gate.

---

## Pre-flight (first run only)

Do not write any project code during pre-flight. The point is to catch a misread plan
for the price of a few minutes rather than a whole run.

1. **Agree the scope fence.** One named project folder. Everything outside it is off
   limits for the whole run. Confirm the exact path with the user.
2. **Snapshot.** Ensure a clean starting save point exists in that folder (commit any
   pending work, or note the current commit) so "put it back how it was" is always one
   instruction away. If the folder is not version-controlled, say so and offer to
   initialise it — without this the user has no undo.
3. **Discover skills** (see next section).
4. **Write `keep-going/QUEUE.md`** — the task list, in order, each with a plain-English
   *done when*.
5. **Show the user the plan and stop.** Numbered tasks, each with its done-when and the
   skills that will govern it. Flag anything you expect will need them. Wait for a go.
   Pre-flight is a stop, so write `REPORT.html` too — at this point *What's next* is the
   whole plan and *Needs you* is whatever the setup already turned up.

### Writing a good "done when"

This is the single most important part of the setup. Without it you decide at 2am what
counts as finished, which is exactly the guessing the user is trying to avoid.

Write it in the user's terms, not implementation terms:

- Good: *done when the settings page loads, saves changes, and works on a phone*
- Bad: *done when SettingsView is implemented*

If you cannot write a checkable done-when for a task, the task is too vague — split it
or ask.

---

## Skill discovery — do this fresh every single run

Never hardcode a list of the user's skills into this file or carry one over from earlier
in a session. The user edits and adds skills constantly; a stale mapping would let you
build against an old coding standard while reporting that the standard was applied.
That failure is worse than no check at all, because it is silently reassuring.

Every run:

1. List the skills directories available (user skills, plugin skills, public skills).
2. Read **only the frontmatter description** of each — cheap, a couple of lines each.
3. Decide which apply to the queued work.

Then, **immediately before doing work a skill governs**, read that full `SKILL.md` at
that moment. Do not rely on a read from earlier in the session — that is how a
superseded version sneaks through. If the user says mid-run that they have changed a
skill, re-scan straight away.

Record in the log which skills were loaded and each file's modification date, so the
user can verify a gate ran against current rules rather than take your word for it.

**Stop if:**
- A queued task clearly should have a governing skill and nothing matches. Do not
  proceed on general knowledge.
- Two skills contradict each other on the same point. Picking one silently is precisely
  the guess to avoid.

---

## The work loop

For each task in the queue:

1. Mark it `in progress` in `QUEUE.md`.
2. Read the governing skills in full, now.
3. Build it. Make surgical edits — do not rewrite existing files wholesale as a
   shortcut.
4. Check it (below).
5. Log what happened, tagging anything the report has to lift out (see Files to maintain).
6. Commit inside the scope fence, one commit per finished task, with a message a
   non-developer can read. Commits are save points and need no permission — they are
   local and publish nothing. **Never push, never touch remotes, never rewrite history.**
7. Mark it `done` and move to the next. Do not stop to report.

**Every few tasks, re-read the plan** against what has actually been learned. This
catches an early wrong assumption before it is baked into six more tasks.

### Checking

Two tiers, deliberately:

- **After every task** — check thoroughly, but only what that task touched: build,
  types, the relevant tests, and any governing skill's checks. Fast enough not to eat
  the run.
- **Before you stop** — run the complete set across everything, then write
  `REPORT.html`. Same safety as checking everything every time, far more actually built.

Running the full suite after every small change sounds safer but eats the run and
creates pressure to cut corners to show progress. Don't.

**A check that did not run is never reported as passed.** If no tests exist for
something, the log and report say *not checked — no tests exist here*. Silence here
would reassure the user about work nobody verified.

Record the actual commands run and their results, so "tests passed" is checkable rather
than asserted.

### When a task blocks

Do not end the whole run. Park it, check whether later tasks depend on it, and carry on
with the ones that don't. Coming back to seven done and one clearly flagged beats coming
back to two done.

### Assumptions

Log every assumption as you make it: what you assumed, why, and how easily it could be
undone. Cheap and reversible — log it and carry on. Expensive or hard to undo — stop.
This is what turns most "what's next?" moments into a note instead of a halt.

---

## Stop conditions

Stop, log clearly, and hand back when:

- Anything destructive or irreversible: deleting files you did not create this run,
  pushing, rewriting history, deploying, dropping or migrating real data.
- Anything needing the user's credentials, keys, accounts, payment, or their machine.
- Anything outside the scope fence.
- **A new package or dependency is needed.** Do not add or upgrade libraries on your own
  — each is third-party code the user never agreed to. That task stops and asks.
- A genuine fork where two paths lead somewhere materially different.
- You are guessing about something expensive or hard to reverse.
- The same fix has failed twice. A third attempt at 3am produces damage, not progress.
- A task has ballooned far beyond its description.
- A required skill is missing or two skills conflict.
- The queue is empty.

### Never, regardless of what the queue says

Live/production sites, real customer data, payment flows, secrets and keys.

### These are NOT reasons to stop

Left unwritten, these leak back in — they are the actual cause of the stop-start pattern
this skill exists to fix:

- Finishing a file, a component, or a task.
- Wanting to report progress or summarise.
- Reaching a natural-feeling handoff point. Consult the queue instead of asking
  "what's next?".
- A cheap, reversible assumption — log it and continue.
- A check failing once — fix it and re-run.
- The output getting long.

### No drift

If you spot something else worth doing, add it to the queue as a suggestion for the
user. Do not do it. This keeps the pile of changes reviewable.

---

## Files to maintain

All three live in `keep-going/` inside the project folder. **All three are overwritten in
place — never dated, never numbered.** The next session has to know which file is current
without working it out; five dated queues is a guess waiting to happen, and resuming from
a stale queue is the most expensive failure this skill has. Version history is already
free in the project's save history. Put the timestamp *inside* the file instead.

**`QUEUE.md`** — tasks in order, each with status (`pending` / `in progress` / `done` /
`blocked`), its done-when, governing skills, and any dependency on another task.

Write it for a stranger. Tomorrow is a fresh session with no memory of tonight; if the
queue only makes sense to someone who watched the chat, resuming will drift.

**`LOG.md`** — append-only, newest last. Per task: what was built, skills loaded and
their dates, commands run and their results, assumptions made, anything not checked and
why.

Tag the five things the report has to lift out, one per line, so building the report is
extraction rather than re-reading. Readable as plain markdown, greppable as markers:

```
> DECIDE: needs a new library (sharp) to resize images - stopped, task 6
> BLOCKED: task 6 - parked, tasks 7-9 do not depend on it and carried on
> ASSUMED: "the whole page" includes the sidebar - cheap to undo, git history
> UNCHECKED: never opened in a browser - proven by code only
> IDEA: the header could lose 40px now the banner is gone - not doing it
```

**`REPORT.html`** — the readable version, for a user who will not read markdown. Built
from the template next to this file. Its rules are in the comment at the top of that
template; the two that matter most are repeated below because they are the ones that rot.

---

## Reporting — plain English, always

The user is not a developer. A report they cannot parse is not a report. This applies to
the chat summary, the log, and every stop message.

- Say what happened in real terms: *the buttons broke the build — fixed it*, not
  *typecheck failure in ButtonGroup*.
- Every stop says three things: what you were doing, what went wrong, and what you need
  from them.
- Never imply a check ran when it didn't.
- Don't dumb it down to uselessness — name files and tools where it helps them look.

### The HTML report — `keep-going/REPORT.html`

Write it **once, at every stop** (and on "status"), not per task — rendering it after each
task eats the run for no gain. `LOG.md` is written per task as usual; the report is built
from it at the stop. Copy `report-template.html` from beside this file on the first run,
then fill it. Never restyle it: two runs that look different are two things to learn.

Order is the whole point. **Issues at the top, evidence at the bottom** — the user should
never scroll to find what needs them. Sections, fixed: Needs you → Not checked → What's
next → Done → Noticed → Full log → What the words mean. Every section stays even when
empty, with its one-line empty state; a missing section reads as an oversight, an explicit
*Nothing needs you* reads as an answer.

**Write the verdict first — one sentence, at the top.** What the run did, and the single
biggest thing that is not proven. It is the hardest line on the page and the one most worth
getting right: without it the most important fact about a run is spread across five cards
and never stated once. *"The rack is gone — 5,075 lines and 48 automation settings — and
nothing in this run has been opened, listened to, or loaded by a host."* If you cannot say
it in one sentence, you do not yet understand the state of the run. Colour it by what is
true, not by mood: amber for anything unproven, green only when everything built was checked
and seen to pass, red when work has halted.

**Drop dead tiles from the scoreboard.** *In progress: 0* on a finished run is a number that
teaches the reader to skim the row. Four to six tiles; *Needs you* and *Not checked* always
present even at zero; the last one is the run's own headline number.

**It is a worklist, not a record.** It shows only what is still outstanding. When an item
is dealt with, **delete it from the file** — no tick, no strikethrough, no "resolved"
pile. The length of the page is how much is left. Two rules keep that honest, and without
them "I dealt with it" and "the skill quietly dropped it" look identical:

- **Remove only what was observed resolved.** The user answered the decision; the check
  actually ran and was seen to pass; the assumption was confirmed. **Never** remove an
  item because you have grown confident it is probably fine — that turns `UNCHECKED` into
  a lie, which is the one thing the tag exists to prevent.
- **Record every removal in `LOG.md`**, one dated line: `> REMOVED: DAW round-trip - user
  ran it, reported all three tabs correct (9 Aug)`. Nothing is ever deleted from the log;
  items disappear from the page only.

### Copy-prompts — two buttons, and every prompt discusses first

Each item in **Needs you** and **What's next** carries buttons that copy a ready-made
prompt. Write each one to stand alone: absolute project path, branch, read `QUEUE.md` and
`LOG.md` first, and every hard-won rule already learned for that task — what must not be
deleted, the mistake already made twice, the gate that decides done. The chat it lands in
has never seen this run, so anything left implicit is lost.

**Discuss** comes first and is always there — its prompt talks the item through and changes
nothing. **Act** is secondary, and is only added where there is one unambiguous action:

| Item | Buttons |
|---|---|
| `DECIDE` | **Discuss only.** Nothing has been decided, so no action can be pre-written. |
| `BLOCKED` | **Discuss only**, unless the fix is already known and agreed. |
| `ASSUMED` | Discuss + *Change it* |
| `UNCHECKED` | Discuss + *Check it* — unless nothing a human could do would settle it yet. |
| `NEXT` | Discuss + *Run task N* |

That table is not fussiness — it means **the item that deletes the most has no button that
deletes anything**. Label the act button with the real verb, never a generic "Copy prompt";
a generic label is how the wrong button gets clicked. Give every button its own one-line
hint saying what it does.

**Every prompt opens with the freshness stamp** — the verbatim text is in the template. A
report overwrites itself; a clipboard does not. Someone copies a prompt while a task is in
progress and pastes it an hour later when the task is finished, sending a fresh session off
to re-decide something already decided. That has already happened once in real use, on the
largest item in the report. So every prompt dates itself and tells the receiving session to
read `QUEUE.md` and `LOG.md` **before acting** and say if it has been overtaken. It has to
be the first line — a warning underneath the instruction is read after the reader has
already decided what they are doing.

**Every prompt ends with the discuss-first block** — the verbatim text is in the template.
It makes the receiving session state the job, list every file it would change, say what it
thinks is *wrong* in the queue or log, name the undo, and then **wait for "go"**. No
exceptions, including resume prompts for tasks already agreed: what needs agreeing is the
plan, not the task.

That third point — invite the next session to disagree — is not politeness. It is the only
independent read this run gets, and a report's items are often corrections of a previous
session's own mistakes.

Say plainly if asked: this is a disposition, not a lock. A session can still barrel past
it. What actually prevents an edit is the user's approval settings.

### End-of-turn summary — use this shape exactly

```
**Done**
- [one line per task, plain verbs, no explanation]

**Not fully checked**
- [task — what wasn't verified and why. Omit this block if everything was checked.]

**Your turn**
- [only genuinely actionable items, reason in about six words]

[Queue: X done, Y left, Z blocked]
[Full report: keep-going/REPORT.html]
```

Order **Your turn** by what they should look at first — riskiest or most uncertain
first, not the order you did things. Distinguish *built and confirmed working* from
*built but not properly tested*; a tidy list otherwise invites them to assume more than
is true.

Keep **Done** to about eight lines — group related tasks if longer. If **Your turn** is
empty, say so in one line: *Nothing — say keep going to continue.*

---

## Mid-run controls

- **"status"** — refresh `REPORT.html` and say where the queue is, without doing more work.
- **"stop"** / **"pause"** — finish the current task cleanly if it is nearly done or
  abandon it if not, update the queue, and summarise. Never leave work half-saved.
- **"add to queue"** — append tasks without disturbing the run order.

## A note on permissions

In Claude Code, approval prompts come from the user's own settings, not from this skill.
If trivial prompts keep interrupting, that is configuration — tell them which settings
to loosen rather than pretending the skill can override them.
