/* Build the skills map: your library's data on the shell the demo was used to develop.
 *
 * The two files had drifted into different things — skills-map.html held the real 62 skills
 * on the original shell, copilot-demo.html held invented data on a much better one. This
 * takes the data block out of the first and the everything-else out of the second, and
 * writes one map.
 *
 * It is a build step rather than a hand-edit for the reason that started this: a map that is
 * hand-written is an opinion that rots. Re-run this after scripts/map-scan.ps1 has produced
 * a fresh scan and the map is rebuilt from what is actually on disk.
 *
 *   node scripts/build-map.mjs
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {overlaps} from './overlap.mjs';
import {createRequire} from 'module';
import {execSync} from 'child_process';
const require$ = createRequire(import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA  = path.join(ROOT,'map/skills-data.js');
const SHELL = path.join(ROOT,'map/shell.html');
const OUT   = path.join(ROOT,'map/skills-map.html');
/* The library this map is of. It used to be somewhere else — the map lived in the vibehq
   repo and reached across to a checkout of this one, which meant the build needed a path to
   a repo it did not belong to, and the CI job needed a token to read it.

   Now the map lives in the library. ROOT is the library, so there is nothing to point at and
   nothing to authenticate. SKILLS_REPO stays as an override for anyone building this from
   outside, but the default is simply "here". */
const SKILLS_REPO = process.env.SKILLS_REPO || ROOT;

const DATA_START = '/* ------------------------------------------------------------------ data';
const DATA_END   = '/* ------------------------------------------------------------------ setup */';

const slice = (src,label) => {
  const a = src.indexOf(DATA_START), b = src.indexOf(DATA_END);
  if (a < 0 || b < 0 || b < a) throw new Error(`data block boundaries not found in ${label}`);
  return {head: src.slice(0,a), body: src.slice(a,b), tail: src.slice(b)};
};

// The two inputs are kept apart on purpose. Earlier this script read and wrote the same file,
// which meant a second run spliced its own output back in and appended everything twice. The
// data and the shell are now their own files; skills-map.html is only ever an output.
if (!fs.existsSync(DATA))  throw new Error('missing '+path.relative(ROOT,DATA));
if (!fs.existsSync(SHELL)) throw new Error('missing '+path.relative(ROOT,SHELL));
const body  = fs.readFileSync(DATA,'utf8');
const shell = slice(fs.readFileSync(SHELL,'utf8'),'shell.html');
const map   = {body};

// the real data, on the better shell
let out = shell.head + map.body + shell.tail;

/* ---- put the shell's Copilot vocabulary back to this library's ------------------------ */
const POST=[];
const swap = (a,b,required=true) => {
  if (!out.includes(a)) { if (required) throw new Error('MISSING: '+a.slice(0,70)); return; }
  POST.push([a,b]); out = out.split(a).join(b);
};

// rings
swap("const RINGCOL={org:'--r1',repo:'--r2',scoped:'--r3',ondemand:'--r4',ext:'--r5'};",
     "const RINGCOL={core:'--r1',phasemap:'--r2',unmapped:'--r3',builtin:'--r5'};");
// mark the outline treatment on the node group at draw time
swap("  g.appendChild(mk('circle',{r:7,fill:'transparent'}));\n  gNode.appendChild(g);",
     "  if(EVIDENCE[n.id]==='named') g.classList.add('named');\n"+
     "  g.appendChild(mk('circle',{r:7,fill:'transparent'}));\n  gNode.appendChild(g);");
swap("if(R.key==='scoped'||R.key==='ondemand'){","if(R.key==='phasemap'){");
swap("const keys=[...DOMAINS,'never'].filter(k=>groups[k]);",
     "const keys=['A','B','C','D','E','F','G','H','S2','never'].filter(k=>groups[k]);");
// The new shell places nodes in an annulus band rather than on a hairline circle — it was the
// only way 1024 nodes stopped overlapping. The real RINGS predate that and carry `frac` only,
// so give each one a band around its radius. Without this, RBAND[k] is undefined and every
// node's radius read fails.
swap(`const RINGS=[
  {key:'core',    label:'Always-on',    frac:.26,  col:'--r1'},
  {key:'phasemap',label:'In the build plan',frac:.52,  col:'--r2'},
  {key:'unmapped',label:'Not in the build plan',   frac:.755, col:'--r3'},
  {key:'builtin', label:'Claude Code',  frac:.975, col:'--r5'}
];`,
`const RINGS=[
  {key:'core',    label:'Always-on',              frac:.26,  band:[.215,.305], col:'--r1'},
  {key:'phasemap',label:'In the build plan',      frac:.52,  band:[.435,.605], col:'--r2'},
  {key:'unmapped',label:'Not in the build plan',  frac:.755, band:[.690,.820], col:'--r3'},
  {key:'builtin', label:'Claude Code',            frac:.975, band:[.930,1.00], col:'--r5'}
];`);

// the drift speeds were keyed by the Copilot rings
swap("const SPIN={org:.100, repo:-.062, scoped:.041, ondemand:-.028, ext:.019};",
     "const SPIN={core:.100, phasemap:-.062, unmapped:.041, builtin:.019};", false);
// the root lights what loads unconditionally — here that is the always-on ring
swap("    ? N.filter(n=>n.ring==='org').map(n=>n.id)",
     "    ? N.filter(n=>n.ring==='core').map(n=>n.id)");
