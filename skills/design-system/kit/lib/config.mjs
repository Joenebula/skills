/**
 * Reads a project's design-system.config.json and finds its files.
 * No project name lives in the kit: everything project-specific is in the
 * config (R1, R-12). See ../ds-config.example.json for every field.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const KIT_VERSION = JSON.parse(readFileSync(join(KIT_DIR, 'kit-version.json'), 'utf8')).version;

const REQUIRED = ['system', 'tokenFiles', 'tokenPrefixes', 'sources', 'baseline', 'allowed'];

export function loadConfig(root = process.cwd(), file = 'design-system.config.json') {
  const path = join(root, file);
  if (!existsSync(path)) throw new Error(`No ${file} in ${root}. Copy the kit's ds-config.example.json.`);
  const cfg = JSON.parse(readFileSync(path, 'utf8'));
  const missing = REQUIRED.filter((k) => !(k in cfg));
  if (missing.length) throw new Error(`${file} is missing: ${missing.join(', ')}`);
  return { root, ...cfg };
}

/** Glob to RegExp: `**` any folders, `*` any name part. Paths use `/`. */
function globRe(glob) {
  const s = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\u0001/g, '.*');
  return new RegExp(`^${s}$`);
}

const ALWAYS_SKIP = new Set(['node_modules', '.git', '.next']);

/** Every file under root matching any of `include`, none of `exclude`. Sorted. */
export function findFiles(root, include, exclude = []) {
  const inc = include.map(globRe);
  const exc = exclude.map(globRe);
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (ALWAYS_SKIP.has(name)) continue;
      const full = join(dir, name);
      const rel = relative(root, full).split('\\').join('/');
      if (exc.some((r) => r.test(rel) || r.test(rel + '/'))) continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (inc.some((r) => r.test(rel))) out.push(rel);
    }
  };
  walk(root);
  return out.sort();
}

export function readJson(root, rel, fallback) {
  const p = join(root, rel);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback;
}
