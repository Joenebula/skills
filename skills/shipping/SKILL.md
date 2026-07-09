---
name: shipping
description: Use BEFORE and DURING any deploy or release — verify → regression-gate → ship → confirm; authorized + controlled deploys only, never mask a verification exit code, and confirm the release is actually live.
---

# Shipping

**"Pushed" is not "live", and a green local build is not a verified release.** A release is done only when the new build is *confirmed serving* to real users — not when the command exited 0, not when the commit landed, not when the push succeeded.

This skill is the controlled-release playbook. Read it before every deploy. Releasing is a sequence with gates, not a single command.

---

## The release sequence

Run these in order. Do not collapse steps. Do not skip a gate because "it's a tiny change."

1. **Verify** — run the full local gauntlet: typecheck, build, and tests. **Capture the REAL exit code of each command** (see hard rule c). A non-zero exit anywhere is a STOP.
2. **Regression-gate** — run the preflight gauntlet and get an explicit GO / NO-GO. Static "it compiles" is not "it still works." Defer to [[regression-testing]] for what the gauntlet must cover, and to [[preflight]] for the orchestrated run (which auditors fire, which layers, the verdict format).
3. **Commit** — a clean, signed commit, **only when the user has authorized this release** (hard rule a). Commit is its own step (hard rule b).
4. **Deploy / push** — only after the commit exists and is confirmed. A separate command.
5. **Confirm live** — poll the deploy target for a versioned marker / health route until the **NEW** build is observably serving (hard rule e). Until then, the release is unconfirmed.
6. **Report** — tell the user what shipped, what they must apply, and the live-confirmation result.

---

## Hard rules

### (a) Authorized deploys only
- Deploy or push ONLY on an explicit go from the user ("ship it", "push", "deploy").
- A bug report is a request to *investigate*, not to release the fix.
- "Continue" / "go on" / "looks good" continues your current work; it is **not** deploy authorization.
- If you're unsure whether you're cleared to release — you're not. Stop and ask. Defer to [[ask-dont-guess]].

### (b) Commit and deploy are SEPARATE steps
- Never chain commit-then-push (`&&` or `;`) in one command.
- If the push is rejected (auth, non-fast-forward, hook failure), a chained command fails as a unit and the **commit work can be lost** or left in a confusing half-state.
- Sequence: commit → confirm the commit exists and is clean → *then* push as its own command.

### (c) Never mask a verification exit code
- Do NOT pipe a build/test into a pager, filter, or any downstream command and then read the **pipe's** exit status. In most shells the exit code you get back is the *last* command in the pipe — a passing filter over a FAILED build reports success.
- Run the verification command on its own. Read **its** exit code. Gate the release on that.
- If you must capture output, write to a file/buffer and inspect the original command's status separately — never let a downstream filter swallow a non-zero build.

### (d) Never build or deploy on a dirty or mutating workspace
- A dev/watch server, a running bundler, or a background task writing to the build output can corrupt or stale the artifact you ship.
- Stop concurrent processes that touch the build dir. Ensure the working tree is clean (no stray uncommitted edits that won't be in the release).
- Build from a known, quiescent state — what you verify must be exactly what you ship.

### (e) Deploy-confirmation: "pushed" ≠ "live"
- A successful push only means the source was accepted. The target may still be building, may have failed the remote build, or may be serving the OLD build from cache.
- **Poll a versioned marker until the new build is confirmed:**
  - a content-hashed asset whose name/hash changes per build, or
  - a health/version route that reports the new build id, commit, or timestamp, or
  - a probe endpoint that flips state once the new code is live.
- Only after the marker shows the NEW build do you tell the user it's done.

---

## Report what shipped

Close every release with a short, concrete report:

| Field | What to state |
|---|---|
| **Change** | What actually shipped (the user-facing/behavioural delta, not the file list). |
| **Migration / env** | Any schema change, migration, env var, secret, or config the user must apply — and whether it's applied yet. |
| **Live confirmation** | The marker you polled and the result ("version route reports new build id", "hashed asset updated"). |
| **Next action** | The recommended follow-up (watch errors, run a smoke pass, monitor a metric, or "nothing — done"). |

---

## Pre-release checklist

- [ ] User gave an explicit go to release (rule a).
- [ ] Workspace clean; no dev/watch/build process mutating output (rule d).
- [ ] Typecheck / build / tests run standalone; real exit codes captured and all zero (rule c).
- [ ] Preflight gauntlet run → explicit GO (sequence step 2; see [[regression-testing]]).
- [ ] Commit created and confirmed as its own step (rule b).
- [ ] Push as a separate command.
- [ ] New build confirmed serving via a versioned marker (rule e).
- [ ] Report delivered: change + migration/env + live-confirmation + next action.

---

## Anti-patterns (do not do these)

- Saying "deployed" / "it's live" right after the push, before confirming the new build serves.
- Piping a build into a pager/filter and treating a clean tail as a passing build.
- Chaining commit-then-push as one command.
- Building while a dev server is running against the same output.
- Treating a bug report or a casual "continue" as permission to release.
- Shipping a change that needs a migration/env without telling the user to apply it.

When any gate is ambiguous, stop and ask — see [[ask-dont-guess]]. For *what* the regression gauntlet must prove before you reach step 3, see [[regression-testing]].
