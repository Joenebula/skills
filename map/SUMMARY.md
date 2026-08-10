# Skills map — what it is and what it found

Built 6 Aug 2026. Branch `claude/skills-relationship-viz-y5t67z`.
File: `docs/skills-map/skills-map.html` — open it locally, or the published copy at
https://claude.ai/code/artifact/bce544dc-322f-4bdf-bd29-dc1b9779d6da

> **Correction, 6 Aug.** An earlier build of this map reported 28 skills missing. That was
> wrong. It checked the account-synced skills copy instead of the workspace library at
> `../.claude/skills` (`C:\Users\joene\OneDrive\Design2\Web\.claude\skills`), which the
> documents actually point at. All 31 folders are there. **Nothing is missing.** The findings
> below are the corrected set.

---

## What it is

A single self-contained HTML page. Every skill callable in a session, drawn as a radial map
around VibeHQ's `CLAUDE.md`, with the relationships hidden until you go looking.

| Ring | Holds | Count |
|---|---|---|
| **ALWAYS-ON** | skills `CLAUDE.md` loads every session | 4 |
| **PHASE MAP §10** | skills `BUILD-PLAN.md` §10 assigns to build phases | 26 |
| **NOT IN §10** | skills that exist but no phase claims | 14 |
| **CLAUDE CODE** | built into the harness, no file on disk | 13 |

**57 nodes. 56 available, 1 excluded, 0 missing.**

Skills live in three places: the **workspace library** (`../.claude/skills`, 31 folders — the
§10 set), the **account-synced library** (`~/.claude/skills`, 15), and **Claude Code itself**
(13). Two skills appear in both libraries.

| Status | Means |
|---|---|
| **available** (green) | exists and can be called right now |
| **missing** (red, hollow) | named by `CLAUDE.md` or §10, nothing of that name anywhere — currently none |
| **excluded** (grey, hollow) | exists, but §10 marks it *never use* — only `webaudio-plugin-builder` |

An amber pulse means it needs a change and carries a fix. **13 of 57.**

### How to use it

- **Search** (`/` to focus) matches names, capability tags, phases and description text
- **Browse by capability** — 16 tags in the key. Click one to light every match
- **`?`** beside any key row explains that row
- **Click the amber core** for every binding at once
- **Click any node** for its diagnosis and, if flagged, a fix with a copy button
- **Copy all 13 fixes** — one markdown brief, paste into a fresh session

---

## What it found

The library is essentially complete. **Every skill the documents ask for exists.** What's left
isn't absence — it's ambiguity: skills that overlap, documents gone stale, and one skill nobody
has mapped.

### Five skills claim "build a good-looking page"

`frontend-design`, `mydesignskill`, `artifact-design`, `bootstrap5-migration`,
`public-service-website`. Only `bootstrap5-migration` routes away explicitly — it sends civic
work to `public-service-website`. **`frontend-design` has the broadest description, so it wins
races it should lose**, including against `mydesignskill`, which carries the house rules.
*This is the largest real problem on the map.*

### Three things claim security, and §10 names only one

The workspace `security` skill, `ecommerce-security-audit`, and the built-in `security-review`.
No stated scope for any of them.

### §10 says `security` was deleted. It wasn't.

The note claims it survives only in git HEAD. The folder is present. That note is stale, and
it's the kind of error that makes a document stop being trusted.

### Two skills exist in both libraries

`ecommerce-security-audit` and `webaudio-plugin-builder` sit in the workspace library *and* the
account-synced one. Two copies of a 26-file skill will drift.

### `ask-dont-guess` is named nowhere

It's in the workspace library but appears in neither `CLAUDE.md` nor §10, so it fires only if
its description happens to match. Probably a disposition rather than a task — the same category
as `critical-thinking-partner`.

### Three things claim code review

`reviewing-code` (always-on), the built-in `simplify`, and `refactoring`. `simplify` explicitly
doesn't hunt bugs, so there may be a real gap between them.

### The always-on list disagrees with itself

§10 lists `refactoring` as always-on; `CLAUDE.md` names only three and that isn't one of them.

### Three smaller ones

- **`session-start-hook`** — directory name ≠ frontmatter `name: startup-hook-skill`, and it's
  absent from `manifest.json`
- **`critical-thinking-partner`** — its own description says it shouldn't be a skill. It's a
  disposition; belongs in `CLAUDE.md` or a Style. It's in neither, so it fires by luck
- **`init`** — would regenerate and destroy the hand-maintained `CLAUDE.md`

---

## The fixes

All 13 flagged skills carry a written instruction naming the file to change, what to read
first, and where to stop and ask. None of them is "write a missing skill" any more — they're
routing, scoping and documentation fixes.

Three need a decision rather than an action: which library owns the duplicated skills, whether
`ask-dont-guess` is a disposition or a task, and whether `knowledge-system-setup` or `docs/`
owns project memory.

---

## Worth knowing before changing it

- **The data is hand-written into the file** and was wrong once already. Folder names came from
  a directory listing; **the `SKILL.md` contents of the 31 workspace skills have not been
  read.** Descriptions shown for those are §10's intent, not what the skill says. Node size is
  a placeholder for them.
- **`scripts/skills-inventory.ps1`** scans a skills directory and emits JSON — directory name,
  declared frontmatter name, whether they match, file count, description. Run it against both
  libraries and the map can be rebuilt from real data instead of a screenshot.
- **Capability tags are a browsing index, not a runtime feature.** What decides whether a skill
  fires is its `description`. Tags help you find things; they don't help Claude choose.
- **The layout is verified, not eyeballed.** Checked in headless Chromium at
  1024/1280/1440/1920: zero label overlaps, zero over ring titles, zero off-screen, zero under
  the panel, node positions byte-identical after 3s idle. Re-run those checks if you change
  label sizes or panel width.
- **The map is deliberately still.** Nothing moves unless you interact with it.
- **It scales.** Node radius derives from the arc each ring gives one node, and repulsion
  scales with it. Above ~100 names on screen, labelling everything is suppressed in favour of
  selection and hover. Stress-tested at 280 nodes.