swap(`  const ids = id===ANCHOR.id
    ? N.filter(n=>n.ring==='org').map(n=>n.id)`,
`  const ids = id===ANCHOR.id
    ? N.filter(n=>n.ring==='core').map(n=>n.id)`, false);

// the key
swap(`      <span class="byring tog" data-r="org"><i style="background:var(--r1)"></i>organisation</span>
      <span class="byring tog" data-r="repo"><i style="background:var(--r2)"></i>repository</span>
      <span class="byring tog" data-r="scoped"><i style="background:var(--r3)"></i>path-scoped</span>
      <span class="byring tog" data-r="ondemand"><i style="background:var(--r4)"></i>on demand</span>
      <span class="byring tog" data-r="ext"><i style="background:var(--r5)"></i>extensions</span>`,
`      <span class="byring tog" data-r="core"><i style="background:var(--r1)"></i>always-on</span>
      <span class="byring tog" data-r="phasemap"><i style="background:var(--r2)"></i>in the build plan</span>
      <span class="byring tog" data-r="unmapped"><i style="background:var(--r3)"></i>not in the build plan</span>
      <span class="byring tog" data-r="builtin"><i style="background:var(--r5)"></i>Claude Code</span>`);
swap('<b>Always-on</b> — the file loads on every request in its scope, before the prompt is read. Organisation and repository surfaces are always-on.<br><br><b>Conditional</b> — it loads only when something matches: an <code>applyTo</code> glob, or a deliberate invocation.',
     '<b>Always-on</b> — <code>CLAUDE.md</code> loads the skill in every session, before any task is picked.<br><br><b>Conditional</b> — it loads only when something matches: the work reaching its build step, or you invoking it by name.<br><br><b>The build plan</b> is <code>docs/BUILD-PLAN.md</code>, and it splits VibeHQ into <b>eight numbered steps in order</b> — 1 skeleton, 2 database, 3 admin, 4 public site, 5 feeds, 6 ads, 7 analytics, 8 hardening. Section 10 lists which skills belong to which step. A skill <b>in the build plan</b> has a step; one <b>not in the build plan</b> is never named there, so nothing says when it should fire.');
swap('<span class="always tog" data-k="agent"><i class="dot-agent"></i>custom agent</span>',
     `<span class="always tog" data-k="agent"><i class="dot-agent"></i>agent (not a skill)</span>
      <span class="always tog" data-k="unverified"><i class="dot-named"></i>unverified</span>`);
// the unverified marker: a hollow ring, so it reads as an outline of a node rather than a node
swap(`  .ringkey i.dot-done{background:transparent;box-shadow:inset 0 0 0 1.5px var(--present)}`,
`  .ringkey i.dot-done{background:transparent;box-shadow:inset 0 0 0 1.5px var(--present)}
  .ringkey i.dot-named{background:transparent;box-shadow:inset 0 0 0 1.5px var(--ink3)}
  /* A node the map only has a name for is drawn as an outline of a node. It is not the
     same as missing — missing means looked for and not found. This means not looked at. */
  .node.named .dot{fill-opacity:.16}
  .d-ev{margin-top:13px;font-size:13px;line-height:1.55;color:var(--ink2);
    background:rgba(140,170,235,.07);border-radius:8px;padding:10px 12px}
  .d-ev .evlab{display:block;font-size:13px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;margin-bottom:5px}
  .d-ev.seen .evlab{color:var(--present)}
  .d-ev.loaded .evlab{color:var(--r3)}
  .d-ev.named{background:rgba(242,160,60,.10)}
  .d-ev.named .evlab{color:var(--amber)}
  .d-ev code{font-family:var(--mono);font-size:12px;color:var(--r3)}
  .d-ev .evbasis{display:block;margin-top:7px;color:var(--ink3);font-size:13px}`);

// title, core label, demo notices
swap('<title>Meridian — Copilot Enterprise map (demo)</title>',
     '<title>My skills — relationship map</title>');
swap("aT.textContent=COMPANY.toUpperCase();","aT.textContent='CLAUDE.md';");
swap("aT2.textContent='ENTERPRISE';","aT2.textContent='the agreement';");
// The demo's "synthetic data" flag used to be deleted here. The slot is now filled at runtime
// — it says where the data came from, or that every item is closed — so the build leaves both
// the element and its stylesheet rule alone.

/* ---- the headline count has to agree with the panel ------------------------------------
   "available 62" was counting the hand-written status field, so it called a skill available
   on the strength of a table naming it. A node the map has only a name for is not available;
   it is unestablished. The chip now counts what has actually been seen or loaded, and the
   unverified chip carries the rest so the four numbers add up to the node count. */
swap("$('k-p').textContent=N.filter(n=>statusOf(n)==='present').length;",
     "$('k-p').textContent=N.filter(n=>statusOf(n)==='present'&&EVIDENCE[n.id]!=='named').length;");
swap(`      <span class="always tog" data-k="unverified"><i class="dot-named"></i>unverified</span>`,
     `      <span class="always tog" data-k="unverified"><i class="dot-named"></i>unverified<b id="k-u"></b></span>`);
