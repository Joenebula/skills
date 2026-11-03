# Rebuilding the map library-first

**Written 2026-11-03, in the session that spent a day fixing symptoms of this.**
**Nothing in `skills/` is changed by any of it.**

The map cannot be made to tell the truth by fixing it again. This is the diagnosis, the
rebuild, the two wrong fixes that will look right, and the check.

---

## 1. The symptom

The map shows 13 skills that are not in the library, each with an amber warning saying so,
and cannot show skills that are in the library until somebody edits a list by hand. Asked for
"an up-to-date map of my skills", it answers "here is part of your library, and some
complaints".

Four separate honesty bugs were fixed on 3 November — frozen dates, a backup folder read as
the library, an "available" tag contradicting the warning beneath it, `$HOME` guessed as the
account library. All four were real. None of them was the problem.

---

## 2. The cause — structural, not a bug

`map/skills-data.js` holds a hand-written list of 63 skills. It is the **spine**: `N` is built
from it, and the library is then checked against it.

So the library cannot add to the map, only disagree with it. Every disagreement becomes a
node that exists on the map and nowhere else, carrying a description written on the day
somebody last looked, in the present tense, with no way for the build to know it has rotted.

A hand-maintained list of what is on a disk is a cache with no invalidation. It is correct
only on the day it is written, and nothing tells you which day that was.

**The inversion:** the library is the only source. Every node is a file. A disagreement
between the library and a document is no longer representable, because there is nothing left
to disagree with.

---

## 3. ⚠ Two wrong fixes, both of which will look right

### Delete the 13 stale entries from the list

The amber disappears today. The list is still hand-maintained and still the spine, so the
next skill added or deleted puts it straight back. **This was attempted in the session that
wrote this spec and reverted ten minutes later** — it is the obvious move and it fixes
nothing.

### Copy `map/restore-skills/` into `skills/`

All 13 become "file seen on disk", every warning clears, and the map goes green. It would
also put August copies of thirteen skills back into the live library, where Claude Code would
load them. **A green map and a corrupted library.** The backup is a backup because the files
in it are old.

Both make the measurement agree with the desired answer rather than with the thing measured.
See `regression-testing`: a check must not be able to produce the thing it measures.

---

## 4. The rebuild

### What becomes derived

| Was | Becomes |
| --- | --- |
| 63 hand-written `S(...)` entries | every directory in `skills/` with a `SKILL.md`, every file in `agents/`, plus the built-ins Claude Code reports |
| hand-written `desc` | the skill's own `description:` frontmatter, already read as `LIVE` |
| hand-written `rel` overlap lists | the measurement `scripts/overlap.mjs` already produces |
| hand-written `w` weight | the size of the `SKILL.md` |
| `ring` (core / phasemap / unmapped / builtin) | derived from the group |

### What stays written by hand, and why

- **`group:` in each `SKILL.md` frontmatter.** Which group a skill belongs to is a judgement
  and cannot be derived from its text — the resemblance guess exists precisely because it
  cannot, and scores 0.03 on its worst case. Putting it in the frontmatter keeps it *with the
  skill*, so it travels, and a skill that moves library cannot lose it.
- **`GROUP_NAME`, `GROUP_ORDER`, `GROUP_ABOUT`, `SECTOR`** — these describe the groups, not
  the skills. They are stable and they are genuinely editorial.
- **The findings** (`FIXES`, `BASIS`, `VIA`, `NEEDS`, `WHERE`) — a finding is an opinion about
  a skill and has to be written. They key by id and are **dropped silently** when the skill is
  gone, rather than keeping a dead node alive to hang off.

### What is deleted

`map/restore-skills/`, `map/fixed-skills/`, `map/skill-fixes.zip` — 7MB of copies of skills.
One of them was being read as the library and is the direct cause of the worst bug found on
3 November. Git keeps every one of them; a file in there is one `git show` away.

### Where the lost finding goes

The map currently expresses "`BUILD-PLAN.md` names skills the library does not have" as 13
phantom nodes. That is a real finding and it survives — as **one line in the findings panel**,
which is where findings belong.

**Touching:** `scripts/build-map.mjs` · `map/skills-data.js` · `map/shell.html` ·
one frontmatter line in each `SKILL.md`.
**Not touching:** the body of any skill · `agents/` · anything in `.github/`.

---

## 5. VERIFY — chosen before the edit

"The amber is gone" is not the check. The amber goes away in both wrong fixes above.

### 1. Every node is a file

```
no node on the map has evidence 'named'          — because the grade becomes unreachable
node count == skill dirs + agents + built-ins    — exactly, not approximately
```

### 2. The library drives it, both ways

Create `skills/zzz-probe/SKILL.md`, rebuild: a node called `zzz-probe` appears. Delete it,
rebuild: the node is gone. **Neither step touches `skills-data.js`.** This is the whole claim
of the rebuild and it is one command either way.

### 3. Nothing silently loses its place

```
every group named in frontmatter exists in GROUP_NAME   — or the build fails
every skill has a group, or a declared guess            — no silent default
```

### 4. The views still work

Radial, board, cluster and flow at 1280/1600/1920: no node outside its own lobe, no two lobes
touching, nothing drawn off-frame, no console errors, selection still moves the map < 0.1 units.

### And prove the check can fail

Not optional. Put one `S('ghost-skill',...)` line back into `skills-data.js` by hand and
rebuild. If a node called `ghost-skill` appears on the map, the inversion has not happened and
every check above is measuring the old shape. Then take it out again.

---

## 6. Undo

Each stage is its own commit. `git revert` any one of them. The deleted backup folders come
back with `git checkout <commit>~1 -- map/restore-skills`. No stage touches a skill's body, so
no skill can be damaged by any of it.

---

## 7. What this does not do

It does not put the 13 skills in `C:\Users\joene\.claude\skills` onto the map. They are in a
folder the build has no access to, and after this rebuild they will be **absent** rather than
amber — cleaner, and still absent. One library remains a thing only the owner of the machine
can arrange, and until it is arranged the map is an honest record of half a library.

It also does not make the map **correct**, only **structurally incapable of the specific lie
it has been telling**. Whether its findings are right is a different question.
