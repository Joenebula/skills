# Skills map — 6 open items

How far each one has got:

| State | Count | Means |
|---|---|---|
| **corrected after I got it wrong** | 2 | I got this wrong. Verifying it will probably close it |
| **confirmed** | 2 | premise checked against the documents. Needs doing |
| **unverified** | 2 | inferred from names. Reading the skill may close it |


**Nothing here is finished.** Drafted means the text is written but not pasted; corrected means I fixed my claim, not that the question is settled. Every one of the 6 still needs something from you:

| What it still needs | Count |
|---|---|
| one push, and eleven others unblock | 1 |
| one command, and it probably closes | 3 |
| reading a skill, then a call | 2 |

Ordered by dependency: several edit the same paragraph, so work top to bottom rather than in parallel. Step 1 may close some of the unverified ones outright.

## Step 0 — orient yourself first. Do not skip this.

You are a Claude Code session. You may or may not be able to reach the files these steps need.
Work that out before touching anything.

Run whichever applies to your shell, and report the results as a small table:

    # PowerShell (Windows)
    git rev-parse --show-toplevel
    Test-Path ..\.claude\skills
    Test-Path ..\.claude\CLAUDE.md
    Test-Path $HOME\.claude\skills
    Test-Path ..\.claude\skills\security\SKILL.md
    Test-Path ..\.claude\skills\ask-dont-guess\SKILL.md

    # bash / zsh
    git rev-parse --show-toplevel
    ls -d ../.claude/skills ../.claude/CLAUDE.md ~/.claude/skills 2>/dev/null
    ls ../.claude/skills/security/SKILL.md ../.claude/skills/ask-dont-guess/SKILL.md 2>/dev/null

Three locations matter, and every step below names which it needs:

- **repo** — the vibehq git repo: its docs and CLAUDE.md.
- **workspace** — the library beside the repo, ../.claude/skills, plus ../.claude/CLAUDE.md.
- **account** — the synced library at ~/.claude/skills.
- **github** — github.com/Joenebula/skills, the workspace library's remote (D-010). If step 1
  has been done, a session with GitHub access can read the library from here even when the
  local paths are unreachable. Check whether it has content before assuming you are blocked.

Then classify every step as one of:

- **RUN NOW** — everything it needs is reachable from here. Do it.
- **RUN ELSEWHERE** — say plainly where, in one line the user can act on, naming the steps and
  the path. For example: “These steps need the account library, which is not reachable from here.
  Open a terminal at C:\Users\joene\OneDrive\Design2\Web\vibehq, start Claude Code, and paste
  this same brief.” Do not attempt them.
- **BLOCKED** — reachable, but something it depends on is missing. Say what.

Report that classification **before** starting work. Then work top to bottom — several steps edit
the same paragraph, so they are ordered, not independent.

**If either SKILL.md check above comes back false, stop and say so.** A missing skill file
outranks every step in this list. Gotcha G-001 in the repo records that the content was never
altered, only deleted whole, so git log --diff-filter=D inside the library will find it.

Ask before creating or deleting any skill.

---
## Step 1 — CLAUDE.md  (available, anchor) — premise confirmed

**Run from:** workspace + repo  ·  **Needs:** one push, and eleven others unblock

**What I observed:** The skills library now has a remote — github.com/Joenebula/skills — but nothing has been pushed to it. The library governs every session, has lost files twice, and OneDrive, the suspected cause, is still its only actual copy. Recorded as G-008 and D-010; CLAUDE.md and §10 both name the remote now. The push unblocks eleven other items as a side effect.

The VibeHQ project agreement, loaded every session. It names three always-on skills, points at four ledgers, and defers the phase→skill map to BUILD-PLAN.md §10.

A folder exists for every skill it reaches for. All 31 are in the workspace library at ../.claude/skills. An earlier build of this map called 28 of them missing, having checked the account-synced copy instead — that was wrong.

But a folder is not a skill. Gotcha G-001 records SKILL.md files vanishing from this library while their folders remained. Nothing here is verified until skills-inventory.ps1 reports hasSkillMd.

What is left is not absence but ambiguity: skills that overlap, documents that have gone stale, and one skill nobody has mapped.

**Fix:**
BASIS: confirmed. The repo exists — github.com/Joenebula/skills, private — and I can reach it. **It is empty.** Nothing has been pushed to it yet, so the skills library still has no off-machine copy.

That library governs every session and has lost files twice (G-001), with OneDrive — its only backup — named as the suspected cause (G-003). Recorded as G-008 and D-010, and CLAUDE.md and section 10 now both name the remote.

Push it:

    cd C:\Users\joene\OneDrive\Design2\Web\.claude
    git remote -v
    git remote add origin https://github.com/Joenebula/skills.git
    git branch -M main
    git push -u origin main

If a remote already exists, skip the add and just push. If the working tree has uncommitted work, commit it first — but stage explicit paths, never git add -A, per G-001.

Once it lands I can read all 31 skills, the workspace CLAUDE.md and the agents directly, and eleven of the twelve items below stop being guesses.

---