swap("$('k-n').textContent=N.filter(n=>statusOf(n)==='never').length;",
     "$('k-n').textContent=N.filter(n=>statusOf(n)==='never').length;\n"+
     "$('k-u').textContent=' '+N.filter(n=>EVIDENCE[n.id]==='named').length;");
swap(`  .ringkey i{width:8px;height:8px;border-radius:50%;flex:none}`,
     `  .ringkey i{width:8px;height:8px;border-radius:50%;flex:none}
  .ringkey b{font-family:var(--mono);font-size:13px;color:var(--ink3);font-weight:400}`);

// the counter tooltip quoted library sizes that were taken from a document, not from disk
swap(`data-tip="<b>Available</b> — the file exists and Copilot can load it. <b>Missing</b> — referenced by another file, or by an <code>applyTo</code> glob, with nothing of that name in the repository. <b>Retired</b> — still present but marked do-not-use; it keeps loading until someone deletes it, which is the point of showing it.<br><br>Click any of the three to filter.">`,
     `data-tip="<b>Available</b> — established: a <code>SKILL.md</code> was found on disk, or Claude Code lists it among this session's skills. <b>15 files seen, 14 loaded.</b><br><br><b>Missing</b> — looked for and not found. Nothing is in this state.<br><br><b>Excluded</b> — the build plan marks it <b>never use</b>. Only <code>webaudio-plugin-builder</code>.<br><br><b>Unverified</b> — in the card below. 34 nodes are names taken from the build plan (<code>BUILD-PLAN.md</code>) or a <code>CLAUDE.md</code> with no file ever opened, because your workspace library is not in this checkout. They are not counted as available.<br><br>Click any of them to filter.">`);

// the runbook heading
swap('return `# ${COMPANY} · Copilot Enterprise — ${rows.length} open items\\n\\n`+\n    "> **Synthetic demo.** Generated data, invented company, invented files. Not a real audit,\\n> and not safe to run against a real repository.\\n\\n"+',
     'return `# Skills map — ${rows.length} open items\\n\\n`+');

/* ---- location: these are files on your disk, not URLs ---------------------------------- */
const LOC = `/* ---- where a thing actually lives ----------------------------------------------------
   These are files on your machine, not URLs, so the panel offers the path to copy rather
   than a link to follow. WHERE already records which library a fix has to be applied in;
   this is the path to the skill itself. */
const LIBRARY='../.claude';
function locationOf(id){
  const n = IDX[id]!==undefined ? N[IDX[id]] : null;
  if(!n) return null;
  if(n.src==='agent')   return {repo:'agents',   path:LIBRARY+'/agents/'+id+'.md',
                                url:LIBRARY+'/agents/'+id+'.md',
                                short:'agents · '+id+'.md'};
  if(n.src==='builtin') return {repo:'built in', path:'no file — built into Claude Code',
                                url:'built into Claude Code — there is no file to open',
                                short:'built into Claude Code · no file'};
  if(n.src==='repo root')return{repo:'repo',     path:'CLAUDE.md',
                                url:'CLAUDE.md',short:'vibehq · CLAUDE.md'};
  const lib = n.src==='account' ? '~/.claude' : LIBRARY;
  return {repo:n.src, path:lib+'/skills/'+id+'/SKILL.md',
          url:lib+'/skills/'+id+'/SKILL.md',
          short:(n.src==='account'?'account':'workspace')+' · skills/'+id+'/SKILL.md'};
}
`;
// appended below, once the overlap table has been measured
swap('      <div class="locnote">Invented repository — this resolves to nothing.</div>',
     '      <div class="locnote">A path on your machine. Copy it and open it there.</div>');

// Every open panel now states how well its subject is established, before the description.
// Without it the panel reads with the same confidence whether the file was opened or the
// name was lifted out of a table.
swap(`    <div class="d-desc">\${n.desc||'<i>No note written for this one yet.</i>'}</div>`,
`    \${n.ring&&EVIDENCE[id]?\`<div class="d-ev \${EVIDENCE[id]}">
      <span class="evlab">\${EV_LABEL[EVIDENCE[id]]}</span>\${EV_NOTE[EVIDENCE[id]]}
      <span class="evbasis">Established from: \${EV_BASIS}</span></div>\`:''}
    <div class="d-desc">\${n.desc||'<i>No note written for this one yet.</i>'}</div>`);
swap('<button class="loccopy" data-loc="1">Copy link</button>',
     '<button class="loccopy" data-loc="1">Copy path</button>');

