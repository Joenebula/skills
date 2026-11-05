#!/usr/bin/env node
/**
 * TOKEN RATCHET. Every colour, space, size, radius, type size, shadow and
 * motion value is a token. A value typed as a number (a "raw value") is either
 * on the allowed list, with a reason, or in the baseline — the raw values the
 * project had on the day the check started. A NEW raw value fails, by name. The
 * baseline can only go down. (PART-NAMES spec §4a–4b, R-4, R-5, R-6, G1, G5.)
 *
 *   node token-ratchet.mjs            check: fail on a new raw value, or on a
 *                                     baseline entry that has been fixed (so
 *                                     the baseline stays exact, and a fixed
 *                                     slot cannot be quietly reused)
 *   node token-ratchet.mjs --prune    lower the baseline to what is left.
 *                                     It only ever removes or lowers: it never
 *                                     adds. There is no "rewrite" switch.
 *   node token-ratchet.mjs --init     write the first baseline. Refused if a
 *                                     baseline already exists.
 *   node token-ratchet.mjs --summary  the baseline grouped by file, kind and
 *                                     property — for the one-time human read
 *                                     (G16), and to plan the clean-up
 *   node token-ratchet.mjs --report <file.json>  every raw value now, for the map
 *
 * What it reads (from design-system.config.json):
 *   sources.css   every stylesheet, generated ones included (R-4)
 *   sources.code  components: style={{…}} values, and width/height/size number
 *                 props such as size={15} (R-6, G1)
 *   @media conditions: their px values are breakpoints, recorded as property
 *                 "@media" (a token cannot be used there; allow them by value)
 *
 * Each entry is keyed by file + @media + selector + property + value, with a
 * count — never by line, so an edit elsewhere in the file moves nothing (R-5).
 * Every raw value on a line counts, not only the first.
 *
 * Not raw: var(), env(), url(), anything inside clamp() when
 * `allowClampBounds` is not false, zero (0, 0px), unitless numbers
 * (line-height: 1.5, font-weight: 600), and keywords (auto, inherit,
 * transparent, currentColor).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { declarations, removeCalls, stripComments } from './lib/css.mjs';
import { loadConfig, findFiles, readJson, KIT_VERSION } from './lib/config.mjs';

const KINDS = {
  spacing: /^(margin|padding)(-[a-z-]+)?$|^(gap|row-gap|column-gap)$|^inset(-[a-z-]+)?$|^(top|right|bottom|left)$/,
  size: /^(min-|max-)?(width|height)$|^(block|inline)-size$|^flex-basis$/,
  radius: /^border(-[a-z]+)*-radius$/,
  border: /^(border|outline)(-(top|right|bottom|left))?(-width)?$|^outline-offset$/,
  type: /^(font-size|font|letter-spacing|line-height)$/,
  shadow: /^(box-shadow|text-shadow)$/,
  motion: /^(transition|animation)(-duration|-delay)?$/,
  colour: /^(color|background(-color|-image)?|border(-[a-z]+)?-color|outline-color|fill|stroke|caret-color|accent-color|text-decoration-color|column-rule-color)$/,
};
const kindOf = (property) => {
  if (property.startsWith('--')) return 'custom-property';
  for (const [k, re] of Object.entries(KINDS)) if (re.test(property)) return k;
  return null;
};

const NAMED = /\b(white|black|red|blue|green|gr[ae]y|yellow|orange|purple|pink|navy|silver|gold)\b/gi;
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\([^()]*\)/gi;
const HEX = /#[0-9a-f]{3,8}\b/gi;
const LENGTH = /(?<![\w#.-])-?(?:\d+\.?\d*|\.\d+)(px|rem|em|vh|vw|dvh|svh|lvh|vmin|vmax|ch|ex)(?![\w-])/gi;
// Percentages are left out on purpose: width: 100% is layout, not a token.
const TIME = /(?<![\w#.-])(?:\d+\.?\d*|\.\d+)(ms|s)(?![\w-])/gi;
const isZero = (v) => /^-?0*\.?0+([a-z%]*)$/i.test(v);

/** The raw values in one property's value. */
export function rawValues(property, value, cfg) {
  const kind = kindOf(property);
  if (!kind) return [];
  let v = value.replace(/!important/i, '');
  v = removeCalls(v, ['var', 'env', 'url', 'attr']);
  if (cfg.allowClampBounds !== false) v = removeCalls(v, ['clamp']);
  v = v.replace(/(["'])(?:\\.|(?!\1).)*\1/g, ' ');
  const out = [];
  const take = (re, k) => {
    v = v.replace(re, (m) => {
      if (!isZero(m)) out.push({ value: m.toLowerCase().replace(/\s+/g, ' '), kind: k });
      return ' ';
    });
  };
  take(COLOUR_FN, 'colour');
  take(HEX, 'colour');
  if (kind === 'colour' || kind === 'border' || kind === 'shadow' || kind === 'custom-property') take(NAMED, 'colour');
  if (kind === 'motion' || kind === 'custom-property') take(TIME, 'motion');
  take(LENGTH, kind === 'colour' ? 'colour' : kind);
  return out;
}

const camelToKebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const UNITLESS = new Set(['line-height', 'opacity', 'z-index', 'flex', 'flex-grow', 'flex-shrink', 'font-weight', 'order']);

function tagBefore(text, index) {
  const before = text.slice(0, index);
  const m = [...before.matchAll(/<([A-Za-z][\w.]*)/g)].pop();
  return m ? `<${m[1]}>` : '<?>';
}

/** Raw values in components: style={{…}} and width/height/size number props. */
function codeEntries(file, text, cfg) {
  const out = [];
  const src = text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  let i = 0;
  while ((i = src.indexOf('style={{', i)) !== -1) {
    const start = i + 'style={{'.length;
    let d = 2, j = start;
    for (; j < src.length && d > 0; j++) {
      if (src[j] === '{') d++;
      else if (src[j] === '}') d--;
    }
    const body = src.slice(start, j - 2);
    const tag = tagBefore(src, i);
    // top-level `key: value` pairs
    let depth = 0, cur = '';
    const parts = [];
    for (const c of body) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
      if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
    }
    parts.push(cur);
    for (const p of parts) {
      const m = p.match(/^\s*['"]?([A-Za-z-]+)['"]?\s*:\s*([\s\S]+?)\s*$/);
      if (!m) continue;
      const property = camelToKebab(m[1]);
      let value = m[2];
      const num = value.match(/^-?\d+(\.\d+)?$/);
      const str = value.match(/^(["'`])([^"'`]*)\1$/);
      if (num) value = UNITLESS.has(property) ? null : `${value}px`;
      else if (str) value = str[2];
      else value = null; // an expression: cannot be judged here
      if (value == null) continue;
      for (const r of rawValues(property, value, cfg))
        out.push({ file, media: '', selector: `${tag} style`, property, ...r });
    }
    i = j;
  }
  for (const m of src.matchAll(/\b(width|height|size)=(?:\{\s*(\d+(?:\.\d+)?)\s*\}|"(\d+(?:\.\d+)?)")/g)) {
    const n = m[2] ?? m[3];
    if (isZero(n)) continue;
    out.push({ file, media: '', selector: tagBefore(src, m.index), property: `${m[1]}=`, value: n, kind: 'size' });
  }
  return out;
}

export function scan(cfg) {
  const tokenFileSet = new Set(findFiles(cfg.root, cfg.tokenFiles, cfg.ignore));
  const isToken = (p) => cfg.tokenPrefixes.some((x) => p.startsWith(x));
  const entries = [];
  const cssFiles = findFiles(cfg.root, cfg.sources.css, cfg.ignore);
  for (const file of cssFiles) {
    const text = readFileSync(join(cfg.root, file), 'utf8');
    for (const d of declarations(text)) {
      // A token's own definition, in a token file, is the token: not raw.
      if (d.property.startsWith('--') && tokenFileSet.has(file) && isToken(d.property)) continue;
      for (const r of rawValues(d.property, d.value, cfg))
        entries.push({ file, media: d.media, selector: d.selector, property: d.property, ...r });
    }
    for (const m of stripComments(text).matchAll(/@media\s*([^{]+)\{/gi))
      for (const b of m[1].matchAll(LENGTH))
        entries.push({ file, media: '', selector: '', property: '@media', value: b[0].toLowerCase(), kind: 'breakpoint' });
  }
  const codeFiles = findFiles(cfg.root, cfg.sources.code ?? [], cfg.ignore);
  for (const file of codeFiles) entries.push(...codeEntries(file, readFileSync(join(cfg.root, file), 'utf8'), cfg));
  return { entries, cssFiles, codeFiles };
}

const keyOf = (e) => [e.file, e.media, e.selector, e.property, e.value].join(' | ');

function allowedMatcher(cfg) {
  const list = readJson(cfg.root, cfg.allowed, { allowed: [] }).allowed ?? [];
  const problems = [];
  const rules = list.map((a, n) => {
    if (!a.reason || !String(a.reason).trim()) problems.push(`allowed entry ${n + 1} (${a.property}: ${a.value}) has no reason`);
    const prop = String(a.property ?? '');
    const pre = prop.startsWith('/') ? new RegExp(prop.slice(1, prop.lastIndexOf('/'))) : null;
    const fre = a.file ? new RegExp(a.file) : null;
    return (e) =>
      (pre ? pre.test(e.property) : e.property === prop) &&
      String(a.value).toLowerCase() === e.value &&
      (!fre || fre.test(e.file));
  });
  return { allowed: (e) => rules.some((r) => r(e)), problems, count: list.length };
}

export function count(entries, allowed) {
  const counts = new Map();
  const sample = new Map();
  for (const e of entries) {
    if (allowed(e)) continue;
    const k = keyOf(e);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    sample.set(k, e);
  }
  return { counts, sample };
}

export function compare(counts, baseline) {
  const fresh = [];
  const fixed = [];
  for (const [k, c] of counts) {
    const b = baseline[k] ?? 0;
    if (c > b) fresh.push({ key: k, extra: c - b });
  }
  for (const [k, b] of Object.entries(baseline)) {
    const c = counts.get(k) ?? 0;
    if (c < b) fixed.push({ key: k, less: b - c });
  }
  return { fresh, fixed };
}

function upstreamNote(cfg, file) {
  const g = cfg.generated?.[file];
  return g ? ` — this file is generated: fix it upstream (${g}), then re-generate` : '';
}

function main() {
  const cfg = loadConfig();
  const args = process.argv.slice(2);
  const { entries, cssFiles, codeFiles } = scan(cfg);
  const { allowed, problems: allowedProblems, count: allowedCount } = allowedMatcher(cfg);
  const { counts, sample } = count(entries, allowed);
  const basePath = join(cfg.root, cfg.baseline);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  if (args.includes('--report')) {
    const out = args[args.indexOf('--report') + 1];
    const rows = [...counts].map(([k, c]) => ({ ...sample.get(k), count: c }));
    writeFileSync(join(cfg.root, out), JSON.stringify({ kitVersion: KIT_VERSION, rows }, null, 1) + '\n');
    console.log(`report: ${rows.length} places, ${total} raw values → ${out}`);
    return;
  }
  if (args.includes('--init')) {
    if (existsSync(basePath)) {
      console.error(`refused: ${cfg.baseline} exists. The baseline is written once; use --prune to lower it.`);
      process.exit(1);
    }
    const entriesObj = Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(basePath, JSON.stringify({ kitVersion: KIT_VERSION, note: 'Raw values on the day the token ratchet started. It only goes down: node token-ratchet.mjs --prune.', entries: entriesObj }, null, 1) + '\n');
    console.log(`baseline written: ${counts.size} places, ${total} raw values (${cssFiles.length} CSS files, ${codeFiles.length} code files)`);
    return;
  }

  const baseline = readJson(cfg.root, cfg.baseline, { entries: {} }).entries ?? {};

  if (args.includes('--summary')) {
    const by = (f) => {
      const m = new Map();
      for (const [k, c] of Object.entries(baseline)) {
        const [file, , , property, value] = k.split(' | ');
        const key = f({ file, property, value });
        m.set(key, (m.get(key) ?? 0) + c);
      }
      return [...m].sort((a, b) => b[1] - a[1]);
    };
    const n = Object.values(baseline).reduce((a, b) => a + b, 0);
    console.log(`BASELINE: ${n} raw values in ${Object.keys(baseline).length} places\n`);
    console.log('By file:');
    for (const [k, c] of by((e) => e.file)) console.log(`  ${String(c).padStart(5)}  ${k}`);
    console.log('\nBy property (top 25):');
    for (const [k, c] of by((e) => e.property).slice(0, 25)) console.log(`  ${String(c).padStart(5)}  ${k}`);
    console.log('\nBy value (top 25):');
    for (const [k, c] of by((e) => e.value).slice(0, 25)) console.log(`  ${String(c).padStart(5)}  ${k}`);
    return;
  }

  const { fresh, fixed } = compare(counts, baseline);

  if (args.includes('--prune')) {
    if (fresh.length) {
      console.error(`refused: ${fresh.length} new raw value(s). --prune only lowers the baseline; fix those first.`);
      process.exit(1);
    }
    const next = {};
    for (const [k, b] of Object.entries(baseline)) {
      const c = Math.min(b, counts.get(k) ?? 0);
      if (c > 0) next[k] = c;
    }
    const doc = readJson(cfg.root, cfg.baseline, {});
    writeFileSync(basePath, JSON.stringify({ ...doc, entries: next }, null, 1) + '\n');
    console.log(`baseline lowered: ${fixed.reduce((a, f) => a + f.less, 0)} raw values fixed`);
    return;
  }

  const problems = [...allowedProblems];
  for (const f of fresh) {
    const e = sample.get(f.key);
    problems.push(`new raw value: ${e.file}  ${e.media ? `@media ${e.media}  ` : ''}${e.selector}  { ${e.property}: ${e.value} }${f.extra > 1 ? ` ×${f.extra}` : ''} — make it a token, or add it to ${cfg.allowed} with a reason${upstreamNote(cfg, e.file)}`);
  }
  for (const f of fixed) problems.push(`fixed, so lower the baseline: ${f.key} (${f.less} fewer) — run: node token-ratchet.mjs --prune`);

  if (problems.length) {
    console.error(`token ratchet: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(`token ratchet: no new raw values. Baseline ${total} raw values in ${counts.size} places; ${allowedCount} allowed rules; ${cssFiles.length} CSS + ${codeFiles.length} code files read.`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/token-ratchet.mjs')) main();
