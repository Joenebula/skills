#!/usr/bin/env node
/**
 * verify.mjs — run this after touching report.html, or the sibling template.
 *
 * IT DOES TWO THINGS.
 *
 *   1. DRIFT CHECK. The stylesheet in report.html is the same one in
 *      keep-going/report-template.html. Two copies of a design is exactly how two
 *      designs start. This compares them and EXITS 1 if they have moved apart.
 *
 *      It is a smoke alarm, not a fix. The fix is one stylesheet, and that means an
 *      approved edit to the other skill. Until then, at least the drift is loud.
 *
 *      If the sibling is simply not there, that is not a failure — this skill stands on
 *      its own. It says so and carries on.
 *
 *   2. REBUILD THE WORKED EXAMPLE. example/report.html is GENERATED, never hand-typed,
 *      because an example with a broken data block would teach the exact wrong lesson.
 *      It is rebuilt from report.html, so it can never drift from the shell either.
 *
 * PROVE IT CAN FAIL BEFORE YOU TRUST IT. Change one character in either stylesheet and
 * run this: it must go red. A check never seen to fail has not been shown to work.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = join(HERE, 'report.html');
const SIBLING = join(HERE, '..', 'keep-going', 'report-template.html');
const OUT = join(HERE, 'example', 'report.html');

/* Line endings are NOT drift. One file checked out CRLF and the other LF the first time
   this ran, and the check went red on two byte-identical stylesheets. A gate that cries
   wolf gets ignored, and an ignored gate is worse than none because it also carries false
   reassurance. So a carriage return is stripped before comparing. Nothing else is normalised - real
   whitespace changes ARE drift. */
const styleOf = (html) => {
  const flat = html.split(String.fromCharCode(13)).join('');
  /* Anchor on a line that STARTS with the tag. The sibling template mentions
     "<style> and </style>" in its own header comment, and a plain indexOf finds that
     prose instead of the real block - which is how this check first went red on two
     byte-identical stylesheets. */
  const a = flat.indexOf('\n<style>');
  const b = flat.indexOf('\n</style>');
  if (a === -1 || b === -1) return null;
  return flat.slice(a + 1, b + 9);
};

let failed = false;
const fail = (msg) => { failed = true; console.error('FAIL  ' + msg); };
const pass = (msg) => console.log('PASS  ' + msg);
const skip = (msg) => console.log('SKIP  ' + msg);

/* ---- 1. drift ---- */
const shell = readFileSync(SHELL, 'utf8');
const mine = styleOf(shell);
if (mine === null) {
  fail('report.html has no <style> block. The shell is broken.');
} else if (!existsSync(SIBLING)) {
  skip('no sibling template to compare against — nothing to drift from.');
} else {
  const theirs = styleOf(readFileSync(SIBLING, 'utf8'));
  if (theirs === null) {
    fail('the sibling template has no <style> block.');
  } else if (theirs === mine) {
    pass('the two stylesheets are identical (' + mine.split('\n').length + ' lines).');
  } else {
    fail(
      'THE TWO STYLESHEETS HAVE DRIFTED APART.\n' +
      '      ' + SHELL + '\n      ' + SIBLING + '\n' +
      '      One of them has been edited and the other has not. Diff them, decide which is\n' +
      '      right, and make them match. Two files both claiming to be "the design" is the\n' +
      '      problem this check exists to make loud.',
    );
  }
}

/* ---- 2. rebuild the worked example ---- */
const NOTES = 'notes/RUN-NOTES.md';
const STAMP = (basis) =>
  `[Copied from a run report written Wednesday 26 August 2026, 17:20.
Basis: ${basis}
If time has passed this may already be out of date: read ${NOTES} FIRST and tell me if this
has already been done or overtaken. Do not act on a stale instruction.]`;

const DISCUSS_FIRST = `Before doing any of it, stop and tell me:
  1. what you understand the job to be, in one line
  2. exactly what you would change - every file, and what happens to each
  3. what is WRONG with this prompt itself - it was written in one pass by a session
     with less context than you have now, and nobody reviewed it. Name at least one
     thing you would do differently, or say explicitly that you checked and found
     nothing worth changing
  4. anything in the notes you think is wrong - check it, don't take it on trust, it
     was written by a previous session that made mistakes
  5. what could go wrong, and what the undo is

Then WAIT. Do not edit, delete, build, install or commit until I reply "go".
If I reply "go" with conditions attached, those conditions win over anything above.`;

const p = (basis, job) => `${STAMP(basis)}\n\n${job}\n\n${DISCUSS_FIRST}`;

