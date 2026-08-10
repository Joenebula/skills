/* Does a description say when NOT to fire?
 *
 * scripts/overlap.mjs measures whether two descriptions talk about the same subject. That
 * turned out to be the wrong question for the design skills, and the way it went wrong is
 * worth recording: applying seven routing fixes made the overlap score go UP, not down. The
 * corrected descriptions are longer and more specific about their domain, so they share more
 * domain vocabulary — while being far clearer about which one should fire.
 *
 * Vocabulary overlap is unavoidable between five skills that are all about design. What
 * separates a library that misfires from one that does not is whether each description
 * states a boundary: what it is NOT for, and which skill to use instead. That is structural,
 * so it can be checked.
 *
 * This reports, per skill: does it exclude anything, does it hand off to a named skill, and
 * which skills it names. A skill with neither is one that can only ever compete.
 */
import fs from 'fs';
import path from 'path';

/* Widened after a false negative: knowledge-system-setup states its boundary as "use only
   when the project does NOT already keep its own ledgers ... this skill must not compete
   with it", which is as clear an exclusion as exists and matched none of the first six
   patterns. A boundary is any sentence that narrows when the skill fires, however phrased. */
const EXCLUDES = [
  /\bdo(?:\s+|es\s+)?not\s+(?:use|trigger|apply|already)\b/i,
  /\bdon'?t\s+(?:use|trigger)\b/i,
  /\bmust\s+not\b/i,
  /\bnot\s+for\b/i,
  /\buse\s+only\s+when\b/i,
  /\bonly\s+(?:when|if|for)\b/i,
  /\brather than\b/i,
  /\binstead of\b/i,
  /\bexcept\b/i,
  /\bskip\b/i,
];
const HANDOFF = [
  /\buse\s+[`"']?([a-z0-9][a-z0-9-]{3,})[`"']?\s+(?:instead|for)\b/i,
  /\bdefer(?:s|red)?\s+to\b/i,
  /\btakes?\s+precedence\b/i,
  /\brout(?:e|es|ing)\s+(?:to|away)\b/i,
  /\bfor\s+[^.]{0,40}\buse\s+[`"']?[a-z0-9][a-z0-9-]{3,}/i,
];

export function frontmatter(file){
  const L = fs.readFileSync(file,'utf8').split(/\r?\n/);
  if (L[0].trim() !== '---') return null;
  let key=null; const fm={};
  for (let i=1;i<L.length;i++){
    if (L[i].trim()==='---') break;
    const m=/^([A-Za-z0-9_-]+):\s*(.*)$/.exec(L[i]);
    if (m){ key=m[1].toLowerCase(); fm[key]=m[2].trim(); }
    else if (key && L[i].trim()) fm[key]+=' '+L[i].trim();
  }
  return fm;
}

export function audit(dir){
  const skills = fs.readdirSync(dir)
    .filter(d=>fs.existsSync(path.join(dir,d,'SKILL.md')));
  const names = new Set(skills);
  return skills.map(id=>{
    const fm = frontmatter(path.join(dir,id,'SKILL.md')) || {};
    const d  = fm.description || '';
    // a skill it names that is not itself — the hand-off target
    const mentions = [...names].filter(n=>n!==id &&
      new RegExp('\\b'+n.replace(/[-]/g,'[- ]?')+'\\b','i').test(d));
    return {
      id,
      nameOk: fm.name === id,
      len: d.length,
      excludes: EXCLUDES.some(r=>r.test(d)),
      handsOff: HANDOFF.some(r=>r.test(d)) || mentions.length>0,
      mentions
    };
  });
}

if (process.argv[1] && process.argv[1].endsWith('routing.mjs')) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node scripts/routing.mjs <skills-dir>'); process.exit(1); }
  const rows = audit(dir);
  const bad = rows.filter(r=>!r.nameOk);
  console.log(`${rows.length} skills in ${dir}\n`);
  console.log('  BOUNDARY  HANDOFF  NAME  SKILL                        HANDS OFF TO');
  for (const r of rows.sort((a,b)=>(a.excludes+a.handsOff)-(b.excludes+b.handsOff)))
    console.log('  '+(r.excludes?'  yes   ':'   NO   ')+'  '+(r.handsOff?' yes  ':'  NO  ')
      +'  '+(r.nameOk?' ok ':'BAD ')+'  '+r.id.padEnd(27)+r.mentions.join(', '));
  const none = rows.filter(r=>!r.excludes && !r.handsOff);
  console.log(`\n  ${rows.length-none.length}/${rows.length} state a boundary or a hand-off`);
  if (none.length) console.log('  can only compete: '+none.map(r=>r.id).join(', '));
  if (bad.length)  console.log('  frontmatter name != directory: '+bad.map(r=>r.id).join(', '));
}
