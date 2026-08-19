#!/usr/bin/env node
/**
 * KEEP-GOING REPORT GUARD.
 *
 * A Claude Code PreToolUse hook. Reads the pending Bash command on stdin and
 * denies a commit that would leave the report behind.
 *
 * THE RULE: if keep-going/LOG.md is staged and keep-going/REPORT.html is not,
 * the commit stops.
 *
 * WHY THIS FILE EXISTS AT ALL.
 * The skill already says, explicitly, to rewrite REPORT.html at the end of
 * every task. That instruction is correct, has been read many times, and was
 * skipped anyway - twice in one evening, both times caught by the user rather
 * than by the agent that had just read the rule. That is a compliance failure,
 * not a documentation one, and more words do not touch it. Words for the
 * reasoning; a mechanism for the compliance.
 *
 * WHY STAGED FILES AND NOT MODIFICATION TIMES.
 * Comparing mtimes has a false positive: finish the report, then append a
 * closing note to the log, and the report looks older while being perfectly
 * current. A gate that cries wolf gets suppressed, and a suppressed gate is
 * worse than no gate because it also carries false reassurance. What is staged
 * is unambiguous.
 *
 * HONEST LIMITS - do not oversell this to the user:
 *   - It only sees commands the agent runs through the Bash tool. A commit
 *     typed in a terminal is not guarded, and is not meant to be.
 *   - A run that never commits never trips it.
 *   - It FAILS OPEN. If git cannot be read, or stdin is unparseable, the
 *     command proceeds. A broken guard must never be the thing that stops work.
 *
 * INSTALL (see the skill's pre-flight step):
 *   1. copy this file into the project, e.g. scripts/hooks/guard-report.mjs
 *   2. register it as a PreToolUse hook on Bash in the project's
 *      .claude/settings.json
 *   If the project already has a git guard, move `reportLeftBehind` into it
 *   rather than running two hooks that both parse the same command.
 */
import { execSync } from 'node:child_process';

const LOG = 'keep-going/LOG.md';
const REPORT = 'keep-going/REPORT.html';

function reportLeftBehind(command) {
  if (!/\bgit\s+commit\b/.test(command)) return null;

  let staged = '';
  try {
    staged = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null; // fail open
  }

  const files = staged.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const logStaged = files.some((p) => p.endsWith(LOG));
  const reportStaged = files.some((p) => p.endsWith(REPORT));
  if (!logStaged || reportStaged) return null;

  return {
    decision: 'deny',
    why: [
      `${LOG} is staged but ${REPORT} is not.`,
      '',
      'The log records that work happened. The report is what the user actually reads.',
      'Committing one without the other is how the report goes stale - and a stale report',
      'is worse than none, because it looks current and quietly says nothing moved.',
      '',
      `Rewrite ${REPORT} so it matches what the log now says, stage it, and commit again.`,
      'A finished task should have left "What\'s next" and appeared under "Done".',
      '',
      'If this genuinely is a log-only change - fixing a typo in an old entry - commit that',
      `file on its own with an explicit path:  git commit -- ${LOG}`,
    ].join('\n'),
  };
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let command = '';
  try {
    command = JSON.parse(raw)?.tool_input?.command ?? '';
  } catch {
    process.exit(0); // unparseable input must never block work
  }
  if (typeof command !== 'string' || command.trim() === '') process.exit(0);

  const verdict = reportLeftBehind(command);
  if (!verdict) process.exit(0); // silent on the overwhelming majority of commands

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: verdict.decision,
        permissionDecisionReason: verdict.why,
      },
    }),
  );
  process.exit(0);
});
