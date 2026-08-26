#!/usr/bin/env node
/**
 * EXTRACT A DESIGN SYSTEM'S CSS FROM ITS OWN SOURCE. NEVER RETYPE IT.
 *
 * ── WHY THIS FILE EXISTS ──
 * A design system was vendored into a project. Its components inject their own
 * CSS at runtime with `document.createElement('style')`, which does nothing on a
 * server render — so the components were "transcribed" by hand into stylesheets
 * the project controlled. Careful work: every value replaced with the matching
 * design token, and a mechanical check (no raw hex, no raw rgb) passing green.
 *
 * The primary button shipped with **black text**. The design system says white.
 *
 * The cause was not carelessness. The check banned `#fff`, so a token was
 * reached for instead — `--vh-on-accent`, whose NAME reads exactly like "text on
 * an accent button" and whose VALUE is `#0a0012`, near-black. The check went
 * green because a token had been used. The user found it on screen.
 *
 * Re-checking afterwards, the same hand-transcription had also drifted on border
 * width, line height, padding and two font sizes. None of it was visible in a
 * diff, because each line looked like a reasonable token choice.
 *
 *   Hand-copying values is guessing with extra steps.
 *   A token whose NAME reads right is not a token whose VALUE is right.
 *
 * So: don't copy. Extract. This script lifts each component's CSS verbatim out
 * of the file that owns it, and `--check` fails the build the moment the copy
 * and the source disagree.
 *
 * ── USAGE ──
 *   node scripts/extract-design-css.mjs                 # write the stylesheet
 *   node scripts/extract-design-css.mjs --check         # fail if it has drifted
 *   node scripts/extract-design-css.mjs --source <dir> --out <file>
 *
 * Wire `--check` into the project's verify script, next to the other gates.
 *
 * ── WHAT IT ASSUMES, AND WHAT IT DOES WHEN THAT IS UNTRUE ──
 * That each component file contains, at the top level:
 *
 *     const CSS = `... rules ...`;
 *
 * That is the shape the Claude Design export uses. If a system stores its CSS
 * some other way, this script says so per file and **exits non-zero rather than
 * writing a partial stylesheet** — a half-extracted system is worse than none,
 * because the missing half gets hand-written again without anyone noticing.
 *
 * Components that legitimately carry no CSS block (inline-styled ones, usually
 * a logo or an icon wrapper) are listed in the output header, so "not here" is
 * visible rather than assumed.
 *
 * PROVE IT CAN FAIL — mutation test at the foot of this file.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const ACCEPT = args.includes('--accept-overrides');
const SOURCE = valueOf('--source') ?? 'design-system';
const OUT = valueOf('--out') ?? 'app/design-system.generated.css';
const OVERRIDES = valueOf('--overrides') ?? 'app/design-system.overrides.css';

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const COMPONENTS = join(SOURCE, 'components');

if (!existsSync(COMPONENTS)) {
  console.error(`✗ No components directory at ${COMPONENTS}.`);
  console.error(`  Pass --source <dir> if the design system lives somewhere else.`);
  process.exit(1);
}

/** Every .jsx under components/, sorted so the output is deterministic. */
function componentFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...componentFiles(full));
    else if (entry.endsWith('.jsx')) out.push(full);
  }
  return out;
}

const files = componentFiles(COMPONENTS);
if (files.length === 0) {
  console.error(
    `✗ No .jsx components found under ${COMPONENTS} — refusing to write an empty stylesheet.`,
  );
  process.exit(1);
}

