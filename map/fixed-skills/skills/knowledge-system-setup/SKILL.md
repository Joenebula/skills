---
name: knowledge-system-setup
description: Set up or manage a self-learning knowledge system in a project — a per-topic memory the assistant reads each session, plus a shared rulebook. Use only when the project does NOT already keep its own ledgers by hand: if it has files like docs/decisions.md, docs/gotchas.md or a build ledger, that project has already chosen its memory system and this skill must not compete with it. Otherwise use when the user wants to create a knowledge base or project memory, connect to a team shared knowledge repo, add or retire a knowledge topic, seed a topic from existing docs, or check knowledge status. Also use when the user references setting up "START-HERE" or a learning system.
---

# Knowledge system — setup & management skill (v2)

This skill sets up and maintains a self-learning knowledge system, for one person
or a whole team. It is the Claude Code / skill-native equivalent of the paste-and-
go `START-HERE.md`: same logic, packaged so it loads automatically when the user
asks to create or manage a knowledge base. It is written for non-technical users —
do the git/plumbing for them, never ask them to run commands. Follow the
instructions below; the file templates are in the appendix.



## INSTRUCTIONS TO THE ASSISTANT

You are setting up or maintaining a self-learning knowledge system. It is a set of
memory files (one per topic) plus a shared rulebook, letting you accumulate what
works over time. A project can have several independent topics, each with its own
`KNOWLEDGE.md` under `knowledge/<slug>/`, all sharing `knowledge/PROTOCOL.md`,
`knowledge/reference.md`, and `knowledge/INDEX.md`.

First decide the mode from the user's message: **set up** (default), **manage**
(retire/rename), or **status**. Then follow the matching section. Ask questions one
at a time, waiting for each answer. Keep it friendly and short.

### Step −1 — Resolve where the knowledge lives (every run, before anything else)

Knowledge can live locally in this repo, or in a shared team repo that everyone
uses. Resolve the location in this order, and **do all git yourself — never ask the
user to run a command:**

1. **Global team setting.** Check for a team-knowledge location configured for this
   user (a global pointer, e.g. `~/.knowledge-location` containing a path or git
   URL). If set, that is the knowledge location for *every* project this user opens.
   Make sure a local clone exists and is current — clone it if missing, `pull` the
   latest — then read/write knowledge there.
2. **Local pointer.** Else, check for a `.knowledge-location` file in this repo; if
   present, use the path/URL it names (clone/pull as above).
3. **Ask, in plain language (only if neither is set).** "Is this knowledge just for
   you, or shared with your team?"
   - *Just me* → use a local `knowledge/` folder in this repo. Proceed normally.
   - *Shared with my team* → ask for (or offer) the team knowledge repo. If they
     don't know it, tell them a teammate/admin can give the link, or offer to create
     a new shared repo. Once known: clone it, record it as the user's global setting
     so every future project connects automatically, and use it. The user only ever
     answers this one question — you handle the clone, the config, and all syncing.

From here on, "the knowledge" means whatever location this step resolved. If it is a
**shared/team** location: `pull` the latest at the start of every session before
reading, and after any approved change, `commit` and `push` it — silently, on the
user's behalf. If anything can't sync (offline, no access), say so plainly and keep
a local copy; never surface raw git errors or ask them to fix git.

### Step 0 — Version / self-heal check (every run)

Look for `knowledge/.version`.
- If it's missing but `knowledge/` exists, this is a partial or pre-version setup:
  create any missing shared files (check each individually, not just PROTOCOL.md)
  and write the current version.
- If it exists and is **older** than this file's version (see VERSION below), offer
  to refresh the **shared files only** — `PROTOCOL.md`, `reference.md`, `INDEX.md`
  header, the loaders, the Action, the README — to the current templates. These hold
  no user data, so refreshing is safe. **Never touch any `KNOWLEDGE.md` or
  `ARCHIVE.md`** — those hold the learned entries. Update `.version` after.