const data = {
  project: 'Harbour',
  headline: 'Harbour — rebuilding the booking flow',
  kicker: 'Run report',
  updated: 'Wednesday 26 August 2026, 17:20',
  resumed: 2,
  branch: 'booking-v2',
  startedFrom: 'a91c4f0',
  notesFile: NOTES,

  verdict: {
    tone: 'red',
    lead: 'STOPPED AT TASK 5:',
    text:
      'Four tasks are finished and all 188 tests pass, but the run has halted waiting for a yes on ' +
      'deleting `legacy/` — and nothing built in this run has been opened in a browser, or run ' +
      'against production data.',
  },

  scoreboard: [
    { n: '4', l: 'Done', tone: 'green' },
    { n: '1', l: 'Left', tone: '' },
    { n: '2', l: 'Needs you', tone: 'red' },
    { n: '2', l: 'Not checked', tone: 'amber' },
    { n: '188', l: 'Tests passing', tone: 'green' },
  ],

  needsYou: [
    {
      tag: 'DECIDE',
      tone: 'decide',
      title: 'Task 5 deletes the whole `legacy/` booking engine, and it cannot be undone from the running app',
      body:
        'The queue marked task 5 destructive at setup, so the run stopped rather than running it. ' +
        '**The size has not been measured** — the notes say "roughly 6,000 lines" and explicitly say ' +
        'that number was never counted, so treat it as unknown until somebody counts it. ' +
        '**Undo:** recoverable from the save history, but *not* from the running app once it ships. ' +
        'That is the whole reason this is a stop rather than an assumption.',
      meta: [
        'Blocks: `task 5`',
        'Undo: save history only',
        'Must NOT touch: `payments/`',
      ],
      buttons: [
        {
          kind: 'discuss',
          label: 'Discuss it',
          hint: 'lays out the options, changes nothing',
          prompt: p(
            'the queue\'s task 5 entry plus the destructive-work rule agreed at setup on 24 Aug.',
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} in full before you answer anything.

Task 5 in the queue deletes the legacy/ booking engine. It was marked destructive when the
queue was agreed on 24 Aug, so the run stopped here rather than running it.

I want to decide, not to do it. Tell me:
  - the ACTUAL line and file count of legacy/, measured, not estimated. The notes say
    "roughly 6,000" and say plainly that nobody counted it. Count it.
  - what still imports from legacy/, if anything
  - what breaks in the running app if this goes out and we are wrong
  - the options, including the boring one: leave it, and delete it in a later run

Hard rule carried over from setup: payments/ must not be touched by anything in this queue.

Do not edit, delete, build, install or commit anything in this reply.`,
          ),
        },
      ],
    },
    {
      tag: 'ASSUMED',
      tone: 'assumed',
      title: 'The availability cache expires after 60 seconds, and nobody agreed that number',
      body:
        'The queue did not say, so 60 seconds was chosen during task 2 to keep the run moving. ' +
        'The notes first recorded Ravi as confirming it, then corrected that in the same entry — ' +
        'he said he would look at it. **So it is still open.** ' +
        '**Undo:** cheap. One number in `config/cache.ts`, no migration, no rebuild of anything else.',
      meta: ['Made at: `task 2`, 24 Aug', 'Undo: cheap — one number in `config/cache.ts`'],
      buttons: [
        {
          kind: 'discuss',
          label: 'Discuss it',
          hint: 'what 60 seconds costs, changes nothing',
          prompt: p(
            'the task 2 entry in the notes, including its own correction.',
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} first.

During task 2 the availability cache was given a 60 second lifetime. Nothing in the queue
specified one. The notes record Ravi confirming it and then correct themselves in the same
entry - he said he would look at it, which is not a yes.

Tell me what 60 seconds actually costs: how stale a slot can look to a customer, what a
double-booking window looks like at that setting, and what the sensible values either side
of it would be. Show me where the number lives.

Do not edit, delete, build, install or commit anything in this reply.`,
          ),
        },
        {
          kind: 'act',
          label: 'Change it',
          hint: '…and this one changes the number',
          prompt: p(
            'the task 2 entry in the notes; the new value is not agreed, so this prompt asks for it first.',
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} first.

I want the availability cache lifetime changed from 60 seconds. Ask me what to, if I have
not already said in this message.

It is one number in config/cache.ts. After changing it:
  - run npm test and show me the real output, not a summary
  - run npm run test:calendar as well, because the cache broke the calendar once already
  - the rule adopted during task 2 still stands: EVERY CACHE KEY INCLUDES THE USER ID.
    Do not touch the key shape while you are in there.

Do not touch payments/ - it is out of bounds for this whole queue.`,
          ),
        },
      ],
    },
  ],

  withThem: [
    {
      holder: 'Ravi',
      rows: [
        {
          what: 'Three supplier emails',
          detail:
            'Drafts handed over **25 Aug**. He sends them once Dawn supplies the final pricing table. ' +
            'The writing is finished work and sits under *Done* — the sending is his.',
        },
        {
          what: 'Yes or no on task 5',
          detail:
            'The `legacy/` deletion is waiting on him. It is also in **Needs you** above, because ' +
            'the measured line count he needs in order to answer is still yours to produce.',
        },
      ],
    },
    {
      holder: 'Dawn',
      rows: [
        {
          what: '2026 rate card',
          detail:
            'Chased **25 Aug**, no reply yet. Ravi cannot send the supplier emails without it. ' +
            'Nothing to do here but wait or chase again.',
        },
      ],
    },
  ],

  unchecked: [
    {
      tag: 'UNCHECKED',
      tone: 'unchecked',
      title: '"The new date picker works" — nobody has opened it in a browser. Not once.',
      body:
        '**What is proven:** it compiles, and all 188 tests pass, and lint is clean. ' +
        '**What is not:** that a person can pick a date with it. No browser session has happened ' +
        'in this entire run. Tests of a date picker do not click a date picker.',
      meta: ['From: `task 1`', 'Needs: about 20 minutes in a browser on staging'],
      buttons: [
        {
          kind: 'discuss',
          label: 'Discuss it',
          hint: "what is and isn't proven, changes nothing",
          prompt: p(
            'the task 1 entry in the notes, verbatim.',
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} first.

Task 1 rebuilt the date picker. The suite passes and lint is clean, and nobody has opened it
in a browser.

Tell me exactly what those 188 tests do and do not cover for this component, and what the
shortest browser session is that would settle the rest. Be specific about what "wrong" would
look like on screen.

Do not edit, delete, build, install or commit anything in this reply.`,
          ),
        },
        {
          kind: 'act',
          label: 'Check it',
          hint: '…and this one walks you through it — it settles the migration too',
          prompt: p(
            "task 1 and task 4's notes entries. It transcribes the checks those entries say are missing; it invents no new ones.",
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} first.

Walk me through checking the new date picker on STAGING, in a browser, one step at a time.
This same session also settles the staging half of the task 4 migration, so cover both.

Rules for how you run this:
  - ONE step per message. Then stop and wait for me.
  - For each step tell me what to click, what I should see, and what WRONG looks like.
  - Do not say a step passed until I have told you what I actually saw.
  - At the end, list what is settled and what is still open. The production half of the
    migration will still be open. Say so plainly rather than rounding it up to done.

Do not change any code in this session.`,
          ),
        },
      ],
    },
    {
      tag: 'UNCHECKED',
      tone: 'unchecked',
      title: '"The bookings migration is safe" — it has only ever run against a staging copy',
      body:
        '**What is proven:** `npm run migrate:verify` passes against the staging copy of the data. ' +
        '**What is not:** how it behaves on production data, which is bigger and messier. ' +
        'Nothing available today would settle that half without touching production.',
      meta: [
        'From: `task 4`',
        'Staging half settled by: **Check it** on the card above',
        '**No button** — nothing you could do today would settle the production half',
      ],
      buttons: [
        {
          kind: 'discuss',
          label: 'Discuss it',
          hint: 'what it would take to settle this properly, changes nothing',
          prompt: p(
            'the task 4 entry in the notes.',
            `Project: C:\\Work\\harbour   Branch: booking-v2
Read ${NOTES} first.

Task 4 migrated the bookings table. It has only ever run against a staging copy.

Tell me what would actually settle the production half: a dated restore into staging, a dry
run with a row count reconciliation, something else. Give me the cost and the risk of each,
and say which you would pick. Include the option of not settling it yet.

Do not edit, delete, build, install or commit anything in this reply.`,
          ),
        },
      ],
    },
  ],

  next: [
    {
      tag: 'TASK 5',
      tone: 'next',
      title: 'Delete the `legacy/` booking engine',
      status: { text: '— waiting on a decision', tone: 'grey' },
      body:
        'The last task in the queue. **Done when:** `legacy/` is gone, `npm test` still prints ALL PASS, ' +
        'and nothing imports from it. It cannot start until the `DECIDE` card at the top is answered.',
      meta: [
        'Depends on: tasks 1–4 **✓ all done**',
        'Must NOT touch: `payments/`',
        '**No button** — answer the DECIDE card first',
      ],
    },
  ],

  done: [
    {
      num: '1',
      pill: 'done',
      name: 'The date picker is one component instead of three',
      sections: [
        { h: 'What changed', p: 'Three files became one. 412 lines removed.' },
        {
          h: 'Commands run, and what they actually printed',
          pre: 'npm test      -> ALL PASS  (188 tests)\nnpm run lint  -> ALL PASS',
        },
        {
          h: 'Not checked',
          p: 'Nobody has opened it in a browser. See the first card under **Built, but not properly checked**.',
        },
      ],
    },
    {
      num: '2',
      pill: 'done',
      name: 'Availability lookups now come from a cache',
      sections: [
        { h: 'What changed', p: 'The availability query sits behind a cache with a 60 second lifetime.' },
        { h: 'Commands run, and what they actually printed', pre: 'npm test  -> ALL PASS' },
        {
          h: 'One thing went wrong',
          p:
            'The first attempt keyed the cache on the slot alone, so the test suite returned **another ' +
            "user's availability**. `npm test` caught it — it printed FAILED. Fixed by keying on `userId` " +
            'too. **Rule adopted: every cache key includes the user id.**',
        },
        {
          h: 'Not checked',
          p: 'The 60 second lifetime was chosen, not agreed. See the `ASSUMED` card under **Needs you**.',
        },
      ],
    },
    {
      num: '3',
      pill: 'done',
      name: 'Three supplier notification emails written',
      sections: [
        {
          h: 'What changed',
          p:
            'All three drafts written and handed to Ravi on 25 Aug. **The writing is finished work.** ' +
            'Sending them is his, and waits on the rate card from Dawn — both of which are under ' +
            '*With Ravi* and *With Dawn*, not in your list.',
        },
      ],
    },
    {
      num: '4',
      pill: 'done',
      name: 'The bookings table is migrated',
      sections: [
        { h: 'What changed', p: 'Bookings table migrated to the new shape.' },
        {
          h: 'Commands run, and what they actually printed',
          pre: 'npm test              -> ALL PASS\nnpm run migrate:verify -> ALL PASS  (staging copy)',
        },
        {
          h: 'Not checked',
          p: 'Staging data only. It has never touched production. See the second card under **Built, but not properly checked**.',
        },
      ],
    },
  ],

  ideas: [
    {
      tag: 'IDEA',
      tone: 'idea',
      title: '`utils/date.ts` has two functions that do the same thing',
      body:
        'Spotted during task 4. Left alone deliberately — it is not in the queue and merging them ' +
        'would widen the diff past the point where it is comfortable to review.',
    },
  ],

  log: [
    {
      num: '0',
      pill: 'pend',
      name: 'Setup — 24 Aug, 09:12',
      sections: [
        {
          h: 'What was agreed',
          p:
            'Five tasks, agreed with Ravi. Task 5 marked **destructive — stop and ask before running**. ' +
            'One hard rule carried over from the previous run: **`payments/` must not be touched by ' +
            'anything in this queue.**',
        },
      ],
    },
    {
      num: '—',
      pill: 'done',
      name: 'Settled during the run, and removed from the page above',
      sections: [
        {
          h: 'Removed 25 Aug',
          p:
            '**"Does the cache break the calendar?"** — `npm run test:calendar` was run and watched come ' +
            'back ALL PASS. Resolution observed, so the item was deleted from the page. The line stays ' +
            'here, because otherwise "I dealt with it" and "it was quietly dropped" look identical.',
        },
      ],
    },
  ],
};

/* The worked example ships as a separate download, so it is often simply not here.
   Absent is not broken. */
const HAS_EXAMPLE = existsSync(join(HERE, 'example'));

const BEGIN = HAS_EXAMPLE ? shell.indexOf('<script type="application/json" id="report-data">') : 0;
const END = shell.indexOf('</script>', BEGIN);
if (!HAS_EXAMPLE) {
  skip('no example/ folder here — it ships separately. Nothing to rebuild.');
} else if (BEGIN === -1 || END === -1) {
  fail('the BEGIN/END data markers are missing from report.html — refusing to guess where they go.');
} else {
  const out =
    shell.slice(0, BEGIN) +
    '<script type="application/json" id="report-data">\n' +
    JSON.stringify(data, null, 2).replace(/<\/script>/g, '<\\/script>') +
    '\n' +
    shell.slice(END);
  writeFileSync(OUT, out);

  // Read it back and parse it. Writing a file is not the same as writing a valid one.
  const check = readFileSync(OUT, 'utf8');
  const m = check.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/);
  try {
    const d = JSON.parse(m[1]);
    const n = d.needsYou.length + d.unchecked.length + d.next.length + d.done.length + d.ideas.length;
    pass('example/report.html rebuilt and its data parses (' + n + ' items).');
  } catch (e) {
    fail('example/report.html was written but its data does not parse: ' + e.message);
  }
}

console.log('');
if (failed) {
  console.error('verify.mjs FAILED');
  process.exit(1);
}
console.log('verify.mjs OK');