/* ---- every skill belongs to exactly one column -----------------------------------------
   The board used to carry a column headed UNASSIGNED holding eighteen skills, which is a
   bucket rather than a group and says nothing about any of them. Every skill now names the
   job it does. This fails the build rather than the page if that stops being true, because
   the failure mode is silent: a new skill with no group would simply appear in whichever
   column the fallback happens to pick. */
{
  const ids = [...map.body.matchAll(/^ S\('([a-z0-9-]+)'/gm)].map(m=>m[1]);
  const gm  = /const GROUP=\{([\s\S]*?)\n\};/.exec(map.body);
  const om  = /const GROUP_ORDER=\[([\s\S]*?)\];/.exec(map.body);
  const nm  = /const GROUP_NAME=\{([\s\S]*?)\n\};/.exec(map.body);
  if(!gm||!om||!nm) throw new Error('GROUP, GROUP_ORDER or GROUP_NAME missing from skills-data.js');
  const grouped = new Map([...gm[1].matchAll(/'([a-z0-9-]+)'\s*:\s*'([A-Za-z0-9]+)'/g)]
    .map(m=>[m[1],m[2]]));
  const order = [...om[1].matchAll(/'([A-Za-z0-9]+)'/g)].map(m=>m[1]);
  const named = [...nm[1].matchAll(/^\s*([A-Za-z0-9]+)\s*:\s*\[/gm)].map(m=>m[1]);
  const ungrouped = ids.filter(i=>!grouped.has(i));
  const phantom   = [...grouped.keys()].filter(k=>!ids.includes(k));
  const used      = [...new Set(grouped.values())];
  const unordered = used.filter(g=>!order.includes(g));
  const unnamed   = used.filter(g=>!named.includes(g));
  if(ungrouped.length) throw new Error('no GROUP for: '+ungrouped.join(', '));
  if(phantom.length)   throw new Error('GROUP names a skill that does not exist: '+phantom.join(', '));
  if(unordered.length) throw new Error('group missing from GROUP_ORDER: '+unordered.join(', '));
  if(unnamed.length)   throw new Error('group missing from GROUP_NAME: '+unnamed.join(', '));
  const tally = ids.reduce((a,i)=>((a[grouped.get(i)]=(a[grouped.get(i)]||0)+1),a),{});
  console.log('  columns   '+order.filter(g=>tally[g]).map(g=>g+' '+tally[g]).join(' · '));
}

/* ---- evidence: what was seen, versus what a document merely names ----------------------
   The map used to draw a skill read out of BUILD-PLAN.md §10 exactly like a skill whose
   file had been opened. That made the whole thing unfalsifiable — you could not tell a
   fact from a claim by looking. This grades every node from what is actually checkable
   here, and the map draws and filters on the result.

   Three states, and only one of them is an opinion:
     seen   a directory with a SKILL.md was found on disk
     loaded Claude Code lists it among the skills available this session
     named  a document names it and nobody has opened the file

   `named` is not the same as absent — it means unchecked. It used to cover most of the map,
   because the workspace library only existed on Joe's machine. Now that the library is
   pushed to github.com/Joenebula/skills and fetched into SKILLS_REPO, its files are read
   directly and `named` should stay at zero. If it climbs, a document is naming something the
   library does not have. */
const ACCOUNT_LIB = process.env.HOME ? path.join(process.env.HOME,'.claude/skills') : null;
const SCAN = path.join(ROOT,'map/scan.json');
const seen = new Set();
for (const dir of [ACCOUNT_LIB, path.join(ROOT,'map/restore-skills/skills'),
                   path.join(SKILLS_REPO,'skills')]) {
  if (!dir || !fs.existsSync(dir)) continue;
  for (const d of fs.readdirSync(dir))
    if (fs.existsSync(path.join(dir,d,'SKILL.md'))) seen.add(d);
}
// agents are single files rather than directories, and are just as seen
{ const ad = path.join(SKILLS_REPO,'agents');
  if (fs.existsSync(ad)) for (const f of fs.readdirSync(ad))
    if (f.endsWith('.md')) seen.add(f.replace(/\.md$/,'')); }
// which commit of the library this build actually read, so the map can say so rather than
// claiming "your library" and leaving you to trust it
let libStamp = null;
if (fs.existsSync(path.join(SKILLS_REPO,'.git'))) {
  try {
    libStamp = execSync(`git -C ${SKILLS_REPO} log -1 --format=%h\\ %ad --date=short`,
      {encoding:'utf8'}).trim().replace(/^(\S+)\s+(\S+)$/,'commit $1, $2');
  } catch { libStamp = 'a local copy'; }
}
// a scan from the real machine, if one has been committed, outranks everything above
let scanStamp = null;
if (fs.existsSync(SCAN)) {
  const scan = JSON.parse(fs.readFileSync(SCAN,'utf8'));
  scanStamp = scan.timestamp || scan.generated || 'committed scan';
  for (const s of (scan.skills||[])) if (s.hasSkillMd) seen.add(s.directory||s.declaredName);
}
// the skills Claude Code itself lists this session — loaded, so real, but with no file to open
const LOADED = ['dataviz','artifact-design','artifact-diagramming','artifact-capabilities',
  'update-config','keybindings-help','code-review','simplify','fewer-permission-prompts',
  'loop','claude-api','run','init','security-review'];

const idsIn = [...map.body.matchAll(/^ S\('([a-z0-9-]+)'/gm)].map(m=>m[1]);
const EV = {};
for (const id of idsIn) EV[id] = seen.has(id) ? 'seen' : LOADED.includes(id) ? 'loaded' : 'named';
const tally = idsIn.reduce((a,i)=>((a[EV[i]]=(a[EV[i]]||0)+1),a),{});

const EVIDENCE_BLOCK =
`/* ---- evidence, established mechanically — see scripts/build-map.mjs -------------------- */
const EVIDENCE=${JSON.stringify(EV)};
const EV_LABEL={seen:'file seen on disk',loaded:'loaded by Claude Code',
 named:'named by a document — file not checked'};
const EV_NOTE={
 seen:'A directory containing a <code>SKILL.md</code> was found. This one is real.',
 loaded:'Claude Code lists this among the skills available in a session. It is real, and it has no file of its own to open.',
 named:'<b>This is a claim, not a finding.</b> The name comes from <code>BUILD-PLAN.md</code> or a <code>CLAUDE.md</code>, and no matching file was found in your library. Either it was never built, or it lives somewhere the build cannot read.'};
const EV_BASIS=${JSON.stringify(
  (libStamp ? 'your library at '+libStamp+', read file by file' : 'disk in this checkout')
  + ' + the skills Claude Code lists this session'
  + (scanStamp ? ' + a committed scan ('+scanStamp+')' : ''))};
`;

/* ---- discovery: the library is the source of truth for WHICH skills exist ---------------
   skills-data.js is editorial — findings, relations, which column. It is not, and should not
   be, the list of what exists, because then adding a skill means remembering to type it in
   and nobody ever does. The list comes from the library itself, and anything found there
   that the editorial file has never heard of becomes a node on its own.

   The clock is the repo's, not the map's. Joe's rule, and he is right: a skill created 31
   days ago is not new just because this build had never looked at it. So "added" is read
   from git history where the library is under version control, and from the account
   library's server-side manifest where it is not. Where neither exists there is NO date, and
   a skill with no date is never tagged new — a wrong clock is worse than no clock. */
const NEW_DAYS = 30;

function fmOf(file){
  const L = fs.readFileSync(file,'utf8').split(/\r?\n/);
  if (L[0].trim() !== '---') return null;
  let k=null; const fm={};
  for (let i=1;i<L.length;i++){
    if (L[i].trim()==='---') break;
    const m=/^([A-Za-z0-9_-]+):\s*(.*)$/.exec(L[i]);
    if (m){ k=m[1].toLowerCase(); fm[k]=m[2].trim(); }
    else if (k && L[i].trim()) fm[k]+=' '+L[i].trim();
  }
  // YAML block scalars: `description: >` puts the text on the following lines and leaves the
  // fold indicator as the value. keep-going was the first skill to use one, and its
  // description rendered on the map with a stray "> " in front of it.
  for (const k of Object.keys(fm)) fm[k]=fm[k].replace(/^[>|][-+0-9]*\s*/,'').trim();
  return fm;
}

/* git: the only source that survives copying, restoring and syncing. Empty repo = no dates,
   which is handled by giving nothing a date rather than guessing.

   A skill was added when its FIRST file appeared, not its last. The earlier version of this
   took whichever file git happened to list first, which is alphabetical, so a skill that had
   existed since July was dated by a CHANGELOG.md added last week — and 36 of 49 skills came
   out tagged new. The date has to be the minimum across every file the skill owns.

   One pass over the whole history rather than a git call per file: 340 files was 340 forks.

   --no-renames matters more than it looks. Git detects renames by default, so a renamed path
   is reported as R and --diff-filter=A skips it entirely — not "dated wrongly", dated NEVER.
   `code-review`->`reviewing-code` and `shipping`->`releasing` both came out with no date at
   all, which put two skills that are in the repo into the same bucket as skills that are not
   in it, telling you to go and push them. Turn rename detection off and the new path is an
   add at the rename commit, which under that name is exactly what it was. */
const gitPaths = new Set();     // every id the repo tracks, whether or not it could be dated
function gitAdded(){
  const out={};
  try {
    if (!fs.existsSync(path.join(SKILLS_REPO,'.git'))) return out;
    execSync(`git -C ${SKILLS_REPO} rev-parse HEAD`,{stdio:'ignore'});
    const log = execSync(
      `git -C ${SKILLS_REPO} log --no-renames --diff-filter=A --name-only --format=%x00%aI --reverse`,
      {encoding:'utf8', maxBuffer:1<<26});
    let date=null;
    for (const line of log.split('\n')){
      if (line.startsWith('\0')){ date = line.slice(1,11); continue; }
      if (!line.trim() || !date) continue;
      /* Anchored to the start of the path, not "anywhere in it".
         The loose version matched map/fixed-skills/skills/session-start-hook/SKILL.md — a
         reference copy of a skill, not the skill — and dated eight long-standing skills to
         the day the map was moved into this repo. Only a path that begins skills/ or agents/
         is a skill. */
      const m = /^(?:skills|agents)\/([^/]+)/.exec(line);
      if (!m) continue;
      const id = m[1].replace(/\.md$/,'');
      gitPaths.add(id);
      if (!out[id] || date < out[id]) out[id] = date;   // earliest wins
    }
  } catch { /* no commits yet, or no git — no dates, which is the honest answer */ }
  return out;
}

const LIB = [];
{ const home = process.env.HOME && path.join(process.env.HOME,'.claude');
  if (home) LIB.push({root:path.join(home,'skills'), src:'account'});
  const ws = path.resolve(ROOT,'../.claude');
  LIB.push({root:path.join(ws,'skills'), src:'workspace'},
           {root:path.join(ws,'agents'),  src:'agent', flat:true});
  // Once the library is under version control the repo is a library like any other, and the
  // best one: it is the only copy this build can read from anywhere, and the only one that
  // knows when each file arrived.
  LIB.push({root:path.join(SKILLS_REPO,'skills'), src:'workspace'},
           {root:path.join(SKILLS_REPO,'agents'), src:'agent', flat:true});
}

/* The first commit is an import, not a birth. Joe's rule stands — the repo is the master of
   the clock — but a clock cannot report a time before it was started. The library's root
   commit says so itself: "Baseline: 30 engineering skills ... snapshot taken before the
   consolidation pass". Those skills existed for months before the repo did.

   So anything present at the root commit gets NO added date, and a skill with no date is
   never tagged new. Only skills that arrived in a later commit have a date the repo actually
   witnessed. Without this the whole library came out tagged new on the day the repo turned
   thirty days old, which is the tag saying nothing at all. */
function rootDate(){
  try {
    if (!fs.existsSync(path.join(SKILLS_REPO,'.git'))) return null;
    const r = execSync(`git -C ${SKILLS_REPO} rev-list --max-parents=0 HEAD`,{encoding:'utf8'})
      .trim().split('\n').filter(Boolean).pop();
    if (!r) return null;
    return execSync(`git -C ${SKILLS_REPO} log -1 --format=%aI ${r}`,{encoding:'utf8'}).trim().slice(0,10);
  } catch { return null; }
}
const ROOT_DATE = rootDate();
const ADDED = gitAdded();
const IMPORTED = new Set();
if (ROOT_DATE) for (const id of Object.keys(ADDED))
  if (ADDED[id] <= ROOT_DATE){ IMPORTED.add(id); delete ADDED[id]; }
let addedFromGit = Object.keys(ADDED).length;
// the account library's manifest carries a server-side stamp, which survives copying even
// though it records the last update rather than the creation
const MANIFEST = {};
{ const mf = process.env.HOME && path.join(process.env.HOME,'.claude/skills/manifest.json');
  if (mf && fs.existsSync(mf)) {
    try { for (const s of (JSON.parse(fs.readFileSync(mf,'utf8')).skills||[]))
            if (s.name && s.updatedAt) MANIFEST[s.name]=String(s.updatedAt).slice(0,10); }
    catch {}
  }
}

const LIVE = {};
for (const {root,src,flat} of LIB){
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root)){
    const file = flat ? path.join(root,entry) : path.join(root,entry,'SKILL.md');
    if (flat && !entry.endsWith('.md')) continue;
    if (!fs.existsSync(file)) continue;
    const id = flat ? entry.replace(/\.md$/,'') : entry;
    const fm = fmOf(file); if (!fm) continue;
    // ONLY git dates count as "added". The manifest's updatedAt is when the skill was last
    // edited, and using it here tagged ten long-standing skills as new the moment their
    // descriptions were touched — precisely the wrong clock. It is carried separately so the
    // panel can still say when a skill last changed, which is a different and useful fact.
    LIVE[id] = { src, desc: fm.description||'', declared: fm.name||'',
                 added: ADDED[id] || null,
                 addedFrom: ADDED[id] ? 'git' : null,
                 // present at the import, so older than the repo by an unknown amount
                 since: IMPORTED.has(id) ? ROOT_DATE : null,
                 updated: MANIFEST[id] || null };
  }
}
// a committed scan from Joe's machine sees the libraries this checkout cannot
if (fs.existsSync(SCAN)) {
  const scan = JSON.parse(fs.readFileSync(SCAN,'utf8'));
  for (const s of (scan.skills||[])) {
    const id = s.directory||s.declaredName; if (!id || !s.hasSkillMd) continue;
    LIVE[id] = Object.assign({src:'workspace',desc:s.description||'',declared:s.declaredName||'',
                              added:ADDED[id]||null, addedFrom:ADDED[id]?'git':null}, LIVE[id]||{});
  }
  for (const a of (scan.agents||[])) {
    const id = a.name||a.declaredName; if (!id) continue;
    LIVE[id] = Object.assign({src:'agent',desc:a.description||'',declared:a.declaredName||'',
                              added:ADDED[id]||null, addedFrom:ADDED[id]?'git':null}, LIVE[id]||{});
  }
}

const known = new Set([...map.body.matchAll(/^ S\('([a-z0-9-]+)'/gm)].map(m=>m[1]));
const found = Object.keys(LIVE);
const NEWLY = found.filter(id=>!known.has(id));

/* Where a newly discovered skill goes.

   It used to get a column called "New", which conflates two different facts: that it arrived
   recently, and that nobody has said what it is for. The first is the tag's job and the tag
   already does it. The second is not a category — it is the absence of one, and giving it a
   column of its own put a skill on the far edge of every layout for the crime of being new.

   So it is placed by resemblance: score its description against every skill already on the
   map with the same IDF-weighted measure used for the overlap findings, take the five nearest
   and let their columns vote, weighted by score. Ties and empties fall back to `style` — the
   how-I-work column, which is where a skill that fits nowhere in the build plan sits.

   This is a guess and is recorded as one. The panel names what it resembled and says that
   BUILD-PLAN.md §10 is what would place it properly. A guess presented as a fact is the exact
   thing this map exists to avoid; a guess that says so is just a starting point. */
const placedBy = {};
function guessGroup(id){
  const groupOf = {};
  for (const m of map.body.matchAll(/^ S\('([a-z0-9-]+)','([a-z]+)','([a-zA-Z0-9]+)'/gm))
    groupOf[m[1]] = {phase:m[3]};
  // GROUP sits several entries to a line, so anchoring this to the start of a line matched
  // one skill in each and left the rest ungrouped — every vote came back empty and every
  // new skill fell through to the same fallback, which looked like the classifier working.
  const gblock = /const GROUP=\{[\s\S]*?\n\};/.exec(map.body);
  if (gblock) for (const m of gblock[0].matchAll(/'([a-z0-9-]+)'\s*:\s*'([a-zA-Z0-9]+)'/g))
    if (groupOf[m[1]]) groupOf[m[1]].group = m[2];
  const pool = Object.entries(LIVE).filter(([k,v])=>v.desc && (k===id || groupOf[k]))
                                   .map(([k,v])=>({id:k, description:v.desc}));
  const near = overlaps(pool,{min:0})
    .filter(p=>p.a===id||p.b===id)
    .map(p=>({other:p.a===id?p.b:p.a, score:p.score}))
    .sort((x,y)=>y.score-x.score).slice(0,5);
  const vote = {};
  for (const nb of near){ const g=groupOf[nb.other]; if(!g||!g.group) continue;
    vote[g.group]=(vote[g.group]||0)+nb.score; }
  const win = Object.entries(vote).sort((a,b)=>b[1]-a[1])[0];
  const group = win ? win[0] : 'style';
  // the phase tag comes from a skill already in that column, so the panel reads normally
  const phase = (Object.entries(groupOf).find(([,g])=>g.group===group)||[,{phase:'unmapped'}])[1].phase;
  placedBy[id] = near.length ? {near:near[0].other, score:+near[0].score.toFixed(3), group} : null;
  return {group, phase, near:placedBy[id]};
}
// gone: on the map, but not in any library we can actually see. Only claimed for the
// libraries this build reached — the workspace one is invisible here, so its skills are
// not reported missing on the strength of not being looked at.
/* A source counts as reached only if it looks like the whole library rather than a piece of
   one. Pointing this at a repo holding two skills reported the other twenty-nine as GONE —
   which is technically what it saw and is almost certainly a partial checkout rather than
   twenty-nine deletions. Below half of what the map expects from a source, the source is
   treated as not reached and says so, because "I could not see it" is a far commoner truth
   than "it was all deleted". */
const expected = {};
for (const m of map.body.matchAll(/^ S\('([a-z0-9-]+)',[^,]+,[^,]+,'([a-z ]+)'/gm))
  expected[m[2]] = (expected[m[2]]||0) + 1;
const foundBySrc = {};
for (const id of found) foundBySrc[LIVE[id].src] = (foundBySrc[LIVE[id].src]||0) + 1;
const partial = [];
const reached = new Set();
for (const l of LIB){
  if (!fs.existsSync(l.root)) continue;
  const exp = expected[l.src]||0, got = foundBySrc[l.src]||0;
  if (exp && got < exp*0.5) { partial.push(`${l.src} (${got} of ~${exp})`); continue; }
  reached.add(l.src);
}
if (fs.existsSync(SCAN)) reached.add('workspace').add('agent');
const GONE = [...known].filter(id=>{
  const m = new RegExp(`^ S\\('${id}',[^,]+,[^,]+,'([a-z ]+)'`,'m').exec(map.body);
  const src = m ? m[1] : '';
  const lib = src==='agent'?'agent':src==='account'?'account':src==='workspace'?'workspace':null;
  return lib && reached.has(lib) && !LIVE[id];
});

const cutoff = new Date(Date.now()-NEW_DAYS*86400000).toISOString().slice(0,10);
const NEWTAG = found.filter(id=>LIVE[id].added && LIVE[id].added >= cutoff);
/* Read from a library with no git history behind it, so nothing knows when it arrived — the
   account library at ~/.claude/skills, which is not a repo. Distinct from IMPORTED, which has
   a date and is deliberately withholding it, and deliberately restricted to sources outside
   the repo: a skill the repo DOES hold that comes out undated is a bug in the dating, and
   telling you to push something you already pushed would send you off to fix the wrong
   thing. That is how the rename bug above stayed hidden. */
const inRepo = new Set(gitPaths);
const noClock = found.filter(id=>
  !LIVE[id].added && !LIVE[id].since && !inRepo.has(id));

const DISCOVERY_BLOCK =
`/* ---- what the library actually holds, read at build time -------------------------------
   LIVE is each skill's own frontmatter description — its words, not the map's notes about
   it — so a skill that is rewritten stops being described by whatever was true when someone
   last wrote a finding for it. ADDED is when it entered the repo, from git history; a null
   means no trustworthy date exists and the skill is therefore never tagged new. */
const LIVE=${JSON.stringify(LIVE,null,0)};
const NEWTAG=new Set(${JSON.stringify(NEWTAG)});
const NEW_DAYS=${NEW_DAYS};
const BUILT=${JSON.stringify(new Date().toISOString().slice(0,10))};
const SCAN_AT=${JSON.stringify(fs.existsSync(SCAN)
  ? (JSON.parse(fs.readFileSync(SCAN,'utf8')).timestamp||'').slice(0,10) || null : null)};
const CLOCK=${JSON.stringify(ROOT_DATE ? 'git' : 'none')};
/* The repo's history starts here. Skills present at that first commit are older than the
   repo by an unknown amount, so they carry no added date and are never tagged new. */
const IMPORT_DATE=${JSON.stringify(ROOT_DATE)};
/* Anything the library holds that the editorial file has never heard of becomes a node on
   its own, placed in the column whose skills its description most resembles.

   Its evidence grade is set here too. It used to be left out: EVIDENCE is keyed from
   skills-data.js, which by definition has never heard of a skill that was only just found,
   so a freshly discovered skill drew with no grade at all — the one node on the map with no
   answer to "how do you know this is real", when it is the one the build opened most
   recently. It was read from a file. That is 'seen'. The assignment itself is emitted after
   the evidence block below, because that is where EVIDENCE is declared. */
${NEWLY.map(id=>{const g=guessGroup(id);
  return `SKILLS.push(S(${JSON.stringify(id)},'unmapped',${JSON.stringify(g.phase)},${JSON.stringify(LIVE[id].src)},1,''));`
   +`GROUP[${JSON.stringify(id)}]=${JSON.stringify(g.group)};TAGS[${JSON.stringify(id)}]=[];`;}).join('\n')}
/* Found on disk, but in a library that is not under version control — so there is no date
   for when it arrived, and the rule is that a skill with no date is never tagged new.

   That rule is right and it is Joe's: the repo owns the clock, and a wrong clock is worse
   than no clock. But applied silently it produces exactly the wrong outcome — you add a
   skill, the map finds it, and it appears with no "new" tag and nothing saying why. So the
   ones in this state are named, and the panel says what to do about it. */
const NOCLOCK=new Set(${JSON.stringify(noClock)});
/* Which skills the build placed by resemblance rather than by the build plan, and what they
   resembled. Kept so the panel can say so: a guess presented as a fact is the thing this
   whole map exists to avoid. */
const PLACED=${JSON.stringify(placedBy)};
const GONE=${JSON.stringify(GONE)};
`;

/* ---- overlap, measured from the descriptions we actually hold -------------------------- */
// Every description the build can read, which since the library was pushed is all of them
// rather than the fifteen this checkout happened to hold.
const held = Object.entries(LIVE)
  .filter(([,v])=>v.desc)
  .map(([id,v])=>({id, description:v.desc}));
const measured = overlaps(held,{min:0.08});
const OVERLAP_BLOCK =
`/* ---- measured overlap ------------------------------------------------------------------
   Produced by scripts/overlap.mjs from the ${held.length} SKILL.md descriptions this repo
   actually holds, not from reading names. Weighted by inverse document frequency so a word
   one skill uses counts for more than one they all share; the shared terms are recorded so
   the finding says what the collision is about. It cannot judge whether an overlap matters —
   two skills can share vocabulary and still be complementary — so it reports the measurement
   and asks for a decision. Re-run the build to refresh it. */
const OVERLAP=${JSON.stringify(measured,null,1)};
const OVERLAP_BASIS='measured from ${held.length} descriptions by scripts/overlap.mjs';
`;
/* Grades for the skills discovery found, which the evidence block above cannot carry: it is
   keyed from skills-data.js, and a skill that was only just found is by definition not in it.
   Emitted here rather than in the discovery block because that runs first and EVIDENCE does
   not exist yet — which is a load-time crash, not a missing badge. */
const NEW_EVIDENCE = NEWLY.length
  ? `/* ---- grades for the skills discovery found on its own ---- */\n`
    + NEWLY.map(id=>`EVIDENCE[${JSON.stringify(id)}]='seen';`).join('\n') + '\n'
  : '';

out = shell.head + map.body + DISCOVERY_BLOCK + LOC + EVIDENCE_BLOCK + NEW_EVIDENCE
    + OVERLAP_BLOCK + shell.tail;
for(const [a,b] of POST) out = out.split(a).join(b);

fs.writeFileSync(OUT, out);
console.log(`built ${path.relative(ROOT,OUT)}`);
console.log(`  data      from skills-data.js (${map.body.split('\n').length} lines)`);
console.log(`  shell     from shell.html     (${(shell.head+shell.tail).split('\n').length} lines)`);
console.log(`  library   ${found.length} found · ${NEWLY.length} new to the map · ${GONE.length} gone · clock: ${addedFromGit?'git':'none — nothing tagged new'}`);
if(NEWLY.length) console.log(`            new: ${NEWLY.join(', ')}`);
if(GONE.length)  console.log(`            gone: ${GONE.join(', ')}`);
if(partial.length) console.log(`            incomplete, not checked for removals: ${partial.join(', ')}`);
// NEWLY is graded seen in its own block, so the tally has to count it or the console reports
// one fewer skill than the map draws
console.log(`  evidence  ${(tally.seen||0)+NEWLY.length} seen on disk · ${tally.loaded||0} loaded by Claude Code · ${tally.named||0} named only`);
console.log(`            read from ${libStamp ? 'the library at '+libStamp : 'this checkout only — SKILLS_REPO not found'}`);
if (noClock.length) console.log(
  `            no repo date, so never tagged new: ${noClock.join(', ')}\n`+
  `            these are in a library with no git history — push them to the skills repo and they get one`);
if (tally.named) console.log(`            unchecked: ${idsIn.filter(i=>EV[i]==='named').join(', ')}`);
console.log(`  overlap   ${measured.length} pairs measured from ${held.length} held descriptions`);
for (const o of measured) console.log(`            ${o.score}  ${o.a} <-> ${o.b}`);
