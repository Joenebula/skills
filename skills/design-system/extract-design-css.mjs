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

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const SOURCE = valueOf('--source') ?? 'design-system';
const OUT = valueOf('--out') ?? 'app/design-system.generated.css';

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
  process.exit(0);
}

writeFileSync(OUT, generated);
console.log(`✓ Wrote ${OUT} — ${blocks.length} components lifted verbatim.`);
if (noCss.length) {
  console.log(`  ${noCss.length} component(s) carry no CSS block; named in the file header.`);
}

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
 * If step 2 or step 7 passes, this script is decorative and the whole reason it
 * exists is gone.
 */