- If it matches, proceed.

VERSION: 5

### Step 1 — Interview (SET UP mode)

1. **Topic name** — "What is this knowledge system for? (one or two words, e.g.
   *accessibility*, *processes*, *design-tokens*)." Make a lowercase hyphenated slug
   (e.g. "Design Tokens" -> `design-tokens`). Use the standard spelling even if
   misspelled. The slug is the folder name; its first letter is the topic-letter for
   entry IDs.
2. **Stack** — "What is this project built with? (language / framework)"
3. **References** — "Which standards or docs should this topic draw on? You can name
   several." For **each** one:
   - **If you recognise it as a public standard or well-known docs** — don't make the
     user find the link. *State the source you'll use and ask them to confirm*, e.g.
     "For WCAG 2.2 AA I'll use the official W3C spec at w3.org/TR/WCAG22 — right?"
     Offer that it might be their *internal* version instead.
   - **If you don't recognise it, or it's project-specific** (their Storybook,
     internal docs) — *ask for the location* (URL or path); you can't know it. If none
     is given, record it but flag it unusable until a link is added.
   - **If the same reference name is already used by another topic** (check INDEX /
     other KNOWLEDGE files), offer that reference's existing URL and role so the copies
     start identical.
   - **If it needs a login**, record the location and mark it auth-required — but NEVER
     store credentials; the environment supplies auth. Tell the user this.
   - Note what each is **authoritative for** (its role): standard -> conformance;
     pattern guide -> patterns/roles; framework docs -> implementation.
   - Mark each **live** (needs internet) unless it's a local file.
   - With more than one, set a **precedence** for overlaps. Default: the formal
     standard wins on conformance; the pattern/implementation guide wins on how to
     build. Confirm or adjust.
4. **Owner** — "Who makes the final call on this topic when there's a disagreement —
   an individual, or the team?" Record it as a **role** where possible (e.g.
   "accessibility lead"), or name + role, so it survives the person leaving. If they
   pick **team**, note: genuine ties fall to governance, so it can't deadlock.
5. **Governance** — "Who assigns ownership if it's ever disputed? (a role, ideally,
   or name + role)." Governance should be a single accountable role, not "everyone" —
   it's the backstop, and it must survive departures too.
6. **Your name** — "What name should I record you under as a contributor?" Derive your
   initials for the entry-ID prefix; if another contributor already uses those initials
   in this project, append a digit (e.g. `JS2`) so IDs can't collide.
