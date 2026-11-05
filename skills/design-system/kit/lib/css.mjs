/**
 * A small CSS reader: every declaration with the selector and the @media
 * condition it sits in. No dependencies.
 *
 * Why not a regex over lines: a value inside @media must be known as such (a
 * token set only on touch screens is still a token, R-3), and a baseline keyed
 * by line number breaks on the first unrelated edit (R-5). So each declaration
 * is returned with its context, and callers key on that, never on a line.
 *
 * Handles: comments, strings, parentheses (a `;` inside url() or a data URI does
 * not end a declaration), nested at-rules (@media, @supports, @layer,
 * @container, @keyframes). Does not handle CSS nesting (`& .x {}`) beyond
 * treating the inner selector as written.
 */

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * @returns {{ selector: string, media: string, property: string, value: string, line: number }[]}
 */
export function declarations(cssText) {
  const css = stripComments(cssText);
  const out = [];
  const stack = []; // { kind: 'media'|'rule'|'keyframes'|'at', text }
  let buf = '';
  let bufStart = 0;
  let depth = 0; // parentheses
  let quote = null;
  let line = 1;

  const context = () => {
    const media = stack.filter((b) => b.kind === 'media').map((b) => b.text).join(' and ');
    const rules = stack.filter((b) => b.kind === 'rule' || b.kind === 'keyframes');
    const selector = rules.map((b) => b.text).join(' ');
    return { media, selector };
  };
  const flushDecl = () => {
    const text = buf.trim();
    buf = '';
    if (!text) return;
    const top = stack[stack.length - 1];
    if (!top || top.kind === 'media' || top.kind === 'at') return; // not inside a rule
    const i = text.indexOf(':');
    if (i <= 0) return;
    const property = text.slice(0, i).trim().toLowerCase();
    const value = text.slice(i + 1).trim();
    if (!/^(--[\w-]+|-?[a-z][a-z-]*)$/.test(property)) return;
    out.push({ ...context(), property, value, line: bufStart });
  };

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '\n') line++;
    if (!buf.trim()) bufStart = line;
    if (quote) {
      buf += c;
      if (c === '\\') { buf += css[++i] ?? ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '(') { depth++; buf += c; continue; }
    if (c === ')') { depth = Math.max(0, depth - 1); buf += c; continue; }
    if (depth > 0) { buf += c; continue; }
    if (c === ';') { flushDecl(); continue; }
    if (c === '{') {
      const prelude = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      if (/^@media\b/i.test(prelude)) stack.push({ kind: 'media', text: prelude.replace(/^@media\s*/i, '') });
      else if (/^@(-webkit-)?keyframes\b/i.test(prelude)) stack.push({ kind: 'keyframes', text: prelude });
      else if (/^@/.test(prelude)) stack.push({ kind: 'at', text: prelude });
      else {
        // a declaration-less rule inside keyframes ("50%") or a normal selector
        stack.push({ kind: 'rule', text: prelude });
      }
      continue;
    }
    if (c === '}') {
      flushDecl();
      stack.pop();
      continue;
    }
    buf += c;
  }
  return out;
}

/** Remove every call to the named functions, nested parentheses included. */
export function removeCalls(value, names) {
  let v = value;
  const re = new RegExp(`\\b(${names.join('|')})\\(`, 'i');
  for (let guard = 0; guard < 200; guard++) {
    const m = re.exec(v);
    if (!m) break;
    let d = 0;
    let j = m.index + m[0].length - 1;
    for (; j < v.length; j++) {
      if (v[j] === '(') d++;
      else if (v[j] === ')' && --d === 0) break;
    }
    v = v.slice(0, m.index) + ' ' + v.slice(j + 1);
  }
  return v;
}
