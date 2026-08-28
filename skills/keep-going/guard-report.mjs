#!/usr/bin/env node
/**
 * KEEP-GOING GUARDS.
 *
 * A Claude Code PreToolUse hook. Reads the pending Bash command on stdin and
 * denies a commit that would leave the report behind, or record a task with no
 * spec.
 *
 * TWO RULES, both about the same failure:
 *
 *   1. THE REPORT MUST MOVE WITH THE LOG.
 *      If keep-going/LOG.md is staged and keep-going/REPORT.html is not, stop.
 *
 *   2. A TASK MUST HAVE HAD A SPEC.
 *      If the staged diff adds a task entry to LOG.md and no matching spec
 *      block exists for that task, stop.
 *
 * WHY THESE EXIST AT ALL.
 * The skill already says, explicitly, to rewrite REPORT.html at the end of
 * every task and to write a spec before any edit. Those instructions are
 * correct, have been read many times, and the first of them was skipped anyway
 * - twice in one evening, both times caught by the user rather than by the
 * agent that had just read the rule. That is a compliance failure, not a
 * documentation one, and more words do not touch it. Words for the reasoning;
 * a mechanism for the compliance.
 *
 * WHY STAGED CONTENT AND NOT MODIFICATION TIMES.
 * Comparing mtimes has a false positive: finish the report, then append a
 * closing note to the log, and the report looks older while being perfectly
 * current. A gate that cries wolf gets suppressed, and a suppressed gate is
 * worse than no gate because it also carries false reassurance. What is staged
 * is unambiguous.
 *
 * Rule 2 is deliberately checked against the whole STAGED FILE, not just the
 * added lines, for the same reason. A spec written and committed in an earlier
 * commit is still a spec; failing that case would be a wolf-cry within a week.
 *
 * HONEST LIMITS - do not oversell these to the user:
 *   - They only see commands the agent runs through the Bash tool. A commit
 *     typed in a terminal is not guarded, and is not meant to be.
 *   - A run that never commits never trips them.
 *   - Rule 2 proves a spec was WRITTEN. It cannot prove the spec was any good,
 *     or that the work matched it. That is what the reviewer and the log are
 *     for.
 *   - They FAIL OPEN. If git cannot be read, or stdin is unparseable, the
 *     command proceeds. A broken guard must never be the thing that stops work.
 *
 * INSTALL (see the skill's pre-flight step):
 *   1. copy this file into the project, e.g. scripts/hooks/guard-report.mjs
 *   2. register it as a PreToolUse hook on Bash in the project's
 *      .claude/settings.json
 *   If the project already has a git guard, move these two functions into it
 *   rather than running two hooks that both parse the same command.
 */
import { execSync } from 'node:child_process';
import { stamp } from './heartbeat.mjs';

/**
 * ⚠ THE FIRST THING THIS DOES IS PROVE IT RAN.
 *
 * Both rules below are worthless if nothing ever calls this file — and on a real
 * project nothing did, for a week, and nothing said so. Copy `heartbeat.mjs` in
 * beside this one; step 5 of the skill explains what the project's verify step
 * then does with it.
 */
stamp('guard-report');

const LOG = 'keep-going/LOG.md';
const REPORT = 'keep-going/REPORT.html';

const git = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null; // fail open
  }
};

const stagedFiles = () => {
  const out = git('git diff --cached --name-only');
  return out === null ? null : out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
};

/** RULE 1 — the report must move with the log. */
function reportLeftBehind(files) {
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

/** RULE 2 — a task entry must have a spec for the same task number. */
function specMissing(files) {
  const logPath = files.find((p) => p.endsWith(LOG));
  if (!logPath) return null;

  // Task entries this commit ADDS. Matches "## Task 4 - ..." and
  // "## 2026-08-16 - Task 1 - ...". Pre-flight has no task number, so it is
  // never caught - and by the skill it needs no spec: the queue IS its spec.
  const diff = git(`git diff --cached -U0 -- "${logPath}"`);
  if (diff === null) return null;

  const added = diff.split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  const numbers = new Set();
  for (const line of added) {
    const m = line.match(/^\+#{1,3}\s.*\btask\s*(\d+)/i);
    if (m) numbers.add(m[1]);
  }
  if (numbers.size === 0) return null;

  // The whole staged file, so a spec committed earlier still counts.
  const content = git(`git show ":${logPath}"`);
  if (content === null) return null;

  const missing = [...numbers].filter(
    (n) => !new RegExp(`^#{1,4}\\s*spec\\b[^\\n]*\\btask\\s*${n}\\b`, 'im').test(content),
  );
  if (missing.length === 0) return null;

  const plural = missing.length > 1 ? 's' : '';
  return {
    decision: 'deny',
    why: [
      `${LOG} adds an entry for task${plural} ${missing.join(', ')} with no spec block.`,
      '',
      'The skill writes the spec BEFORE any edit, so the log reads: what I said I would do',
      '-> what I did -> where those differed. A task entry with no spec means either the',
      'spec was never written, or the work started before anyone decided what it was.',
      '',
      `Expected, above the task entry:   ### Spec - task ${missing[0]}`,
      'with its four parts: files touched, files that must not be, the check chosen BEFORE',
      'building, and what could go wrong plus the undo. Plus a Basis line saying whether',
      'this is a transcription of the agreed queue or an invention of your own.',
      '',
      'If this entry genuinely is not a task - a note, a correction, a reconciliation -',
      'do not number it like one. Drop "task N" from the heading and it will pass.',
    ].join('\n'),
  };
}

function decide(command) {
  if (!/\bgit\s+commit\b/.test(command)) return null;
  const files = stagedFiles();
  if (files === null || files.length === 0) return null; // fail open
  return reportLeftBehind(files) ?? specMissing(files);
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

  const verdict = decide(command);
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
