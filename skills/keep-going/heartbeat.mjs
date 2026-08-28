/**
 * PROOF THAT A HOOK ACTUALLY RAN.
 *
 * Copy this into the project beside the guards (e.g. `scripts/hooks/`) and call
 * `stamp('<guard-name>')` as the FIRST action of every hook.
 *
 * ⚠ WHY IT EXISTS: ABSENCE IS EXACTLY WHAT NOTHING REPORTS.
 *
 * A real project ran for a week with three guards registered, all three scripts
 * correct, and not one of them ever invoked. Claude Code reads a project's
 * `.claude/settings.json` from the folder it was STARTED in, and it was being
 * started one level up — so the settings file was never read and every hook
 * below it was inert.
 *
 * Every symptom pointed elsewhere. The report said "not running". The settings
 * said "registered". The scripts worked when run by hand. Nothing anywhere said
 * "these have never fired", because a thing that never runs produces no output
 * to notice. The guard check written afterwards proved the SCRIPTS refused what
 * they must — and then admitted it could not tell whether the tool was calling
 * them, because nothing had left a trace.
 *
 * This is the trace.
 *
 * ── SESSION ID, NOT A TIMESTAMP ──
 *
 * `stamp()` records which Claude Code session the hook ran in. The guard check
 * compares that against the session it is itself running in: same means it
 * fired, different or missing means it did not. The check runs through the
 * shell, so a live PreToolUse hook stamps the file seconds before the check
 * reads it.
 *
 * A timestamp would need a staleness window, and picking one is guessing — too
 * tight and a slow build cries wolf, too loose and a dead guard reads as alive.
 * The session id needs no window.
 *
 * ── THE TRAP THIS SHIPS PRE-SPRUNG ──
 *
 * The first implementation of the guard check reported "hooks ARE firing" and
 * exited clean on a machine where they provably had not. The check proves a
 * guard discriminates by SPAWNING it several times with several commands — and
 * every one of those spawns ran the stamping code. **The check wrote the
 * evidence it then read.**
 *
 * `GUARD_SELFTEST` below is that fix. Set it when the check spawns the guard as
 * a test, so a test invocation leaves no footprint. Without it the check passes
 * by running, and passing by running is indistinguishable from passing by
 * working.
 *
 * ── IT MUST NEVER BREAK A COMMAND ──
 *
 * A hook runs in front of the user's work. Everything here is wrapped and
 * silent: an unwritable directory, a read-only checkout, a corrupt file all mean
 * "no proof", never "no work". A guard that blocks the thing it protects gets
 * switched off, and then protects nothing.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Walk up from this file until a folder containing `.claude` turns up.
 *
 * ⚠ NOT a fixed number of `dirname` calls. The skill says to put the guards in
 * `scripts/hooks/`, but says "e.g." — and a counted path breaks silently the
 * first time somebody puts them somewhere else, which is the same class of
 * hidden assumption that caused the week above.
 */
function repoRoot() {
  let dir = dirname(fileURLToPath(import.meta.url));
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, '.claude'))) return dir;
    dir = dirname(dir);
  }
  return process.cwd();
}

/** `<repo>/.claude/.guard-heartbeat.json` — gitignore it; it is evidence, not source. */
export const HEARTBEAT = join(repoRoot(), '.claude', '.guard-heartbeat.json');

/**
 * Record that `name` ran, in the session it ran in.
 *
 * Read-modify-write rather than overwrite, so one hook firing never erases
 * another's proof — hooks fire on different actions and must be able to be alive
 * or dead independently.
 */
export function stamp(name) {
  // A test invocation is not a hook firing. See the note above; without this the
  // check supplies its own evidence.
  if (process.env.GUARD_SELFTEST) return;

  try {
    let all = {};
    try {
      all = JSON.parse(readFileSync(HEARTBEAT, 'utf8'));
    } catch {
      // No file yet, or an unreadable one. Start again — a corrupt heartbeat
      // must not stop a hook recording a fresh one.
    }

    all[name] = {
      session: process.env.CLAUDE_CODE_SESSION_ID ?? 'unknown',
      at: new Date().toISOString(),
    };

    mkdirSync(dirname(HEARTBEAT), { recursive: true });
    writeFileSync(HEARTBEAT, JSON.stringify(all, null, 2));
  } catch {
    // Silent on purpose. No proof is survivable; a blocked command is not.
  }
}

/** What was recorded, or `{}` if nothing readable is there. */
export function read() {
  try {
    return JSON.parse(readFileSync(HEARTBEAT, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * The whole verdict, for a project's own verify step.
 *
 * Returns `{ checked, firing, problem }`. `checked:false` means it was not
 * possible to tell — outside Claude Code there is no hook to fire — and the
 * caller must SAY SO rather than pass quietly. A check that silently passes when
 * it did not run is the failure this file exists to end.
 */
export function firingVerdict(name = 'guard-report') {
  const session = process.env.CLAUDE_CODE_SESSION_ID ?? '';
  if (!process.env.CLAUDECODE || !session) {
    return {
      checked: false,
      firing: null,
      problem: null,
      note: `Hook firing NOT CHECKED — not running inside Claude Code, so there is no hook to fire.`,
    };
  }

  const seen = read()[name];
  if (seen?.session === session) {
    return { checked: true, firing: true, problem: null, note: `Hooks ARE firing — ${name} stamped this session.` };
  }

  return {
    checked: true,
    firing: false,
    note: null,
    problem:
      `THE GUARDS ARE NOT FIRING. ${name} did not run for this session, and this very command\n` +
      `      went through Bash — so it should have.\n` +
      `      recorded session: ${seen ? seen.session : '(never run — no heartbeat file)'}\n` +
      `      this session:     ${session}\n` +
      `      The scripts are fine. Claude Code is not asking them, because it reads\n` +
      `      .claude/settings.json from the folder it was STARTED in.\n` +
      `      Fix: quit, cd to the project folder, and start Claude there.`,
  };
}
