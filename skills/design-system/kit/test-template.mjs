#!/usr/bin/env node
/**
 * Proves the kit on the blank template. The clean template must pass. Each
 * planted fault must FAIL, and name itself. A check never seen to fail has
 * not been shown to work.
 *
 *   node test-template.mjs
 *
 * Each case runs on a fresh copy of template/ in the OS temp folder.
 */
import { cpSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { KIT_DIR } from './lib/config.mjs';

const TEMPLATE = join(KIT_DIR, 'template');
const run = (cwd, script, ...args) => {
  const r = spawnSync(process.execPath, [join(KIT_DIR, script), ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') };
};
const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-kit-'));
  cpSync(TEMPLATE, dir, { recursive: true });
  return dir;
};
const edit = (dir, file, fn) => writeFileSync(join(dir, file), fn(readFileSync(join(dir, file), 'utf8')));
const add = (dir, file, text) => appendFileSync(join(dir, file), '\n' + text + '\n');

let failed = 0;
const results = [];
function expect(name, ok, detail) {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        ${detail.trim().split('\n').join('\n        ')}`}`);
  if (!ok) failed++;
}
/** Plant something, run one script, expect an exit code and every needle in the output. */
function scenario(name, plant, script, args, wantCode, needles) {
  const dir = fresh();
  try {
    plant(dir);
    const r = run(dir, script, ...args);
    const missing = needles.filter((n) => !r.out.includes(n));
    expect(name, r.code === wantCode && !missing.length, `exit ${r.code} (want ${wantCode}); missing ${JSON.stringify(missing)}\n${r.out}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const fault = (name, plant, script, needles, args = []) => scenario(name, plant, script, args, 1, needles);
const clean = (name, plant, script, args = [], needles = []) => scenario(name, plant, script, args, 0, needles);
const none = () => {};
const BTN = 'components/actions/Button.css';
const TSX = 'components/actions/Button.tsx';
const OLD = 'components/legacy/Old.css';

// ── the clean template passes ─────────────────────────────────────────────
clean('clean: tokens --check', none, 'tokens.mjs', ['--check']);
clean('clean: token ratchet (clamp(), var(), width:100%, border-width:1px, @media 640px all pass)', none, 'token-ratchet.mjs');
{
  const dir = fresh();
  const a = run(join(dir, 'second-system'), 'tokens.mjs', '--check');
  const b = run(join(dir, 'second-system'), 'token-ratchet.mjs');
  expect('second system: its own config and prefix pass on their own', a.code === 0 && b.code === 0, a.out + b.out);
  rmSync(dir, { recursive: true, force: true });
}
clean('a touch-only token (inside @media) is listed with its condition', none, 'tokens.mjs', [], ['--ds-tap-min 44px | 48px @((pointer: coarse))']);

// ── the token ratchet: each fault fails by name ───────────────────────────
fault('raw spacing: padding: 13px', (d) => add(d, BTN, '.ds-x { padding: 13px; }'), 'token-ratchet.mjs', ['new raw value', '.ds-x  { padding: 13px }']);
fault('raw colour: color: #ff0000', (d) => add(d, BTN, '.ds-x { color: #ff0000; }'), 'token-ratchet.mjs', ['{ color: #ff0000 }']);
fault('padding: 1px fails although border-width: 1px is allowed', (d) => add(d, BTN, '.ds-x { padding: 1px; }'), 'token-ratchet.mjs', ['{ padding: 1px }']);
fault('two raw values on one line both count', (d) => add(d, BTN, '.ds-x { margin: 3px 5px; }'), 'token-ratchet.mjs', ['{ margin: 3px }', '{ margin: 5px }']);
fault('raw value inside @media names the condition', (d) => add(d, BTN, '@media (pointer: coarse) { .ds-x { gap: 6px; } }'), 'token-ratchet.mjs', ['@media (pointer: coarse)', '{ gap: 6px }']);
fault('new breakpoint: @media (min-width: 900px)', (d) => add(d, BTN, '@media (min-width: 900px) { .ds-x { gap: var(--ds-space-2); } }'), 'token-ratchet.mjs', ['{ @media: 900px }']);
fault('raw value in a local custom property', (d) => add(d, BTN, '.ds-x { --local-gap: 10px; }'), 'token-ratchet.mjs', ['{ --local-gap: 10px }']);
fault('raw motion: transition 200ms', (d) => add(d, BTN, '.ds-x { transition: opacity 200ms ease; }'), 'token-ratchet.mjs', ['{ transition: 200ms }']);
fault('JSX style={{ padding: 12 }}', (d) => edit(d, TSX, (t) => t.replace('opacity: 1 }}', 'opacity: 1, padding: 12 }}')), 'token-ratchet.mjs', ['<button> style  { padding: 12px }']);
fault('JSX number prop size={15}', (d) => edit(d, TSX, (t) => t.replace('size="md"', 'size={15}')), 'token-ratchet.mjs', ['<Icon>  { size=: 15 }']);
fault('generated file says fix upstream', (d) => add(d, 'generated/theme.css', '.ds-theme-x { gap: 7px; }'), 'token-ratchet.mjs', ['{ gap: 7px }', 'fix it upstream (tokens/theme.json']);
fault('one more of a baselined value is new', (d) => add(d, OLD, '.ds-old { margin: 13px; }'), 'token-ratchet.mjs', ['new raw value: components/legacy/Old.css', '{ margin: 13px }']);
fault('allowed entry with no reason', (d) => edit(d, 'docs/design-allowed.json', (t) => t.replace('"reason": "Breakpoint: a token cannot be used inside @media."', '"reason": ""')), 'token-ratchet.mjs', ['has no reason']);
fault('a fixed baseline entry must be pruned', (d) => edit(d, OLD, (t) => t.replace('13px', 'var(--ds-space-2)')), 'token-ratchet.mjs', ['fixed, so lower the baseline', '.ds-old | margin | 13px']);
fault('--prune refuses while a new raw value exists', (d) => add(d, BTN, '.ds-x { gap: 9px; }'), 'token-ratchet.mjs', ['refused', '--prune only lowers'], ['--prune']);
fault('--init refuses when a baseline exists', none, 'token-ratchet.mjs', ['refused', 'is written once'], ['--init']);

// ── baseline behaviour that must pass ─────────────────────────────────────
clean('moving lines does not break the baseline (keyed by place, not line)', (d) => edit(d, OLD, (t) => '\n\n\n/* moved */\n' + t), 'token-ratchet.mjs');
{
  const dir = fresh();
  edit(dir, OLD, (t) => t.replace('13px', 'var(--ds-space-2)'));
  const p = run(dir, 'token-ratchet.mjs', '--prune');
  const c = run(dir, 'token-ratchet.mjs');
  const left = Object.keys(JSON.parse(readFileSync(join(dir, 'docs/design-baseline.json'), 'utf8')).entries).length;
  expect('--prune lowers the baseline, then the check passes', p.code === 0 && c.code === 0 && left === 0, p.out + c.out + `entries left: ${left}`);
  rmSync(dir, { recursive: true, force: true });
}
{
  const dir = fresh();
  rmSync(join(dir, 'docs/design-baseline.json'));
  const i = run(dir, 'token-ratchet.mjs', '--init');
  const c = run(dir, 'token-ratchet.mjs');
  expect('--init with no baseline writes one, then the check passes', i.code === 0 && c.code === 0 && i.out.includes('1 raw values'), i.out + c.out);
  rmSync(dir, { recursive: true, force: true });
}

// ── tokens: each fault fails by name ──────────────────────────────────────
fault('unused token', (d) => edit(d, 'tokens/tokens.css', (t) => t.replace(':root {', ':root {\n  --ds-unused: 2px;')), 'tokens.mjs', ['unused token --ds-unused'], ['--check']);
fault('unknown token', (d) => add(d, BTN, '.ds-x { gap: var(--ds-nope); }'), 'tokens.mjs', ['unknown token --ds-nope', BTN], ['--check']);
fault('stale keptTokens entry (the token is used now)', (d) => add(d, BTN, '.ds-x { gap: var(--ds-space-8); }'), 'tokens.mjs', ['keptTokens lists --ds-space-8, which is used now'], ['--check']);
// 1.0.1: a var() in a comment is not a use; keptTokens can be a file.
clean('a var() inside a comment is not a use (CSS and code)', (d) => {
  add(d, BTN, '/* every value is a var(--ds-*) token, e.g. var(--ds-nope) */');
  add(d, TSX, '// var(--ds-nope-too) in a line comment\n/* var(--ds-nope-three) */');
}, 'tokens.mjs', ['--check']);
fault('…but the same var() outside a comment is still unknown', (d) => add(d, TSX, 'export const x = "var(--ds-nope-too)";'), 'tokens.mjs', ['unknown token --ds-nope-too'], ['--check']);
const keptFile = (d, kept) => {
  writeFileSync(join(d, 'docs/kept.json'), JSON.stringify({ _about: 'notes are skipped', kept }));
  edit(d, 'design-system.config.json', (t) => t.replace(/"keptTokens": \{[^}]*\}/, '"keptTokens": "docs/kept.json"'));
};
clean('keptTokens as a file path (the project keeps its one list)', (d) => keptFile(d, { '--ds-space-8': 'Reserved' }), 'tokens.mjs', ['--check']);
fault('keptTokens file: an unused token not in it fails, naming the file', (d) => keptFile(d, {}), 'tokens.mjs', ['unused token --ds-space-8', 'list it in docs/kept.json'], ['--check']);
fault('keptTokens file: a stale entry fails, naming the file', (d) => keptFile(d, { '--ds-space-8': 'Reserved', '--ds-gone': 'old' }), 'tokens.mjs', ['docs/kept.json lists --ds-gone, which is not defined'], ['--check']);
fault('kit version differs from config',(d) => edit(d, 'design-system.config.json', (t) => t.replace('"kitVersion": "1.0.1"', '"kitVersion": "0.9.0"')), 'tokens.mjs', ['kit version: config says 0.9.0'], ['--check']);

console.log(results.join('\n'));
console.log('\nNot exercised by Phase 1 (read by nothing yet): two groups sharing the short name Button, the nested part Card/Header, the "renamed" entry, groups, themes. Phase 2 tests these.');
console.log(failed ? `\n${failed} FAILED` : `\nall ${results.length} passed`);
process.exit(failed ? 1 : 0);
