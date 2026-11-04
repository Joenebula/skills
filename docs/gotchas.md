# Gotchas — the skills library

Traps hit, and how they were fixed. **Append the moment one lands** — not at session end.

Read the relevant entries before touching a named area. An entry earns its place only if it cost
real time or would cost real time again.

These entries were written in the VibeHQ repo, before the library had one of its own. They belong
to the library, so they live here and keep their original numbers — every citation to G-008 still
resolves. VibeHQ's `docs/gotchas.md` holds a stub pointing here for each of them. The numbering
therefore has gaps: what is missing is still in VibeHQ, because it is about VibeHQ.

Format:

```
## G-000 — Title  ·  area: <where this bites>
**What happened** · **Why** · **Fix** · **How it's prevented now**
```

---

## G-001 — `git add -A` silently stages deletions · area: git, any repo

**What happened.** In the sibling `.claude` repo, `skills/ask-dont-guess/SKILL.md` (130 lines,
54 inbound links, cited by law number from `CLAUDE.md`) vanished from disk mid-session. `git add -A`
staged the deletion silently and it was committed. The commit message never mentioned it, because
nobody knew. It was later restored — then vanished a **second** time, along with `skills/security/SKILL.md`.

**Why.** `git add -A` stages every change including deletions, with no confirmation. Combined with a
file disappearing from disk for an unrelated reason, it turns a filesystem glitch into a committed
data loss.

**Fix.** Restore from git — the content was never altered, only deleted whole.

**How it's prevented now.** Never `git add -A` or `git add .` in this repo — stage explicit paths.
A Claude Code hook blocks the bare forms (BUILD-PLAN §8.1), and the pre-commit hook prints every
staged deletion and demands each be confirmed deliberate.

---

---

## G-006 — A folder in the skills library is not a skill  ·  area: skills, docs

**What happened.** Building the skills map, Claude read a directory listing of
`../.claude/skills/`, saw a `security/` folder, and concluded that §10's ⚠ Known gap note —
"the `security` skill is missing, deleted from the working tree" — was stale and should be
rewritten.

**Why.** G-001 records that `skills/security/SKILL.md` and `skills/ask-dont-guess/SKILL.md`
vanished from disk **while their folders remained**. A folder listing cannot distinguish a working
skill from an empty shell. The note may well still be correct.

**Fix.** Not applied — the §10 note was left alone. Verifying it needs
`Test-Path ../.claude/skills/security/SKILL.md`, which is one command on the machine that has the
library.

**How it's prevented now.** `scripts/skills-inventory.ps1` reports `hasSkillMd` per folder rather
than folder names alone. Any claim about a skill existing must cite that field, not a listing.

---

---

## G-008 — The skills library has no GitHub remote  ·  area: environment, backup

**What happened.** Checking whether Claude could read the skills library over GitHub instead of
from disk, every repo on the account was listed: `vibehq`, `opus-arena`, `opus-arena-joenebula`,
`nebula2sampz`, `DanceMapz`, `rumbaclaat`. There is no `.claude` repo. G-001 calls it "the sibling
`.claude` repo", so it has git history locally — but it has never been pushed anywhere.

**Why it matters.** That library governs every session. It has already lost files twice (G-001),
and G-003 names OneDrive as the suspected cause — which is also its only backup. `CLAUDE.md`
line 48 states the rule it breaks: *"Git + GitHub is the source of truth — OneDrive is backup
only."* The one directory that rule is not applied to is the one that has actually lost data.

**Fix.** Not applied — it needs a push from the machine that holds the repo:

```
cd C:\Users\joene\OneDrive\Design2\Web\.claude
git remote -v
gh repo create Joenebula/claude-workspace --private --source=. --push
```

**How it's prevented now.** Fully, as of 8 Aug. The library has been pushed —
`Joenebula/skills@df2b3f2`, 31 skills, 5 agents, `CLAUDE.md`, 16 commits of history. A third loss
is now recoverable from a copy that is not on the machine, which is the whole point: G-001's losses
were committed before anyone noticed, so local git was never a guarantee.

