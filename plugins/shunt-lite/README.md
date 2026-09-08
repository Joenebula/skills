# shunt-lite

Stops the expensive model being spent on reading files.

Two parts:

1. **Explore override** — Claude Code already delegates codebase
   exploration to a built-in `Explore` subagent, but it now runs on
   whatever model your session uses. This pins it to Haiku.
2. **Size gate** — a hook that blocks direct reads of large files and
   redirects them to that subagent, so the routing doesn't depend on
   Claude choosing to comply.

Part 1 is the one that saves money. Part 2 makes it reliable.

---

## Before you install: run T1

Two things are unconfirmed on your machines, and both are cheap to check.
Skip this and you may spend an afternoon debugging a hook that was never
allowed to run.

**1. Are hooks allowed?** If MHR sets `allowManagedHooksOnly` in managed
settings, your own hooks are blocked org-wide and the gate cannot work.
The Explore override still will.

**2. What is the field name?** The docs don't pin the field that holds
the path on a `Read` call. The gate checks four plausible names, so it
works either way — but confirming lets you delete the guesswork.

To run it, add this to `~/.claude/settings.json`, replacing the path
with wherever you cloned this repo:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["/absolute/path/to/skills/plugins/shunt-lite/scripts/probe-read-hook.js"]
          }
        ]
      }
    ]
  }
}
```

Start Claude Code, ask it to read any file, then open:

- macOS — `~/.claude/shunt-probe.log`
- Windows — `%USERPROFILE%\.claude\shunt-probe.log`

**Log has entries** → hooks run here. Note which key inside `tool_input`
holds the path.

**Log is empty or missing** → either the hook didn't fire or it errored.
Run `/hooks` in Claude Code to confirm it registered, and `claude --debug`
to see why it didn't run. If hooks are blocked by policy, install Part 1
only and stop there.

Remove the probe block from `settings.json` when you're done.

---

## Install

```bash
git clone https://github.com/Joenebula/skills.git
cd skills
node plugins/shunt-lite/install.js
```

Then, in Claude Code:

```
/plugin marketplace add Joenebula/skills
/plugin install shunt-lite@joenebula
```

Restart Claude Code.

On a private repo the install uses your existing git credentials, so
make sure `gh auth status` is clean first, or use an SSH remote.

### Turning the gate on

The gate does nothing until you set `SHUNT_GATE=1`. That's deliberate —
it's worth having during an audit and a nuisance the rest of the time.

**macOS.** Add an alias to `~/.zshrc`:

```bash
alias claude-audit='SHUNT_GATE=1 claude'
```

**Windows PowerShell.** Add a function to your profile
(`notepad $PROFILE`):

```powershell
function claude-audit { $env:SHUNT_GATE = "1"; claude }
```

Then run `claude-audit` instead of `claude` when you're surveying a
codebase, and `claude` normally.

To change the threshold from its 350-line default, set
`SHUNT_MIN_LINES`.

---

## Checking it works

| Test | How | Pass |
|---|---|---|
| Model routing | Ask something spanning several files, run `/tasks` while it works | Explore row names Haiku |
| Gate fires | With the gate on, ask Claude to read a file over 350 lines | Read is blocked, Claude delegates instead |
| No recursion | Same test, watch it through | The subagent completes. If it reports being blocked, the recursion guard is wrong |
| Quality | Run an audit question with and without the override (`mv ~/.claude/agents/Explore.md` aside) | Answers comparable |
| Saving | Same question, gate off then on, compare `/usage` | Your own number — don't rely on anyone else's |

---

## Turning it off

- **Gate only** — don't set `SHUNT_GATE`, or run `claude` instead of
  `claude-audit`.
- **Explore override** — delete `~/.claude/agents/Explore.md`. The
  built-in agent comes back.
- **Everything** — `/plugin uninstall shunt-lite@joenebula`, then delete
  the agent file.

---

## What this deliberately doesn't do

**Delegated code generation.** Spotify's version also routes boilerplate
writing to the cheap model, straight to disk, unseen. For design-system
work the review risk outweighs the saving.

**Automatic intent detection.** The gate can't tell surveying from
editing, so you tell it, with the toggle. A version that tracks which
files you've edited this session would be smarter and has more to go
wrong. Worth revisiting if the toggle annoys you.

**Promise a number.** Spotify measured ~90% on a Java monorepo with a
different worker model and a network round-trip. Different setup,
different economics. Measure your own.