## Step 2 — security  (available, Phase H · hardening) — I got this wrong — corrected

**Run from:** workspace  ·  **Needs:** one command, and it probably closes

**What I observed:** §10 records this as deleted from the working tree. A security/ folder is present in the library listing — but gotcha G-001 says its SKILL.md vanished twice while the folder remained. Folder present does not mean skill present. One Test-Path settles it.

**Fix:**
BASIS: withdrawn — do not act on my earlier version of this. I said section 10's Known gap note was stale because a security/ folder appears in the library listing. **That does not follow.** Gotcha G-001 records that skills/security/SKILL.md and skills/ask-dont-guess/SKILL.md vanished from disk while their folders remained, twice. A listing cannot tell a working skill from an empty shell, and the note may still be correct.

Run: Test-Path ../.claude/skills/security/SKILL.md

If it is missing, the note is right and the real task is restoring the file from git — the content was never altered, only deleted whole. If it is present, read it, confirm it still covers non-negotiables 1 and 2, then correct the note and record it in docs/decisions.md.

---

## Step 3 — security-route-auditor  (available, Phase H · hardening) — premise confirmed

**Run from:** workspace + repo  ·  **Needs:** one command, and it probably closes

**What I observed:** Not a skill — an agent. §10 says it "still covers the route layer" for security. This map only covers skills, so agents are invisible to it and there may be others. Security is claimed by four things, not three.

**Fix:**
BASIS: confirmed that it is named; unverified what else exists. Section 10 says the security-route-auditor agent still covers the route layer.

This map only covers skills, so agents are invisible to it — and if there is one, there may be more.

List every agent available to this project, say what each covers, and add them to section 10 alongside the skills. Until that exists, neither the map nor section 10 describes what actually fires.

---

## Step 4 — security-review  (available, Built into Claude Code) — premise unverified

**Run from:** workspace + repo  ·  **Needs:** reading a skill, then a call

**What I observed:** Reviews pending changes on the branch for security issues. Overlaps the workspace security skill and ecommerce-security-audit — three things now claim security, and nothing says which owns what.

**Fix:**
BASIS: unverified — do the reading first. Four things now claim security: the workspace security skill, ecommerce-security-audit, the built-in security-review, and the security-route-auditor agent. Section 10 names only ecommerce-security-audit, and only partially.

I have not read the workspace security skill, so the overlap is inferred from names, not established.

Read all four. If they genuinely overlap, give each a stated scope in section 10 — pre-commit review, full site audit, route layer, and the RLS and service_role rules. If they do not, say so and close this.

Do the stale-note item first; it edits the same section.

---

## Step 5 — simplify  (available, Built into Claude Code) — premise unverified

**Run from:** workspace + repo  ·  **Needs:** reading a skill, then a call

**What I observed:** Reviews changed code for reuse, simplification and efficiency; explicitly does not hunt bugs. Overlaps reviewing-code, which is always-on.

**Fix:**
BASIS: unverified — do the reading first. CLAUDE.md makes reviewing-code always-on. The built-in simplify reviews changed code for reuse and efficiency and explicitly does not hunt bugs. refactoring overlaps both.

I have not read reviewing-code or refactoring, so the overlap is inferred.

Read all three. If there is a real gap, name what owns code review in CLAUDE.md.

The always-on disagreement this used to depend on is already settled — see D-008 in docs/decisions.md.

---

## Step 6 — ask-dont-guess  (available, Not named in §10) — I got this wrong — corrected

**Run from:** workspace  ·  **Needs:** one command, and it probably closes

**What I observed:** Not in vibehq's CLAUDE.md or §10 — but gotcha G-001 records it as 130 lines, 54 inbound links, cited by law number from the workspace CLAUDE.md. Heavily mapped, just not from this repo. Its SKILL.md has vanished from disk twice.

**Fix:**
BASIS: corrected. I said this skill is named nowhere. It is not named in vibehq's CLAUDE.md or section 10 — but gotcha G-001 records it as **130 lines, 54 inbound links, cited by law number from the workspace CLAUDE.md**. It is one of the most heavily referenced things you own, and I called it orphaned because I only looked at one of the two agreements.

G-001 also records that its SKILL.md vanished from disk twice.

Run: Test-Path ../.claude/skills/ask-dont-guess/SKILL.md

If it is missing, restore it from git — 54 inbound links are pointing at nothing. If it is present, no action: it is mapped, just not from this repo.


---

## When you finish

Report three lists: what you changed, what you could not reach and exactly where to run it, and anything you closed because the premise turned out to be wrong. Several of these are marked unverified precisely so that closing them counts as a result.

Then update vibehq/docs/skills-map/skills-map.html — the BASIS entry for each step you settled — and append to docs/decisions.md and docs/gotchas.md as that repo's CLAUDE.md requires. Commit and push: that repo treats an unpushed change as unbacked up.

The workspace library is a git repo (G-001) and now has a remote (D-010): github.com/Joenebula/skills. If you changed a SKILL.md there, commit and push it too — that is the whole point of step 1. The account library at ~/.claude/skills is not a repo, so say which files you touched there, or nothing records it.