The push closed the gap it was raised for and settled five other items as a side effect — every
claim about what a skill *contains* stopped being inferred from its name. See G-009 for the two
that were wrong.

---

---

## G-009 — A folder listing was used as evidence a skill existed, and twice it was evidence of nothing
2026-08-08 · **Area:** the skills library, `docs/BUILD-PLAN.md` §10

**What happened.** Two entries in §10 and in the skills map were written from directory listings
and document mentions rather than from files, and both were wrong in opposite directions.

§10 said the generic `security` skill was *missing* — deleted from the working tree. It is present:
63 lines, five laws, in the pushed library. And the map said `ask-dont-guess` was *unmapped*,
named nowhere. It is 130 lines with 54 inbound links, cited by law number from the workspace
`CLAUDE.md` — one of the most heavily referenced files in the library. It was called an orphan
because only one of the two agreements had been read.

**Why it bit.** A listing tells you a folder exists. G-001 records `SKILL.md` files vanishing from
this library while their folders stayed behind, which is exactly why a listing cannot settle the
question — and having recorded that, the map then used listings as evidence anyway. In the other
direction, "not named in this repo's `CLAUDE.md`" was read as "not named anywhere", when the
library has an agreement of its own.

**Fix.** Read the file, or say you have not. The map now grades every node — *seen on disk*,
*loaded by Claude Code*, or *named by a document, file not checked* — and shows the count of the
third state in its corner. Before the push it was 34 of 63; it is now 0.

**How it's prevented now.** `scripts/build-map.mjs` establishes the grade mechanically at build
time by opening the library, and reports which commit it read. A claim that has not been checked
cannot be typed in as though it had — the build assigns the state, not the author.

---

---

## G-010 — Four bugs behind one symptom: a new skill did not appear on the map
2026-08-09 · **Area:** `scripts/build-map.mjs`, discovery and the git clock

**What happened.** Joe created `keep-going` and it was not on the map. Discovery was supposed
to make that impossible.

**Why it bit.** Four separate faults, only the first of which is what he asked about.

1. **It was never pushed.** `github.com/Joenebula/skills` was still at `df2b3f2`. The skill
   existed only in his OneDrive working tree and in the account-synced copy. Discovery reads
   the account library too, so a rebuild found it — but nothing had been rebuilt, because the
   map is a build artifact and a static page cannot read a disk it is not on.

2. **A skill found outside the repo got no date and no explanation.** The rule is right and
   it is Joe's — the repo owns the clock, and no clock beats a wrong one — but applied
   silently it produces the worst possible outcome: the skill appears, carries no *new* tag,
   and nothing says why. The panel now says which library it came from, that the library has
   no git history, and that committing it is what earns the tag.

3. **Renames were dated as never, not as wrong.** Git detects renames by default, so a
   renamed path is reported as `R` and `--diff-filter=A` skips it entirely. `code-review` →
   `reviewing-code` and `shipping` → `releasing` came out with no date at all, which put two
   skills that *are* in the repo into the same bucket as skills that are not — telling you to
   go and push something you had already pushed. `--no-renames` makes the new path an add at
   the rename commit, which under that name is what it was.

4. **A newly discovered skill crashed its own panel.** It was pushed onto the map with
   `phase:'new'`, and every panel reads `PHASES[n.phase]` for its second tag —
   `undefined.toLowerCase()`. The node drew and could not be opened, which is worse than not
   drawing. It also had no evidence grade, because `EVIDENCE` is keyed from `skills-data.js`
   and a skill only just found is by definition not in it.

**Fix.** All four. Push is still the user's step; the other three are in the build.

**How it's prevented now.** The build prints what it found outside the repo and what to do
about it, and the map says the same thing on the node itself. The tell for (4) is that the
first skill discovered by the discovery layer was also the first to exercise it — nothing had
ever taken that path before, so nothing had ever failed on it.

