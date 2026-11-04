# Decisions — the skills library

Append-only. One entry per decision. Never edit an entry — supersede it with a new one and link back.

**Why this exists:** so a settled call isn't re-litigated, and so a *proposal* never quietly becomes
"what was decided." Every entry names who decided.

These entries were written in the VibeHQ repo, before the library had one of its own. They belong
to the library, so they live here and keep their original numbers. VibeHQ's `docs/decisions.md`
holds a stub pointing here for each of them.

---

## D-010 — The skills library gets a remote: github.com/Joenebula/skills
2026-08-06 · **Decided by:** Joe

**Decision:** the workspace skills library at `../.claude/` is backed by a private GitHub repo,
[Joenebula/skills](https://github.com/Joenebula/skills). It is pushed like any other repo, and
recorded in `CLAUDE.md` and BUILD-PLAN §10 so no session has to guess where it lives.

**Rejected:** leaving it local-only with OneDrive as its sole backup. That library governs every
session, has lost files twice (G-001), and OneDrive is the suspected cause (G-003) — so the one
directory with a proven loss record had the weakest backup in the workspace. See G-008.

**Consequence:** a session with GitHub access can read the skills directly. Claims about what a
skill contains stop being inferred from names.

**Revisit if:** the skills need to be public, or move to a different host.

---

---

## D-012 — Agents do not duplicate the skills they share a name with
2026-08-08 · **Decided by:** Claude, from the pushed library

**Decision:** the four agents that share a name with a skill — `accessibility-auditor`,
`design-system-auditor`, `regression-auditor`, `security-route-auditor` — are recorded in §10 as
enforcement, not duplication. **The skill holds the rules; the agent enforces them on a diff,
read-only, and proposes no edits.**

**Rejected:** the earlier reading, which called the shared names an overlap needing resolution.
That was inferred from names before the files were readable. Every one of the four states the
boundary in its own text: `accessibility-auditor` defers the bar to `[[accessibility]]`,
`regression-auditor` defers the model to `[[regression-testing]]`, `security-route-auditor`
audits the write path that `engineering-standards` defines.

**Consequence:** §10 now lists all five agents. It named one for three weeks, so it described
roughly half of what actually fires.

**Revisit if:** an agent starts proposing edits, which would make it a skill wearing an agent's
name and the boundary would need restating.

---

---

## D-013 — `reviewing-code`, `refactoring` and `simplify` do not overlap
2026-08-08 · **Decided by:** Claude, from the pushed library

**Decision:** no change. The suspected three-way overlap does not survive reading the files.

`reviewing-code` is how to review — priority order, refute before you trust. `refactoring` is how
to restructure without changing behaviour, and already states the boundary itself: *"refactor and
behaviour change never share a commit ([[reviewing-code]])"*. `simplify` is a Claude Code command
that runs a quality-only pass and says in its own description that it does not hunt bugs.

One is a discipline, one is a different activity, one is a tool that performs the discipline.

**Rejected:** adding scope statements to all three. There was nothing to disambiguate; the edit
would have been noise, and noise in a description is what causes the wrong skill to fire.

**Consequence:** this item closes. It was raised as unverified, which is what made closing it
cheap — the reading was the whole cost.

---

---

## D-014 — The map shows its methods, not its reasoning
2026-08-10 · **Decided by:** Claude, at Joe's request

**Decision:** every finding names the mechanism that produced it, and the mechanisms are
listed on the page with what each one cannot tell you and where its setting lives. Seven of
them: read the file, looked on disk, asked git, a document says so, measured the wording,
guessed by resemblance, reasoned from names.

**Rejected:** writing out my reasoning per finding as prose. That is a story told after the
fact, it cannot be checked, and it grows a second explanation that drifts from the code. The
mechanisms *are* the reasoning — there is no separate judgement happening on top of them —
so naming them is both shorter and true.

**Also rejected:** hiding which method is weakest. `reasoned from names` is marked amber on
the page and says outright that both findings which turned out to be wrong (G-009) came from
it. A method that has to declare itself is a method you can distrust on sight, and five
findings still rest on it.

**Consequence:** "how can I change the way you think" has a literal answer — a file and a
number per method. Changing one changes every finding that rested on it, which is the useful
unit of argument; arguing findings one at a time fixes symptoms.

**Revisit if:** a finding is ever reached by something not on the list. That is a gap in the
list, not an exception to it, and the copy for this panel asks the reader to look for exactly
that.