7. **Size threshold — ASK ONLY ON FIRST RUN** (if `knowledge/INDEX.md` doesn't exist):
   "I'll flag a topic once it grows past a set number of active entries, so no file
   gets too big to use reliably. Default is **50 per topic** (~7-8K tokens — light,
   everything still gets attended to). Raise it for bigger files, lower it for earlier
   warnings. Keep 50, set your own, or want the tradeoff explained?" Record as the
   global default. On later runs, offer a quick per-topic override (default: inherit).
8. **Seed from existing docs — OPTIONAL** — "Do you already have docs, a README, or
   notes for this topic I could scan and propose starter entries from? (or skip)."
   If yes, read them and *propose* candidate entries for the user to approve one by
   one — never add unapproved. Respects empty-by-default while jump-starting.

### Step 2 — Shared files (create any that are missing)

Check each of these individually and create any that don't exist (from the APPENDIX):
`knowledge/PROTOCOL.md`, `knowledge/reference.md`, `AGENTS.md` (root),
`.github/copilot-instructions.md`, `.github/workflows/knowledge-review.yml`,
`scripts/knowledge_scan.py`, `knowledge/README.md`, `knowledge/.version` (= VERSION).
If they all exist and match version, skip.

### Step 3 — Topic registry (INDEX)

If `knowledge/INDEX.md` doesn't exist, create it from the template and record the
size threshold (Step 1.7). Add a row for this topic (name, folder, one-line
description, owner). Leave existing rows untouched.

### Step 4 — This topic's files (always)

Create `knowledge/<slug>/KNOWLEDGE.md` from the template, filling `## Environment`
and `## References` from the interview, plus any approved seeded entries. Also create
empty `knowledge/<slug>/ARCHIVE.md`. If the folder exists, ask before overwriting
(default: no).

### Step 5 — Confirm and hand over

Tell the user plainly: which files were created / already existed; a **Data sources**
statement (each reference, role, location, live?/auth?); the **size setting** and how
to change it (INDEX Settings); and a **3-line quickstart** (Read: applied
automatically each session · Add: work normally, the assistant proposes entries you
approve · States: Open=gap, Provisional=on trial, Settled=confirmed). Mention they can
type "knowledge status" any time, and that to add another topic they paste this file
again.

### MANAGE mode (retire / rename a topic)

- **Retire:** never delete. Move `knowledge/<slug>/` to `knowledge/_retired/<slug>/`
  (or mark it retired in INDEX) and strike its INDEX row with a "retired <date>" note.
  Its knowledge is preserved and can be restored.
- **Rename:** change the slug, rename the folder, update the INDEX row, and update any
  cross-references in other topics. IDs keep their old prefix (they're permanent) —
  only new entries use the new topic-letter.

### STATUS mode ("knowledge status")

Read INDEX and each topic's `KNOWLEDGE.md` and report: topics and owners; active-entry
counts per topic (flag any over threshold); entries past their review date; Provisional
entries awaiting promotion; any references missing a link. This is also the post-setup
sanity check — if it runs, the wiring works.

Do not restate the rules anywhere except `knowledge/PROTOCOL.md`. Loaders, INDEX, and
README only *point at* it.

---

## APPENDIX — file templates

### Template: `AGENTS.md`

~~~markdown
# AGENTS.md

This project uses self-learning knowledge systems under `knowledge/`. Any AI assistant
here must follow them. This file is a loader — the rules live in `knowledge/PROTOCOL.md`
so tools can't drift apart.

## Every session
1. Read `knowledge/INDEX.md` (topics + settings) and the `KNOWLEDGE.md` for the
   relevant topic(s). **State briefly which topics you loaded**, so it's visible you
   engaged. Apply **Settled** entries. Consult the topic's **References** for
   authoritative info (needs internet if live). Mention entries past their review date,
   and warn if a topic is over its size threshold.
2. Follow `knowledge/PROTOCOL.md` for any change to recorded knowledge.
3. Never delete knowledge silently — supersede into `ARCHIVE.md` with a reason; replace
   a solution only when measurably better. IDs are author-prefixed and permanent.

If the user asks how any of this works, explain it from `knowledge/README.md`. To add a
topic, add a folder with its own `KNOWLEDGE.md` and an INDEX row.
~~~

### Template: `.github/copilot-instructions.md`

~~~markdown
# Copilot instructions

This project uses self-learning knowledge systems under `knowledge/`. On every chat and
agent request: read `knowledge/INDEX.md`, then the relevant topic's `KNOWLEDGE.md`,
state which topics you loaded, and apply **Settled** entries rather than reinventing.
Consult that topic's **References** for authoritative info (needs internet if live; if
offline or auth is missing, flag it rather than guessing). Mention overdue entries and
warn if a topic is over its size threshold.

When recorded knowledge would change, follow `knowledge/PROTOCOL.md`: act only on a
mechanical trigger, route to the right topic, classify (rule/standard/convention/
preference), and ask the owner on a genuine judgment call.

Never delete knowledge silently — supersede into `ARCHIVE.md`, only when measurably
better. IDs are author-prefixed and permanent. If the user asks how this works, explain
from `knowledge/README.md`. Keep `knowledge/PROTOCOL.md` as the single source of truth;
don't restate its rules here.
~~~

### Template: `knowledge/PROTOCOL.md`

~~~markdown
# Learning system protocol (shared by all topics under knowledge/)

Each topic has its own `KNOWLEDGE.md` (active) and `ARCHIVE.md` (superseded history);
all share these rules, `reference.md`, and `INDEX.md`. A `KNOWLEDGE.md` starts empty of
learned knowledge and fills through use.

## What loads each session
Read `INDEX.md` and the relevant topic's `KNOWLEDGE.md`. Do NOT load `ARCHIVE.md`
routinely — only on demand. State which topics you loaded, so engagement is visible.

## Where the knowledge lives (solo or shared)
The knowledge may be local to this repo or in a shared team location (a global
setting or a `.knowledge-location` pointer). If it's shared, `pull` the latest
before reading each session and `commit`/`push` after any approved change — do this
silently for the user; never require them to run git, and never surface raw git
errors (if it can't sync, say so plainly and keep a local copy). If it's local,
just read/write the repo's `knowledge/` folder.

## References vs entries
References are external sources for lookup (standards, docs) — consulted and cited,
never gated, superseded, or scored. Only *learned entries* get the tiers and lifecycle.
- Go to a reference's recorded location; cite which one. Use the one whose role fits the
  question; on overlap follow the topic's precedence.
- If a live reference is needed and you're offline, or an auth-required one can't be
  reached, say so — don't guess. Never store credentials in these files; auth comes from
  the environment. A project reference with no link is unusable until one is added.

## Start of session
1. Read `INDEX.md`; pick relevant topic(s).
2. Read the topic's `KNOWLEDGE.md`. Apply **Settled**; treat **Provisional** as
   usable-but-unproven; **Open questions** as gaps.
3. **Stale-check on read:** flag any Settled entry whose *Last confirmed* is older than
   its review interval (default 6 months) — "still true?" (heartbeat; a scheduled Action
   also catches these independently of whether the topic is opened).
4. **Size-check on read:** if active entries exceed the threshold (topic override else
   INDEX default), warn and suggest a review or sub-topic split. A prompt, never auto.

## Routing
Use INDEX descriptions. Fits one -> record there. Fits none -> propose a new topic. Fits
two -> record in the primary and cross-reference the other.

## Act only on a mechanical trigger
Contradiction (a claim failed) · Oscillation (value returned to a superseded one) ·
Recurrence (same gap 3+ times) · Gap-hit (solved fresh, nothing recorded) · Staleness
(past review interval — prompts a re-check) · Size (over threshold — prompts a review).
Fuzzy feelings and self-reported confidence never trigger a change alone.

## Lifecycle (both directions)
- **Open -> Provisional:** a durable candidate answer for a known gap.
- **Provisional -> Settled**, two paths:
  - *Earned:* applied **2+ times with no contradiction** (tracked in *Times applied*) —
    the absence of a contradiction, not a judgment that each use was "good". At the
    count, surface a promotion prompt; the owner's confirmation promotes.
  - *Owner-direct:* the owner may promote straight to Settled when it's standard-grounded
    or obviously correct (e.g. from a cited reference), with a note. Also backstops the
    count when it wasn't reliably incremented.
- **Settled -> Provisional/Open:** contradicted, or a failed stale-check. Settled is
  default-closed, not permanent.

## Archiving — event-driven only, never by age or disuse
An active entry moves to `ARCHIVE.md` ONLY when **superseded** or **contradicted**. Never
archive by age or disuse — rare-but-vital knowledge looks identical to obsolete by
age/usage, and archiving on those signals buries what you can't re-derive. Time triggers a
re-check; the owner's answer, not the clock, decides.

## The gate (when a trigger fires)
1. Classify the tier — rule (gate) / standard (check the spec) / convention (flag and
   ask) / preference (log if it recurs). Never promote a tier.
2. Ground against an external standard first; if it settles it, apply it.
3. Ensure the claim is falsifiable with an *observable* trigger before recording.
4. **Conflict-check on write:** before adding a new entry, check whether it contradicts
   an existing Settled entry in the topic; if so, flag it rather than silently adding a
   contradiction.
5. On a genuine judgment call, ask the owner a well-framed question; ration to genuine
   conflicts.
6. Record the decision and its reasoning, including why the rejected option lost.
   Supersede into `ARCHIVE.md` — never delete. Set *Last confirmed* to today.
7. Log the outcome hook ("held up?").

## Superseding — three grounded axes, never taste
Replace a solution only when it is measurably or demonstrably better on one of these,
and worse on none:
- **Efficiency** — fewer steps / dependencies / failure points (state the count).
- **Standard-conformance** — passes a standard the old one failed.
- **Recommended practice** — better aligned with an authoritative reference's guidance
  when both conform. This one MUST **cite** the reference; uncited "it's nicer" doesn't
  qualify. Because it's a judgment, route it as flag-and-ask (owner confirms).
Move the old entry to `ARCHIVE.md` with the reason.

## Conflicts & authority
Content dispute -> resolve by standard, or escalate to the owner. Owner flip-flops ->
hold each reversal to its own prior reason; if unjustified and repeated, recommend
locking it. Two people both claim ownership -> that's governance, not content; escalate
to whoever assigns roles, settle ownership before content. Authority is recorded as
roles, so it survives departures; reassigning an owner is a governance action, noted and
dated. Owner may be an individual or the team (ties fall to governance); governance is a
single accountable role.

## Team / merge safety
IDs are author-prefixed (`<topic-letter>-<INITIALS>-<n>`, e.g. `A-JOE-001`), so two people
creating entries at once can't collide. IDs are permanent and never renumbered. Add new
entries rather than editing in place where you can.

## Status on request
If asked for "knowledge status", report topics + owners, active-entry counts (flag over
threshold), overdue entries, Provisional awaiting promotion, and references missing a link.

## Reliability note
Times-applied and outcome counts are best-effort bookkeeping — don't hang anything
critical on them alone; the owner-direct promotion path and the scheduled Action backstop
them. For any rule that must never be skipped, enforce it outside the model too (lint/CI);
instructions alone can't guarantee the assistant consults this every time.

## Capture rule
Record recurring steps, fiddly config, gotchas, reasoned decisions. Don't record
one-offs, unconfirmed ideas, transient state, secrets/tokens, personal or customer
data (PII), or anything unapproved.
~~~

### Template: `knowledge/reference.md`

~~~markdown
# Reference — schema, tiers, states

## Entry schema
Each entry is a short falsifiable claim:
- **ID** — author-prefixed, permanent, never reused: `<topic-letter>-<INITIALS>-<n>`,
  e.g. `A-JOE-001`. Initials prevent parallel-creation collisions and double as
  provenance. **Claim/solution**, **Observable trigger** (mandatory — visible at
  decision time), **Tier**, **Source** (looked-up vs learned), **State**, **Owner**,
  **Set by** (who + date), **Times applied** (count, for promotion), **Last confirmed**
  (date, for stale-check), **Outcome/held-up**.

### Worked example
- ID: [A-JOE-001] get_variable_defs returns nothing on some Figma files
- Claim/solution: If get_variable_defs returns empty, use get_design_context — the file
  uses styles, not variables. Needs an active selection.
- Observable trigger: get_variable_defs returned empty. (NOT "the file uses styles".)
- Tier: learned gotcha
- Source: looked-up (Figma docs) -> confirmed learned
- State: Settled
- Owner: design-system lead
- Set by: Joe, 2026-07-08
- Times applied: 3
- Last confirmed: 2026-07-08
- Outcome/held up?: held

The trigger is an *observable outcome*, not a hidden property you can't see when deciding.

## Four tiers
- Rule -> hard gate. Test: no legitimate exception AND no judgment to apply.
- Standard -> check against an external spec.
- Convention -> flag and ask. Has a rationale but known exceptions.
- Preference -> log only if it recurs.
Diagnostic: can you name an exception? does applying it need judgment? A rule is "no" to
both; a convention is "yes" to at least one. Never promote a tier.

## Three states (lifecycle)
Open (known gap) -> Provisional (on trial, tracked by Times applied) -> Settled (confirmed
by 2+ uses with no contradiction + owner OK, or promoted directly by the owner when
standard-grounded). Reopens on contradiction or a failed stale-check. Default-closed, not
permanent.

## Archiving
Active entries move to `ARCHIVE.md` only when superseded or contradicted — never by age or
disuse. `ARCHIVE.md` is not loaded at session start.
~~~

### Template: `knowledge/INDEX.md`

~~~markdown
# Knowledge index

Read this first to pick the relevant topic(s) and route new knowledge. Each topic is an
independent memory file under its own folder, sharing `PROTOCOL.md` and `reference.md`.

## Settings
- Size warning threshold (default, per topic): 50 active entries. Change anytime to adjust
  up or down. A topic may override it in its own KNOWLEDGE file.
- System version: 5

## Topics
| Topic | Folder | What it covers | Owner |
|-------|--------|----------------|-------|
| <SLUG> | `knowledge/<SLUG>/` | <ONE-LINE DESCRIPTION> | <OWNER ROLE> |

_Add a topic: invoke this skill with a new name. Retire/rename: run START-HERE in manage
mode (retired topics are struck here with a date, not removed)._
~~~

### Template: `knowledge/<slug>/KNOWLEDGE.md`

~~~markdown
# Knowledge — <TOPIC NAME>

Living memory (active entries). Superseded history is in `ARCHIVE.md` alongside. Under the
shared rules in `knowledge/PROTOCOL.md`. Starts empty of learned knowledge; earned through
use. Nothing is deleted silently.

## Environment
- Stack / framework: <STACK>
- Standards that apply: <STANDARDS>
- Owner (role — final call): <OWNER ROLE, individual or team>
- Governance (role — assigns ownership): <GOVERNANCE ROLE>
- Contributors: <YOUR NAME>
- Size threshold override: (none — uses the INDEX default)

## References (for lookup, not rules)
Consulted and cited, never rules or entries. Live references need internet; auth-required
ones need the environment's credentials (never stored here). If unreachable, flag rather
than guess.

- **<NAME>** — <URL or path> — *authoritative for: <ROLE>.* <live/local; auth? y/n>
  _(repeat per reference)_

**Precedence when references overlap:** <PRECEDENCE RULE>

## Open questions
_(none yet)_

## Provisional
_(none yet)_

## Settled
_(none yet)_
~~~

### Template: `knowledge/<slug>/ARCHIVE.md`

~~~markdown
# Archive — <TOPIC NAME>

Superseded and contradicted entries, kept for history and reversal. NOT loaded at session
start — consulted on demand. Entries arrive only via supersede or contradiction (never by
age or disuse), each with the reason it left active use.

_(empty)_
~~~

### Template: `knowledge/.version`

~~~
5
~~~

### Template: `.github/workflows/knowledge-review.yml`

~~~yaml
name: Knowledge review
on:
  schedule:
    - cron: '0 9 1 * *'   # 09:00 on the 1st of each month
  workflow_dispatch: {}
permissions:
  issues: write
  contents: read
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.x' }
      - name: Scan knowledge for overdue / gaps
        run: python scripts/knowledge_scan.py > review.md
      - name: Open or update review issue
        env: { GH_TOKEN: '${{ github.token }}' }
        run: |
          if [ -s review.md ]; then
            num=$(gh issue list --label knowledge-review --state open --json number -q '.[0].number')
            if [ -n "$num" ]; then
              gh issue edit "$num" --body-file review.md
            else
              gh issue create --title "Knowledge review due" --label knowledge-review --body-file review.md
            fi
          fi
~~~

### Template: `scripts/knowledge_scan.py`

~~~python
#!/usr/bin/env python3
"""Scan knowledge/ for overdue Settled entries, blank outcomes, and stale open
questions. Prints a markdown report (empty output = nothing to flag). Reports only —
never edits knowledge files."""
import re, glob, datetime, sys

REVIEW_DAYS = 183  # ~6 months
today = datetime.date.today()
lines = []

for path in glob.glob("knowledge/**/KNOWLEDGE.md", recursive=True):
    topic = path.split("/")[-2]
    text = open(path, encoding="utf-8").read()
    # crude entry split on ID headers like "[A-JOE-001]"
    entries = re.split(r"\n(?=.*\[[A-Za-z]+-[A-Za-z]+-\d+\])", text)
    for e in entries:
        idm = re.search(r"\[([A-Za-z]+-[A-Za-z]+-\d+)\]", e)
        if not idm:
            continue
        eid = idm.group(1)
        state = (re.search(r"State:\s*(\w+)", e) or [None, ""])[1]
        lc = re.search(r"Last confirmed:\s*(\d{4}-\d{2}-\d{2})", e)
        applied = re.search(r"Times applied:\s*(\d+)", e)
        outcome = re.search(r"held up\?:\s*(\S+)", e)
        if state == "Settled" and lc:
            d = datetime.date.fromisoformat(lc.group(1))
            if (today - d).days > REVIEW_DAYS:
                lines.append(f"- **{topic} {eid}** overdue for re-check (last confirmed {lc.group(1)})")
        if applied and int(applied.group(1)) >= 1 and (not outcome or outcome.group(1) in ("(fill", "")):
            lines.append(f"- **{topic} {eid}** applied but outcome not recorded")

# stale open questions (older than the same interval, if dated)
for path in glob.glob("knowledge/**/KNOWLEDGE.md", recursive=True):
    topic = path.split("/")[-2]
    text = open(path, encoding="utf-8").read()
    oq = re.search(r"## Open questions(.*?)(\n## |\Z)", text, re.S)
    if oq:
        for m in re.finditer(r"(\d{4}-\d{2}-\d{2})", oq.group(1)):
            d = datetime.date.fromisoformat(m.group(1))
            if (today - d).days > REVIEW_DAYS:
                lines.append(f"- **{topic}** has an open question older than the review interval ({m.group(1)}) — still relevant?")

if lines:
    print("### Knowledge review due\n")
    print("The scheduled review found items that may need attention. Nothing here is")
    print("changed automatically — confirm or update each, then set *Last confirmed* to today.\n")
    print("\n".join(lines))
~~~

### Template: `knowledge/README.md`

~~~markdown
# How this knowledge system works (for humans)

This folder is a shared "memory" for the project. The AI assistant reads it and applies
what's been learned, so the team stops solving the same things twice. You don't need to
manage it manually.

## How to use it
- **Read** — the assistant reads the relevant topic automatically each session and applies
  **Settled** entries. You can also ask it "knowledge status" for a summary.
- **Add** — just work normally. When something recurs, or a recorded claim turns out wrong,
  the assistant proposes an entry and you approve it. It won't quietly change or delete
  what's there.
- **Ask** — if you're unsure how any of this works, just ask the assistant in chat, or type
  `knowledge help`.

## What the states mean
- **Open** — a known gap, no good answer yet.
- **Provisional** — a candidate answer on trial.
- **Settled** — confirmed and in use.

## Good to know
- Each folder under `knowledge/` is one independent topic; they share the rules in
  `PROTOCOL.md`.
- Nothing is ever silently deleted — replaced entries move to that topic's `ARCHIVE.md`
  with a reason.
- Times-applied and outcome counts are advisory, not exact.
- **Backup is git** — it's all files in the repo, with full history, revertable at any time.
- The rules live only in `PROTOCOL.md`; everything else points at it, so it stays the single
  source of truth.
~~~

---

*End of skill.*