Also fixed in the same pass: `keep-going` was the first skill to use a YAML block scalar
(`description: >`), and the frontmatter parser kept the fold indicator, so its description
rendered with a stray `> ` in front of it.

---

---

## G-011 — A skill on disk is not a skill on the map, and the gap is a push
2026-08-09 · **Area:** the skills library → `docs/skills-map/`

**What happened.** Twice in one day a new skill "was not showing": `keep-going`, then
`impeccable`. Both times discovery was working perfectly and the answer was the same — the
skill had never left the machine.

**Why it bites.** Three things have to happen and only the first is obvious:

1. **push** the library — otherwise nothing off the machine can see it
2. **rebuild** the map — it is a build artifact; `skills-map.html` is generated
3. **re-publish** it — a web page cannot read a disk it is not on, so the artifact URL is a
   snapshot until someone replaces it

Step 1 is the one that gets missed, and its symptom looks exactly like a broken map.

**Fix.** Step 1 is now `scripts/push-skills.ps1` — one command, stages `skills/` and `agents/`
by explicit path, refuses to sweep a deletion through without a typed confirmation (G-001),
and ends by saying what happens next. Step 2 is
`.github/workflows/rebuild-skills-map.yml`, hourly plus a button. Step 3 still needs asking.

**How it's prevented now.** Partly, and the honest limit is worth stating: the map's corner
stamp carries the build date and the library commit it read, so a stale map says so. Nothing
can make a static page read a machine it is not on — that is the browser's rule, not a
shortcoming of the build.


---

## G-012 — Dead code cut by eye takes live state with it · area: `map/shell.html`, any big single-file app
2026-11-04 · **Area:** the map → `map/shell.html`

**What happened.** The synapse commit left the old engine in the file and superseded it by
name. Removing it should have been bookkeeping. I selected the block that looked dead — 1,515
contiguous lines from the first SVG `defs` to `function kick()` — cut it, and the map died on
load: `nodeEl is not defined`, before a single node was drawn.

**Why it bites.** A region that *looks* like one feature is not one feature. That block also
held `zoom`, `drag`, `settled` and the per-node element arrays — state the **new** engine
still reads, and top-level statements that still run at startup. Function supersession hides
this: the later `function apply(){}` wins, so the old body is unreachable, but every `let` and
every bare statement around it is as live as it ever was. A contiguous selection cannot tell
the difference, and the file is 4,000 lines, so neither can a person scrolling it.

Worse, the breakage was invisible to the build. `node scripts/build-map.mjs` exited 0 and
wrote a map. Only the browser knew.

**Fix.** Restore the green file first, then compute the set instead of choosing it:

1. Parse the script with `acorn`. A function declared twice in one scope is unreachable under
   its earlier name — that yields `resize`, `paint`, `tick`, `reheat`, `kick`, `apply`.
2. Anything referenced *only* from inside those bodies is dead too. Take it to a fixed point.
3. Same argument for top-level declarations with no surviving reference anywhere, the HTML
   included (an `onclick=` is a reference).
4. Remove function bodies and unreferenced declarations only. Never a line range.
5. Re-run the analysis. **Both counts must come back zero** — that is what says it finished.

That removed 21 functions and 26 declarations, 569 lines, with nothing broken.

**How it's prevented now.** Partly. The analysis is reproducible but lives in the scratchpad,
not the repo — if this comes up again it is twenty minutes to rewrite, which is cheaper than
the hour the eyeball version cost. What *is* permanent: the build's
`swap(a,b,required=false)` escape hatch is gone. Both swaps that used it were translating the
layout being removed, so all the allowance ever did was let a half-translated map exit 0. A
missing needle now stops the build.

**The real lesson.** The build going green is not evidence the page works. Every change to
`shell.html` gets loaded in a real browser before it is committed — the three checks in the
scratchpad (`syn-map`, `synfit`, `synkeep`) take eleven seconds between them and they are the
only thing that caught this.
