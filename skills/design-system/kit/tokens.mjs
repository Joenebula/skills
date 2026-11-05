#!/usr/bin/env node
/**
 * ONE TOKEN LIST (R-3). Every check reads tokens from here, so "what is a
 * token" has one answer: a custom property whose name starts with one of the
 * config's `tokenPrefixes`, defined in one of its `tokenFiles`. Each value is
 * kept with its @media condition and selector, so a token set only on touch
 * screens (`--tap-min: 48px` under `(pointer: coarse)`) or only in light mode
 * is not lost.
 *
 *   node tokens.mjs            list the tokens (name, value per condition)
 *   node tokens.mjs --check    fail on: an unused token not in `keptTokens`;
 *                              a var(--x) used in a source with a token prefix
 *                              that is defined nowhere; a stale `keptTokens`
 *                              entry; a kit copy older than the library's
 *
 * Exit 1 on any failure, naming each one.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { declarations } from './lib/css.mjs';
import { loadConfig, findFiles, KIT_VERSION } from './lib/config.mjs';

export function tokenList(cfg) {
  const files = findFiles(cfg.root, cfg.tokenFiles, cfg.ignore);
  const isToken = (p) => cfg.tokenPrefixes.some((x) => p.startsWith(x));
  const byName = new Map();
  for (const file of files) {
    for (const d of declarations(readFileSync(join(cfg.root, file), 'utf8'))) {
      if (!d.property.startsWith('--') || !isToken(d.property)) continue;
      if (!byName.has(d.property)) byName.set(d.property, { name: d.property, values: [] });
      byName.get(d.property).values.push({ value: d.value, media: d.media, selector: d.selector, file });
    }
  }
  return { files, tokens: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

/** Every var(--x) used in the sources, with where. */
export function tokenUses(cfg) {
  const files = findFiles(cfg.root, [...cfg.sources.css, ...(cfg.sources.code ?? []), ...cfg.tokenFiles], cfg.ignore);
  const uses = new Map();
  for (const file of files) {
    const text = readFileSync(join(cfg.root, file), 'utf8');
    for (const m of text.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
      if (!uses.has(m[1])) uses.set(m[1], new Set());
      uses.get(m[1]).add(file);
    }
  }
  return uses;
}

export function checkTokens(cfg) {
  const { tokens } = tokenList(cfg);
  const uses = tokenUses(cfg);
  const names = new Set(tokens.map((t) => t.name));
  const kept = cfg.keptTokens ?? {};
  const problems = [];

  for (const t of tokens) {
    if (!uses.has(t.name) && !(t.name in kept))
      problems.push(`unused token ${t.name}: remove it, or list it in keptTokens with a reason`);
  }
  for (const name of Object.keys(kept)) {
    if (!names.has(name)) problems.push(`keptTokens lists ${name}, which is not defined: remove the entry`);
    else if (uses.has(name)) problems.push(`keptTokens lists ${name}, which is used now: remove the entry`);
    if (!String(kept[name] ?? '').trim()) problems.push(`keptTokens ${name} has no reason`);
  }
  const isToken = (p) => cfg.tokenPrefixes.some((x) => p.startsWith(x));
  for (const [name, files] of uses) {
    if (isToken(name) && !names.has(name))
      problems.push(`unknown token ${name}, used in ${[...files].join(', ')}: define it in a token file, or fix the name`);
  }
  if (cfg.kitVersion && cfg.kitVersion !== KIT_VERSION)
    problems.push(`kit version: config says ${cfg.kitVersion}, this kit copy is ${KIT_VERSION}: update one to match`);
  if (cfg.libraryKit) {
    try {
      const lib = JSON.parse(readFileSync(join(cfg.root, cfg.libraryKit, 'kit-version.json'), 'utf8')).version;
      if (lib !== KIT_VERSION) console.warn(`warning: the library's kit is ${lib}, this copy is ${KIT_VERSION} (G18)`);
    } catch { /* the library is not on this machine (CI): nothing to compare */ }
  }
  return { tokens, problems };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/tokens.mjs')) {
  const cfg = loadConfig();
  if (process.argv.includes('--check')) {
    const { tokens, problems } = checkTokens(cfg);
    if (problems.length) {
      console.error(`tokens: ${problems.length} problem(s) in ${tokens.length} tokens`);
      for (const p of problems) console.error(`  ✗ ${p}`);
      process.exit(1);
    }
    console.log(`tokens: ${tokens.length} tokens, every one used or kept with a reason`);
  } else {
    for (const t of tokenList(cfg).tokens)
      console.log(t.name, t.values.map((v) => `${v.value}${v.media ? ` @(${v.media})` : ''}`).join(' | '));
  }
}