const blocks = [];
const noCss = [];
const broken = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const match = text.match(/^const CSS = `([\s\S]*?)`;/m);

  if (!match) {
    // Genuinely absent, or stored in a shape this script does not know. Both
    // are reported; only the second is fatal, and they are told apart by
    // whether the file mentions CSS at all.
    if (/\bCSS\b|createElement\(['"]style['"]\)/.test(text)) broken.push(file);
    else noCss.push(file);
    continue;
  }

  if (match[1].includes('${')) {
    broken.push(`${file} (template interpolation inside the CSS — cannot be lifted verbatim)`);
    continue;
  }

  blocks.push({ file, css: match[1].trim() });
}

if (broken.length > 0) {
  console.error('\n✗ CANNOT EXTRACT EVERY COMPONENT — refusing to write a partial stylesheet.\n');
  for (const b of broken) console.error(`  ${b}`);
  console.error(
    '\nA half-extracted system is worse than none: the missing half gets hand-written\n' +
      'again, and nothing reports it. Fix the extractor or the source, then re-run.\n',
  );
  process.exit(1);
}

const header = [
  '/* GENERATED FILE — DO NOT EDIT.',
  ' *',
  ` * Lifted verbatim from ${SOURCE}/components/ by scripts/extract-design-css.mjs.`,
  ' * Every value here is the design system’s own. Nothing was retyped, converted,',
  ' * or replaced with a token that looked equivalent — that is the entire point.',
  ' *',
  ' * To change any value: change it in the design system and re-run the extractor.',
  ' * Editing this file directly will be caught by `--check` on the next build.',
  ' *',
  ` * ${blocks.length} component${blocks.length === 1 ? '' : 's'} extracted.`,
  ...(noCss.length
    ? [
        ' *',
        ' * Carrying NO css block (inline-styled, nothing to extract) — listed so their',
        ' * absence is visible rather than assumed:',
        ...noCss.map((f) => ` *   ${relative(SOURCE, f).replace(/\\/g, '/')}`),
      ]
    : []),
  ' */',
  '',
].join('\n');

const body = blocks
  .map(({ file, css }) => {
    const name = relative(SOURCE, file).replace(/\\/g, '/');
    return `/* ── ${name} ────────────────────────────────────── */\n${css}\n`;
  })
  .join('\n');

const generated = `${header}\n${body}`;

/** A component's current CSS, keyed the way an override names it. */
const cssByName = new Map(
  blocks.map(({ file, css }) => [relative(SOURCE, file).replace(/\\/g, '/'), css]),
);

/**
 * What an override may point at.
 *
 * Components are keyed above by their extracted CSS. But not everything in a
 * design system is a component: `ui_kits/admin/admin.css` is a plain stylesheet,
 * imported directly rather than extracted — no copy at all, so no drift is
 * possible, which is strictly better than extracting it.
 *
 * It can still be WRONG, though, and it still moves under an override when the
 * design system is re-exported. So an override may name ANY file under the
 * design system, and one that is not a component is fingerprinted by its own
 * contents.
 *
 * Without this the mechanism would guard only the parts that happen to be
 * components — and would be silently absent exactly where somebody assumed it
 * was present.
 */
function trackedContent(name) {
  if (cssByName.has(name)) return cssByName.get(name);
  const path = join(SOURCE, name);
  if (!existsSync(path) || statSync(path).isDirectory()) return undefined;
  return readFileSync(path, 'utf8');
}

const shaOf = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/**
 * Read the `@overrides` / `@source-sha` pairs out of the overrides stylesheet.
 * Parsed line by line so a formatter reflowing the file cannot break it.
 */
function readOverrides(file) {
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, 'utf8').split('\n');
  const found = [];
  let pending = null;
  lines.forEach((line, i) => {
    const target = line.match(/@(?:overrides|tracked)\s+(\S+)/);
    if (target) {
      pending = { name: target[1], line: i + 1, sha: null };
      found.push(pending);
      return;
    }
    const sha = line.match(/@source-sha\s+([0-9a-f]+)/);
    if (sha && pending && !pending.sha) pending.sha = sha[1];
  });
  return found;
}

const overrides = readOverrides(OVERRIDES);
const overrideProblems = [];

for (const o of overrides) {
  const css = trackedContent(o.name);
  if (css === undefined) {
    overrideProblems.push(
      `${OVERRIDES}:${o.line} overrides "${o.name}", which the design system no longer has.\n` +
        `    Either it was renamed upstream, or the override is stale. A person has to decide.` +
        `    (An override may name any file under ${SOURCE}/, not only a component.)`,
    );
    continue;
  }
  const current = shaOf(css);
  if (!o.sha) {
    overrideProblems.push(
      `${OVERRIDES}:${o.line} overrides "${o.name}" but records no @source-sha.\n` +
        `    Without one, a re-export can change that component and nothing will say so.\n` +
        `    Fix: node scripts/extract-design-css.mjs --accept-overrides`,
    );
    continue;
  }
  if (o.sha !== current) {
    overrideProblems.push(
      `"${o.name}" HAS CHANGED IN THE DESIGN SYSTEM since this override was written.\n` +
        `    ${OVERRIDES}:${o.line}   recorded ${o.sha}, now ${current}\n` +
        `    The override still applies, so it may now be redundant, or it may be fighting a\n` +
        `    deliberate upstream decision. Read both, then either delete the override or run:\n` +
        `      node scripts/extract-design-css.mjs --accept-overrides`,
    );
  }
}

if (ACCEPT) {
  if (!existsSync(OVERRIDES)) {
    console.error(`✗ No overrides file at ${OVERRIDES} — nothing to accept.`);
    process.exit(1);
  }
  const lines = readFileSync(OVERRIDES, 'utf8').split('\n');
  let current = null;
  let changed = 0;
  const updated = lines.map((line) => {
    const target = line.match(/@(?:overrides|tracked)\s+(\S+)/);
    if (target) {
      current = target[1];
      return line;
    }
    const sha = line.match(/@source-sha\s+([0-9a-f]+)/);
    const tracked = current ? trackedContent(current) : undefined;
    if (sha && tracked !== undefined) {
      const fresh = shaOf(tracked);
      if (fresh !== sha[1]) changed += 1;
      return line.replace(sha[1], fresh);
    }
    return line;
  });

  // ⚠ A NAME THAT CANNOT BE RESOLVED MUST NOT PASS QUIETLY.
  // --check tells people to run --accept-overrides. If a name is simply
  // mistyped, this loop leaves it untouched, prints a cheerful tick, exits 0,
  // and --check then fails identically - a documented recovery path that
  // cannot recover. The name space is every path in the design system, so a
  // typo is routine rather than unlikely.
  const unresolved = readOverrides(OVERRIDES)
    .filter((o) => trackedContent(o.name) === undefined)
    .map((o) => `${OVERRIDES}:${o.line}  ${o.name}`);
  if (unresolved.length > 0) {
    console.error('');
    console.error('CANNOT ACCEPT - these names do not exist in the design system:');
    console.error('');
    for (const u of unresolved) console.error(`  ${u}`);
    console.error('');
    console.error('Check the spelling, or delete the block. Nothing was written.');
    console.error('');
    process.exit(1);
  }

  writeFileSync(OVERRIDES, updated.join('\n'));
  writeFileSync(OUT, generated);
  console.log(`✓ Re-recorded ${changed} fingerprint(s) in ${OVERRIDES}, and regenerated ${OUT}.`);
  console.log('  This says a person looked. It does not say the overrides are still right.');
  process.exit(0);
}

if (overrideProblems.length > 0) {
  console.error('\n✗ THE DESIGN SYSTEM MOVED UNDER A LOCAL OVERRIDE.\n');
  for (const p of overrideProblems) console.error(`  • ${p}\n`);
  process.exit(1);
}

if (CHECK_ONLY) {
  if (!existsSync(OUT)) {
    console.error(`\n✗ ${OUT} does not exist. Run the extractor without --check.\n`);
    process.exit(1);
  }
  const onDisk = readFileSync(OUT, 'utf8');
  if (onDisk !== generated) {
    console.error(`\n✗ ${OUT} DOES NOT MATCH THE DESIGN SYSTEM.\n`);
    console.error('  Either the design system changed and the stylesheet was not regenerated,');
    console.error('  or somebody edited the generated file by hand. Both are drift.\n');
    console.error(`  Fix: node scripts/extract-design-css.mjs\n`);
    process.exit(1);
  }
  console.log(`✓ ${OUT} matches the design system (${blocks.length} components).`);
  if (overrides.length) {
    console.log(
      `✓ ${overrides.length} local override(s) still match the design system they were written against.`,
    );
  }
  process.exit(0);
}

writeFileSync(OUT, generated);
console.log(`✓ Wrote ${OUT} — ${blocks.length} components lifted verbatim.`);
if (noCss.length) {
  console.log(`  ${noCss.length} component(s) carry no CSS block; named in the file header.`);
}

/**
 * ── LOCAL OVERRIDES, AND THE WARNING THIS EXISTS TO GIVE ──
 *
 * The design system is exported from a design tool. The build sometimes needs a
 * value the export does not have yet — a button font that is too small to read
 * on a real screen, say. Two bad ways to handle that:
 *
 *   · Edit the vendored copy. The next export silently overwrites it, and the
 *     change is gone with nothing to show it ever existed.
 *   · Keep the change only in a person's head, and re-apply it after every
 *     export. That works until the once it does not.
 *
 * So local changes live in their own stylesheet, loaded after the generated one,
 * and each block RECORDS A FINGERPRINT of the component's CSS as it was when the
 * override was written:
 *
 *     ¤ @overrides  components/buttons/Button.jsx
 *     ¤ @source-sha 3f2a1b…
 *     ¤ @why        the exported button font is too small to read
 *
 * A re-export cannot overwrite the override, because the override is not in the
 * design system. And when the design system CHANGES UNDER an override, the
 * fingerprint stops matching and the build FAILS — saying which component moved
 * and that the override needs re-reading. It might now be redundant, or it might
 * now be fighting a deliberate upstream decision. Either way a person decides,
 * rather than nobody noticing.
 *
 * After re-reading it: `--accept-overrides` re-records the fingerprints.
 *
 * ⚠ THE FINGERPRINT IS NOT A SAFETY NET FOR THE OVERRIDE'S CORRECTNESS. It only
 * proves nobody re-exported underneath it unnoticed. Whether the override is
 * still the right thing is a human question, which is exactly why this stops the
 * build instead of printing a note.
 */

/**
 * MUTATION TEST — run when wiring this up, and after any change to this file.
 *
 *   1. Change one value in the design system, e.g. a colour in
 *      components/buttons/Button.jsx
 *   2. node scripts/extract-design-css.mjs --check   -> MUST exit 1
 *   3. node scripts/extract-design-css.mjs           -> regenerates
 *   4. --check again                                 -> MUST pass
 *   5. Put the design system back, repeat 3 and 4
 *
 * Then the other direction, which is the one that matters:
 *   6. Hand-edit a value in the GENERATED file
 *   7. --check  -> MUST exit 1, naming it as drift
 *
 * And the override guard:
 *   8. Change the CSS of a component that an override targets
 *   9. --check  -> MUST exit 1, naming the component and the override
 *  10. --accept-overrides, then --check -> MUST pass
 *  11. Point an override at a component that does not exist
 *  12. --check  -> MUST exit 1
 *
 * If step 2 or step 7 passes, this script is decorative and the whole reason it
 * exists is gone.
 */
