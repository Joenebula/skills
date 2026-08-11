/* ------------------------------------------------------------------ data */
/* "Build step 1" is the plan's own filing system and it means nothing on its own — it does not
   say what the thing is or when it happens. Everywhere a reader sees it, it now says which
   numbered step of the build it is, because that is the fact underneath: the plan is eight
   steps in order, and a skill named against one is meant to load when you reach it. The
   letters stay alongside so BUILD-PLAN.md is still searchable. */
const PHASES={anchor:'anchor',always:'Loaded every session',
 A:'Build step 1 · skeleton',B:'Build step 2 · database',
 C:'Build step 3 · admin',D:'Build step 4 · public site',E:'Build step 5 · feeds',
 F:'Build step 6 · ads',G:'Build step 7 · analytics',H:'Build step 8 · hardening',
 S2:'After launch',never:'Never use',unmapped:'Not in the build plan',
 builtin:'Built into Claude Code'};
const S=(id,ring,phase,src,w,desc,rel=[])=>({id,ring,phase,src,w,status:phase==='never'?'never':'present',desc,rel});
const SKILLS=[
 // ---- workspace library: OneDrive\Design2\Web\.claude\skills (31 folders, confirmed)
 S('engineering-standards','core','always','workspace',1,'Always-on per <code>CLAUDE.md</code>, and it exists. Folder confirmed in the workspace library.'),
 S('debugging','core','always','workspace',1,'Always-on per <code>CLAUDE.md</code>, and it exists.'),
 S('reviewing-code','core','always','workspace',1,'Always-on per <code>CLAUDE.md</code>, and it exists. Overlaps the built-in <code>simplify</code>.',['simplify']),
 S('refactoring','core','always','workspace',1,'<b>The two documents disagree.</b> The build plan lists it as always-on; <code>CLAUDE.md</code> names only three and this is not one of them. The skill itself is fine — the docs are not.'),
 S('project-setup','phasemap','A','workspace',1,'Build step 1. The build plan calls it an exact stack match for Next.js + Supabase + Vercel.'),
 S('infrastructure','phasemap','A','workspace',1,'Build step 1.'),
 S('data-modelling','phasemap','B','workspace',1,'Build step 2. Where RLS-first schema design should live.'),
 S('privacy-and-compliance','phasemap','B','workspace',1,'The build plan assigns it to <b>build steps 2 and 7</b>.'),
 S('auth-and-accounts','phasemap','C','workspace',1,'Build step 3 — Supabase Auth via Google.'),
 S('data-grids','phasemap','C','workspace',1,'Build step 3 admin CRUD.'),
 S('forms-and-input','phasemap','C','workspace',1,'Build step 3 admin CRUD.'),
 S('cms','phasemap','C','workspace',1,'Build step 3.'),
 S('design-system','phasemap','C','workspace',1,'Build step 3. Overlaps <code>mydesignskill</code>, which carries the house style.',['mydesignskill']),
 S('accessibility','phasemap','C','workspace',1,'<b>Three skills now carry WCAG 2.2 material.</b> This one, plus <code>public-service-website</code> and <code>bootstrap5-migration</code>, which both ship a11y reference files. The build plan assigns it to <b>build steps 3, 4 and 8</b>.',['public-service-website','bootstrap5-migration']),
 S('responsive-design','phasemap','C','workspace',1,'The build plan assigns it to <b>build steps 3 and 4</b>. Overlaps <code>bootstrap5-migration</code>&rsquo;s grid and breakpoint work.',['bootstrap5-migration']),
 S('seo','phasemap','D','workspace',1,'Build step 4, and the build plan flags it load-bearing — the business model is ranking for &ldquo;[genre] in [city]&rdquo;. <b>It exists.</b> Worth checking it actually enforces non-negotiable #5, server-render anything that needs to rank.'),
 S('performance','phasemap','D','workspace',1,'The build plan assigns it to <b>build steps 4 and 8</b>.'),
 S('api-design','phasemap','D','workspace',1,'The build plan assigns it to <b>build steps 4 and 6</b>.'),
 S('integrations','phasemap','E','workspace',1,'The build plan calls it &ldquo;the whole step&rdquo; for build step 5 — Skiddle, Eventbrite, Ticketmaster. Exists. The step is blocked on affiliate approval, not on this.'),
 S('background-jobs','phasemap','E','workspace',1,'Build step 5.'),
 S('observability','phasemap','E','workspace',1,'Build step 5 — Sentry is in the stack.'),
 S('analytics-dashboards','phasemap','F','workspace',1,'The build plan assigns it to <b>build steps 6 and 7</b>. Build step 7 is analytics.'),
 S('preflight','phasemap','H','workspace',1,'Build step 8.'),
 S('regression-testing','phasemap','H','workspace',1,'Build step 8.'),
 S('releasing','phasemap','H','workspace',1,'Build step 8.'),
 S('security','phasemap','H','workspace',1,'The build plan records this as deleted from the working tree. A <code>security/</code> folder is present in the library listing — but gotcha G-001 says its <code>SKILL.md</code> vanished twice while the folder remained. <b>Folder present does not mean skill present.</b> One <code>Test-Path</code> settles it.',['security-review','ecommerce-security-audit']),
 S('email-and-notifications','phasemap','S2','workspace',1,'After launch.'),
 S('internationalization','phasemap','S2','workspace',1,'After launch — the regions and currency franchise hook.'),
 S('ecommerce-security-audit','phasemap','H','account',5,'The heaviest skill you own — 20 reference files, a checklist, 2 scan scripts, 2 report templates. <b>The map said workspace library; the file is in the account-synced one.</b> Corrected after checking disk. The build plan uses it for Build step 8 item 7 only, so it is doing less than it could.',['security','public-service-website','security-review']),
 S('webaudio-plugin-builder','phasemap','never','account',3,'The only skill the build plan marks <b>never use</b> for VibeHQ — correctly parked. <b>The map said workspace library; the file is in the account-synced one.</b> Corrected after checking disk.'),
 S('security-route-auditor','phasemap','H','agent',1,'<b>An agent, and the only one the build plan names.</b> It says this &ldquo;still covers the route layer&rdquo; for security. There are <b>five</b> agents in the library — the other four appear in no document at all.',['security','security-review','ecommerce-security-audit']),
 S('accessibility-auditor','unmapped','unmapped','agent',1,'<b>An agent, and the build plan does not mention it.</b> Name only — its file has not been read. Overlaps the <code>accessibility</code> skill and the a11y material in <code>public-service-website</code>.',['accessibility']),
 S('design-system-auditor','unmapped','unmapped','agent',1,'<b>An agent, and the build plan does not mention it.</b> Name only. Overlaps <code>design-system</code> and <code>mydesignskill</code>.',['design-system','mydesignskill']),
 S('feature-completeness-auditor','unmapped','unmapped','agent',1,'<b>An agent, and the build plan does not mention it.</b> Name only. Sounds like Build step 8 work — <code>preflight</code> territory.',['preflight']),
 S('regression-auditor','unmapped','unmapped','agent',1,'<b>An agent, and the build plan does not mention it.</b> Name only. Overlaps <code>regression-testing</code>.',['regression-testing']),
 S('ask-dont-guess','unmapped','unmapped','workspace',1,'Not in vibehq&rsquo;s <code>CLAUDE.md</code> or the build plan — but gotcha G-001 records it as <b>130 lines, 54 inbound links, cited by law number from the workspace <code>CLAUDE.md</code></b>. Heavily mapped, just not from this repo. Its <code>SKILL.md</code> has vanished from disk twice.',['critical-thinking-partner']),
 // ---- account-synced library
 S('bootstrap5-migration','unmapped','unmapped','account',4,'<b>Routing tightened 6 Aug.</b> Rebuilds a static site on Bootstrap 5 — responsive, WCAG 2.2 AA, modern JS. <b>The one skill that routes away cleanly</b>: it sends civic work to <code>public-service-website</code>. The model the other design skills should copy.',['public-service-website','accessibility','responsive-design','mydesignskill']),
 S('public-service-website','unmapped','unmapped','account',4,'Civic, council, charity and campaigning sites — UX research, IA, wireframes, tokens, a11y annotations, content design, handoff. <b>Rewritten 6 Aug</b>: owns WCAG 2.2 and the accessibility layer, and defers Bootstrap 5 mechanics to <code>bootstrap5-migration</code>.',['bootstrap5-migration','accessibility','ecommerce-security-audit']),
 S('mydesignskill','unmapped','unmapped','account',3,'The house style: no outline borders on containers, Material typefaces only, plus five annotated reference designs. <b>Rewritten 6 Aug</b> to state its precedence over <code>frontend-design</code> for anything marketing-facing, since it is the one carrying the house constraints.',['frontend-design','design-system','bootstrap5-migration']),
 S('frontend-design','unmapped','unmapped','account',2,'<b>Narrowed 6 Aug.</b> Scoped to application surfaces — components, screens, state, interaction — and it now routes marketing pages to <code>mydesignskill</code>, artifacts to <code>artifact-design</code>, civic work to <code>public-service-website</code> and Bootstrap 5 rebuilds to <code>bootstrap5-migration</code>.',['mydesignskill','bootstrap5-migration','public-service-website','artifact-design']),
 S('critical-thinking-partner','unmapped','unmapped','account',1,'<b>Narrowed 6 Aug</b> to fire only when critique is explicitly asked for, rather than on any analysis or review task. Its own note still says a disposition belongs in CLAUDE.md or a Style — that move is still open, but it no longer fires by luck.',['ask-dont-guess']),
 S('knowledge-system-setup','unmapped','unmapped','account',2,'<b>Scoped 6 Aug.</b> It now excludes itself from any project that already keeps ledgers, so it no longer competes with <code>build-ledger.md</code>, <code>decisions.md</code> and <code>gotchas.md</code>.',['init']),
 S('skill-creator','unmapped','unmapped','account',3,'Create, edit, optimise and eval skills, with variance analysis on triggering accuracy. <b>The tool for every routing fix on this map.</b>'),
 S('session-start-hook','unmapped','unmapped','account',1,'<b>Fixed 6 Aug.</b> The frontmatter declared <code>name: startup-hook-skill</code> against a <code>session-start-hook/</code> directory, and <code>manifest.json</code> listed neither. Both corrected; the manifest went from 14 skills to 15.',['update-config']),
 S('morning','unmapped','unmapped','account',2,'Morning brief as a styled HTML artifact, optionally on a weekday schedule.'),
 S('pdf','unmapped','unmapped','account',4,'PDF read, merge, split, rotate, watermark, forms, encryption, OCR.'),
 S('docx','unmapped','unmapped','account',3,'Word documents and .dotx templates — tracked changes, comments, find-and-replace.'),
 S('pptx','unmapped','unmapped','account',3,'Slide decks, .potx templates, layouts, speaker notes.'),
 S('xlsx','unmapped','unmapped','account',2,'Spreadsheets — formulas, charts, cleaning messy tabular data.'),
 // ---- built into Claude Code
 S('security-review','builtin','builtin','built-in',2,'Reviews pending changes on the branch for security issues. <b>Overlaps the workspace <code>security</code> skill and <code>ecommerce-security-audit</code></b> — three things now claim security, and nothing says which owns what.',['security','ecommerce-security-audit']),
 S('simplify','builtin','builtin','built-in',1,'Reviews changed code for reuse, simplification and efficiency; explicitly does not hunt bugs. <b>Overlaps <code>reviewing-code</code></b>, which is always-on.',['reviewing-code','refactoring']),
 S('init','builtin','builtin','built-in',1,'Generates a <code>CLAUDE.md</code> from the codebase, which would destroy the hand-maintained one at the centre of this map. <b>Guarded</b> — CLAUDE.md now says never to regenerate it, per D-009.',['knowledge-system-setup']),
 S('dataviz','builtin','builtin','built-in',2,'Read before writing any chart, dashboard or stat tile. Form heuristic, colour formula with a validator, mark specs.',['artifact-design']),
 S('artifact-design','builtin','builtin','built-in',2,'Design guidance for Artifacts. Part of the five-way design collision — it fires on the same intent as <code>frontend-design</code> and <code>mydesignskill</code>. <b>A routing table resolving all five is drafted</b> in <code>docs/skills-map/design-routing.md</code>, ready to apply.',['frontend-design','mydesignskill','artifact-diagramming']),
 S('artifact-diagramming','builtin','builtin','built-in',1,'When a diagram earns its place, and the inline-SVG mechanics that stay legible in both themes.',['artifact-design','dataviz']),
 S('artifact-capabilities','builtin','builtin','built-in',1,'Runtime capabilities a published Artifact can be granted — live data, shared state, self-republishing.',['artifact-design']),
 S('claude-api','builtin','builtin','built-in',2,'Model ids, pricing, params, streaming, tool use, MCP, caching, migration.'),
 S('run','builtin','builtin','built-in',1,'Launches and drives the project app to see a change working — the real app, not just tests.',['preflight']),
 S('update-config','builtin','builtin','built-in',1,'Configures the harness via settings.json — hooks, permissions, env vars.',['session-start-hook']),
 S('keybindings-help','builtin','builtin','built-in',1,'Customise keyboard shortcuts and chords.'),
 S('fewer-permission-prompts','builtin','builtin','built-in',1,'Scans transcripts and writes a prioritised allowlist into project settings.',['update-config']),
 S('loop','builtin','builtin','built-in',1,'Runs a prompt or slash command on a recurring interval, or self-paced.'),
 S('code-review','builtin','builtin','built-in',2,'Reviews the diff for correctness bugs and cleanups at a chosen effort level, and can post them as PR comments or apply them. <b>This was missing from the map entirely</b> until the node list was checked against the skills actually loaded. It overlaps <code>reviewing-code</code>, which is always-on, and <code>simplify</code>, which does the quality half of the same job.',['reviewing-code','simplify','security-review'])
];
const ANCHOR={id:'CLAUDE.md',ring:null,phase:'anchor',status:'present',src:'repo root',w:6,rel:[],
 desc:'<b>The skills library is pushed — <code>github.com/Joenebula/skills</code>, at <code>df2b3f2</code>.</b> 31 skills, 5 agents, the workspace <code>CLAUDE.md</code> and 16 commits of history. That closes G-008: the one directory with a proven loss record (G-001, twice) had the weakest backup in the workspace, and now has a copy that is not on the machine.<br><br>The VibeHQ project agreement, loaded every session. It names three always-on skills, points at four ledgers, and defers the step→skill map to <code>BUILD-PLAN.md</code>, section 10 — the build plan.<br><br><b>Every skill it reaches for has been opened.</b> Not listed — opened. This build reads each <code>SKILL.md</code> in the library and takes its description from the file, so no node here is standing on a document\'s word. The unverified count went from 34 to 0.<br><br><b>A folder is still not a skill</b>, which is the whole reason for that. G-001 records <code>SKILL.md</code> files vanishing while their folders remained, and this map twice used a listing as evidence anyway — once calling <code>security</code> missing when it is 63 lines, once calling <code>ask-dont-guess</code> unmapped when it has 54 inbound links. Both recorded as G-009.<br><br>All 15 items raised against this library are settled. What the map shows now is what is on the machine, and when each thing arrived.'};

/* ---- how a finding was reached --------------------------------------------------------
   "Where does this come from and how do I argue with it" is a fair question about every
   claim on this map, and it used to have no answer on the page. It has one now, because
   there are only seven ways anything here gets decided, and each of them is a mechanism with
   a location, a thing it cannot tell you, and a knob.

   The point of naming them is not transparency for its own sake. It is that the weakest one
   — `infer`, reasoning from a name without opening the file — is the one that produced both
   of the findings that turned out to be wrong (G-009). A method that has to declare itself
   is a method you can distrust on sight. */
const METHODS={
 read:{name:'Read the file',
   how:'The build opened the SKILL.md and used its own frontmatter — its words, not a note about it.',
   blind:'It cannot tell you whether the skill WORKS, only what it declares.',
   where:'scripts/build-map.mjs, the LIB loop',
   knob:'Nothing to tune. If a file is unreadable the skill is graded <b>named</b> instead, which is visible.'},
 disk:{name:'Looked on disk',
   how:'A directory containing a SKILL.md was found, so the skill exists as a file.',
   blind:'A folder is not a skill: G-001 records SKILL.md files vanishing while their folders stayed.',
   where:'scripts/build-map.mjs, the <code>seen</code> set',
   knob:'Which places it looks: the account library, this checkout, and SKILLS_REPO.'},
 git:{name:'Asked git',
   how:'Dates come from the first commit that added the file, walking the whole history once.',
   blind:'It cannot see before the repo started, so anything present at the import has no date.',
   where:'scripts/build-map.mjs, <code>gitAdded()</code>',
   knob:'<code>NEW_DAYS</code> — how long the <b>new</b> tag lasts. 30 today.'},
 doc:{name:'A document says so',
   how:'BUILD-PLAN.md section 10 or a CLAUDE.md names the skill and places it.',
   blind:'A document is a claim about the library, not the library. It goes stale silently.',
   where:'docs/BUILD-PLAN.md §10, CLAUDE.md',
   knob:'Edit the document. That is the intended way to overrule a placement.'},
 overlap:{name:'Measured the wording',
   how:'Two descriptions are scored on shared terms, weighted so a word everything uses counts '+
       'for little and a rare shared word counts for a lot. Pairs over the threshold are reported.',
   blind:'It measures vocabulary, not meaning. Two skills can share words and be complementary — '+
         'it reports the measurement and refuses to say whether the overlap matters.',
   where:'scripts/overlap.mjs',
   knob:'The threshold, <code>min</code>, is 0.08. Lower it and you get more pairs and more noise.'},
 place:{name:'Guessed by resemblance',
   how:'A skill nothing places is scored against every skill already on the map; the five '+
       'nearest vote for their column, weighted by score.',
   blind:'It is a guess and the panel says so. The winning score is often low — a weak vote '+
         'still produces a confident-looking column.',
   where:'scripts/build-map.mjs, <code>guessGroup()</code>',
   knob:'How many neighbours vote (5), and the fallback when they disagree.'},
 infer:{name:'Reasoned from names',
   how:'A conclusion drawn from what things are called, without opening the files.',
   blind:'<b>This is the weak one.</b> Both findings that turned out to be wrong came from '+
         'here (G-009) — one called a 63-line skill missing, the other called a skill with '+
         '54 inbound links an orphan.',
   where:'Me, before the library was readable',
   knob:'Push the library and it stops being needed. Any finding still resting on this is '+
        'worth checking first.'}
};
/* Which of them produced each finding. More than one is normal — most were reached by
   reading something and then reasoning about it. */
const VIA={
 'CLAUDE.md':['disk','git','doc'],
 'security':['disk','read','doc','infer'],
 'refactoring':['doc'],
 'security-route-auditor':['disk','read','doc'],
 'security-review':['read','overlap','infer'],
 'simplify':['read','overlap','infer'],
 'artifact-design':['read','overlap'],
 'frontend-design':['read','overlap'],
 'accessibility':['read','overlap','infer'],
 'ecommerce-security-audit':['disk','read'],
 'ask-dont-guess':['disk','doc','infer'],
 'critical-thinking-partner':['read'],
 'knowledge-system-setup':['read','doc'],
 'session-start-hook':['read','disk'],
 'init':['doc']
};

/* ---- Each fix carries how well its premise is established, and a step number so the set
   can be worked in dependency order. Several fixes edit the same paragraph; run them in the
   listed order and they cannot collide. */
const BASIS={
 'CLAUDE.md':['done',1],'security':['done',3],'refactoring':['done',2],
 'security-route-auditor':['done',4],'security-review':['done',5],
 'simplify':['done',6],'artifact-design':['done',7],'frontend-design':['done',8],
 'accessibility':['done',9],'ecommerce-security-audit':['done',10],
 'ask-dont-guess':['done',11],'critical-thinking-partner':['done',12],
 'knowledge-system-setup':['done',13],'session-start-hook':['done',14],
 'init':['done',15]
};
const BASIS_LABEL={confirmed:'premise confirmed',unverified:'premise unverified',
 precaution:'nothing is wrong',corrected:'I got this wrong — corrected',done:'done, in this repo',
 prepared:'drafted — needs applying on your machine',
 scripted:'scripted — one command applies it'};
const BASIS_SHORT={confirmed:'confirmed',unverified:'unverified',precaution:'no action needed',
 corrected:'corrected after I got it wrong',done:'done',prepared:'drafted',scripted:'scripted'};
// what each state means for the reader, so the headline number is legible rather than arbitrary
const BASIS_MEANS={
 scripted:'a script applies this — run scripts/apply-skill-fixes.ps1',
 prepared:'the work is written out — it needs pasting into a SKILL.md',
 corrected:'I got this wrong. Verifying it will probably close it',
 confirmed:'premise checked against the documents. Needs doing',
 unverified:'inferred from names. Reading the skill may close it',
 precaution:'nothing is wrong. Included so the judgement is visible'};
const BASIS_ORDER=['scripted','prepared','corrected','confirmed','unverified','precaution'];
// BASIS says how good my evidence is. NEEDS says what it still costs you — which is the
// question "why is the number the same" was really asking.
const NEEDS={
 'CLAUDE.md':'push','security':'command','security-route-auditor':'command',
 'ecommerce-security-audit':'command','ask-dont-guess':'command',
 'artifact-design':'decide','frontend-design':'script','session-start-hook':'script',
 'security-review':'read','simplify':'read','accessibility':'read',
 'critical-thinking-partner':'decide','knowledge-system-setup':'decide'};
const NEEDS_LABEL={
 script:'one script, and it is applied',
 push:'one push, and eleven others unblock',
 paste:'a paste — the replacement text is already written out',
 command:'one command, and it probably closes',
 read:'reading a skill, then a call',
 decide:'a decision only you can make'};
const NEEDS_ORDER=['script','push','paste','command','read','decide'];

/* ---- where each step has to be run from. The brief opens with an orientation step that
   works this out, so the agent reports "run this elsewhere" instead of failing silently. */
const WHERE={
 'CLAUDE.md':'workspace + repo','security':'workspace','security-route-auditor':'workspace + repo',
 'security-review':'workspace + repo','simplify':'workspace + repo','artifact-design':'account',
 'frontend-design':'account','accessibility':'workspace + account','ecommerce-security-audit':'both libraries',
 'ask-dont-guess':'workspace','critical-thinking-partner':'account',
 'knowledge-system-setup':'account + repo','session-start-hook':'account','init':'repo','refactoring':'repo'
};
const PREAMBLE=[
"## Step 0 — orient yourself first. Do not skip this.",
"",
"You are a Claude Code session. You may or may not be able to reach the files these steps need.",
"Work that out before touching anything.",
"",
"Run whichever applies to your shell, and report the results as a small table:",
"",
"    # PowerShell (Windows)",
"    git rev-parse --show-toplevel",
"    Test-Path ..\\.claude\\skills",
"    Test-Path ..\\.claude\\CLAUDE.md",
"    Test-Path $HOME\\.claude\\skills",
"    Test-Path ..\\.claude\\skills\\security\\SKILL.md",
"    Test-Path ..\\.claude\\skills\\ask-dont-guess\\SKILL.md",
"",
"    # bash / zsh",
"    git rev-parse --show-toplevel",
"    ls -d ../.claude/skills ../.claude/CLAUDE.md ~/.claude/skills 2>/dev/null",
"    ls ../.claude/skills/security/SKILL.md ../.claude/skills/ask-dont-guess/SKILL.md 2>/dev/null",
"",
"Three locations matter, and every step below names which it needs:",
"",
"- **repo** — the vibehq git repo: its docs and CLAUDE.md.",
"- **workspace** — the library beside the repo, ../.claude/skills, plus ../.claude/CLAUDE.md.",
"- **account** — the synced library at ~/.claude/skills.",
"- **github** — github.com/Joenebula/skills, the workspace library's remote (D-010). If step 1",
"  has been done, a session with GitHub access can read the library from here even when the",
"  local paths are unreachable. Check whether it has content before assuming you are blocked.",
"",
"Then classify every step as one of:",
"",
"- **RUN NOW** — everything it needs is reachable from here. Do it.",
"- **RUN ELSEWHERE** — say plainly where, in one line the user can act on, naming the steps and",
"  the path. For example: “These steps need the account library, which is not reachable from here.",
"  Open a terminal at C:\\Users\\joene\\OneDrive\\Design2\\Web\\vibehq, start Claude Code, and paste",
"  this same brief.” Do not attempt them.",
"- **BLOCKED** — reachable, but something it depends on is missing. Say what.",
"",
"Report that classification **before** starting work. Then work top to bottom — several steps edit",
"the same paragraph, so they are ordered, not independent.",
"",
"**If either SKILL.md check above comes back false, stop and say so.** A missing skill file",
"outranks every step in this list. Gotcha G-001 in the repo records that the content was never",
"altered, only deleted whole, so git log --diff-filter=D inside the library will find it.",
"",
"Ask before creating or deleting any skill.",
"",
"---"
].join("\n");
const FIXES={
 'CLAUDE.md':"BASIS: done \u2014 the library was pushed on 8 Aug. github.com/Joenebula/skills holds 31 skills, 5 agents, the workspace CLAUDE.md and 16 commits of history, at df2b3f2.\n\nThat was the whole of G-008: the one directory with a proven loss record (G-001, twice) had the weakest backup in the workspace. It now has a copy that is not on the machine.\n\nIt settled five other items as a side effect. Every claim about what a skill *contains* had been inferred from its name; all 49 skills and agents are now read from the files. The map's unverified count went from 34 to 0.\n\nTwo of those inferences turned out to be wrong in opposite directions \u2014 recorded as G-009.",
 'refactoring':"BASIS: done — applied in this repo on 6 Aug. Section 10's Always row listed four skills; CLAUDE.md listed three.\n\nSection 10 now matches CLAUDE.md, with refactoring moved to a new On demand row so it is not lost. Recorded as D-008, which also sets the general rule: CLAUDE.md wins on session behaviour, section 10 wins on build planping.\n\nNothing to do unless you disagree with the direction — the alternative was adding refactoring to CLAUDE.md's always-on list, which would have changed what loads every session to settle a documentation argument.",
 'security':"BASIS: done \u2014 and the answer was neither of the two I offered.\n\nThe skill is present: skills/security/SKILL.md, 63 lines, five laws. So section 10's claim that it was deleted from the working tree is false, and my correction \u2014 that a folder listing proves nothing \u2014 was right about the method and wrong about this file.\n\nBut the note's conclusion only half dies with its premise, which is why it was rewritten rather than deleted:\n\n\u2022 service_role (non-negotiable 2) IS owned now. Law 4 keeps secrets out of client bundles, Law 2 forbids a service credential from ever gating, and project-setup and ecommerce-security-audit name service_role and NEXT_PUBLIC_ directly.\n\n\u2022 Default-deny RLS (non-negotiable 1) is NOT. RLS and row-level security appear nowhere in the library \u2014 not in 31 skills, not in 5 agents, not in the workspace CLAUDE.md.\n\nThat is probably correct rather than a gap: the library is stack-agnostic and RLS is a Postgres and Supabase mechanism. Either way the RLS line in this repo's CLAUDE.md is load-bearing and stays. Recorded as D-011.",
 'security-route-auditor':"BASIS: done \u2014 all five agents read, and the overlap was not one.\n\nFour share a name with a skill, which reads as a duplicate. It is not. The skill holds the rules; the agent enforces them on a diff, read-only, and proposes no edits. Every one of the four says so in its own text \u2014 accessibility-auditor defers the bar to [[accessibility]], regression-auditor defers the model to [[regression-testing]], security-route-auditor audits the write path engineering-standards defines.\n\nfeature-completeness-auditor is the odd one out: it has no partner skill and catches the looks-done-but-isn't-wired class on its own.\n\nSection 10 now lists all five, with what each enforces and when to invoke it. It named one for three weeks, so it described roughly half of what fires. Recorded as D-012.",
 'security-review':"BASIS: done \u2014 closed by reading. Four things claim security and they do not collide; they are four scopes, narrowest to widest:\n\n    one route     security-route-auditor   agent, read-only\n    one diff      security-review          Claude Code built-in\n    the design    security                 the trust model, laws 1-5\n    the whole site ecommerce-security-audit plain-English report, pre-launch\n\nThree of the four already state their boundary. security itself defers write-path gating to engineering-standards, which is exactly what the route auditor watches.\n\nNothing needed rewriting. Section 10 now carries the table, because the scopes were real but nowhere written down.",
 'simplify':"BASIS: done \u2014 closed, no change needed. The overlap did not survive reading.\n\nreviewing-code is how to review: priority order, refute before you trust. refactoring is a different activity \u2014 restructuring without changing behaviour \u2014 and states the boundary itself: \"refactor and behaviour change never share a commit ([[reviewing-code]])\". simplify is a Claude Code command that runs a quality-only pass, and its own description says it does not hunt bugs.\n\nOne discipline, one different activity, one tool that performs the discipline.\n\nI did not add scope statements to all three. There was nothing to disambiguate, and noise in a description is what makes the wrong skill fire. Recorded as D-013.",
 'artifact-design':"BASIS: done — applied 6 Aug. All four editable design skills now route. frontend-design owns application surfaces, mydesignskill owns marketing surfaces and says so, bootstrap5-migration routes civic work to public-service-website and visual style to mydesignskill, and public-service-website now defers Bootstrap 5 mechanics back to bootstrap5-migration while keeping research, IA, content and accessibility.\n\nartifact-design itself is built into Claude Code and has no editable SKILL.md, so it cannot be rewritten. The other four route away from it, which achieves the same thing from the other direction. Recorded in docs/skills-map/design-routing.md.",
 'frontend-design':"BASIS: done — applied 6 Aug. The description is narrowed to application surfaces and names the four skills that should win instead. mydesignskill was rewritten in the same pass to state its precedence for marketing surfaces. Bodies untouched, frontmatter only.\n\nIf \"build a page and make it not look AI-generated\" still reaches this skill rather than mydesignskill, say so — that is the race this was meant to settle, and it would mean the wording needs another pass.",
 'accessibility':"BASIS: done for the two skills I can reach. public-service-website now owns WCAG 2.2, keyboard, screen reader and voice control for civic work, and bootstrap5-migration hands civic work to it by name rather than by hint.\n\nThe workspace accessibility skill is not in this container, so whether it duplicates them is still unread. If it does, its description should defer to those two for civic and Bootstrap contexts and keep the build step 3, 4 and 8 work for vibehq itself. That is a small edit once the library is pushed.",
 'ecommerce-security-audit':"BASIS: done — settled by consolidation on 6 Aug, not by a diff. There is only one skills library now: OneDrive\\Design2\\Web\\.claude\\skills, with C:\\Users\\joene\\.claude\\skills a junction to it.\n\nThe account copies of this skill and webaudio-plugin-builder went when that folder was removed. The workspace copies survived, so the drift question no longer has two files to be about.\n\nOne library, inside a git repo. Nothing further to do.",
 'ask-dont-guess':"BASIS: done \u2014 present and intact. skills/ask-dont-guess/SKILL.md, 130 lines, exactly as G-001 records it.\n\nNo action. It is mapped, just not from this repo \u2014 it is cited by law number from the workspace CLAUDE.md, not from vibehq's, and I called it orphaned because I had read only one of the two agreements.\n\nThat mistake and the security one point the same way and are recorded together as G-009: a listing tells you a folder exists, and \"not named here\" is not \"not named anywhere\".",
 'critical-thinking-partner':"BASIS: done — applied 6 Aug. Its trigger now fires only when explicitly asked — push back, stress-test this, what am I missing — instead of on any analysis, design, planning or review task, which was almost everything.\n\nI did not delete it, because deleting a skill is not mine to do. Its own note still says a disposition belongs in an always-loaded file or a chat Style; if you want that, move the body into the workspace CLAUDE.md and reduce this to a pointer. The narrowed trigger stops it firing by luck either way.",
 'knowledge-system-setup':"BASIS: done — applied 6 Aug. It now states that it must not be used on a project that already keeps its own ledgers, naming that condition explicitly. vibehq has docs/decisions.md, docs/gotchas.md and build-ledger.md, so it will no longer compete for project memory there.\n\nIt still works normally on projects that have nothing.",
 'session-start-hook':"BASIS: done — applied 6 Aug. The frontmatter name matches the directory, and manifest.json carries the entry it was missing. It listed 14 skills; it lists 15 now.\n\nI doubted this one and the doubt was wrong: the file really did declare name: startup-hook-skill.",
 'init':"BASIS: nothing is wrong. This is a precaution, and the lowest-value item here.\n\nThe built-in init skill generates a CLAUDE.md from the codebase, and vibehq/CLAUDE.md is hand-maintained. But /init only runs when you type it, so there is no accidental path to losing it.\n\nIf you want the guard anyway, add a line to CLAUDE.md saying it is hand-maintained and must not be regenerated. Otherwise skip this."
};

/* ---- capability tags. These are a browsing index for me, not something Claude reads:
   what actually decides whether a skill fires is its description. */
const TAGS={
 'engineering-standards':['review','planning'],
 'debugging':['testing','review'],
 'reviewing-code':['review','testing'],
 'refactoring':['review'],
 'project-setup':['infrastructure','planning'],
 'infrastructure':['infrastructure'],
 'data-modelling':['data'],
 'privacy-and-compliance':['security','planning'],
 'auth-and-accounts':['security','api'],
 'data-grids':['frontend','data'],
 'forms-and-input':['frontend'],
 'cms':['content','data'],
 'design-system':['design','frontend'],
 'accessibility':['accessibility','frontend'],
 'responsive-design':['frontend','design'],
 'seo':['seo','content'],
 'performance':['performance','frontend'],
 'api-design':['api'],
 'integrations':['api','data'],
 'background-jobs':['infrastructure','data'],
 'observability':['infrastructure','testing'],
 'analytics-dashboards':['data','frontend'],
 'preflight':['testing','infrastructure'],
 'regression-testing':['testing'],
 'releasing':['infrastructure'],
 'security':['security'],
 'email-and-notifications':['api','content'],
 'internationalization':['content','frontend'],
 'ecommerce-security-audit':['security','testing','review'],
 'webaudio-plugin-builder':['audio','frontend'],
 'bootstrap5-migration':['frontend','design','accessibility'],
 'public-service-website':['design','accessibility','content','frontend'],
 'mydesignskill':['design','frontend'],
 'frontend-design':['design','frontend'],
 'critical-thinking-partner':['review','planning'],
 'knowledge-system-setup':['planning'],
 'skill-creator':['planning','testing'],
 'session-start-hook':['config','infrastructure'],
 'morning':['planning'],
 'pdf':['documents'],'docx':['documents'],'pptx':['documents'],'xlsx':['documents','data'],
 'security-review':['security','testing','review'],
 'simplify':['review'],
 'init':['planning','config'],
 'dataviz':['design','data'],
 'artifact-design':['design','frontend'],
 'artifact-diagramming':['design','documents'],
 'artifact-capabilities':['frontend','config'],
 'claude-api':['api'],
 'run':['testing','infrastructure'],
 'update-config':['config'],
 'keybindings-help':['config'],
 'fewer-permission-prompts':['config'],
 'loop':['config','planning'],
 'ask-dont-guess':['planning','review'],
 'security-route-auditor':['security','review'],
 'accessibility-auditor':['accessibility','review'],
 'design-system-auditor':['design','review'],
 'feature-completeness-auditor':['testing','review'],
 'regression-auditor':['testing','review']
};

/* ---- what the library actually records about each skill ------------------------------
   Read out of skills/manifest.json, not guessed. Two honest limits:
   · No SKILL.md in this library carries a version. Not one. The frontmatter holds name,
     description and sometimes license — there is no version field to show, so VER is
     empty and the row simply does not render. It is here so a version appears the day
     one exists rather than needing the panel rewritten.
   · The manifest only covers the 15 account-synced skills. The workspace library has no
     manifest, so the rest genuinely have no recorded date, and the panel says so instead
     of inventing one. [updated, source] */
const VER={};
const META={
 'morning':['2026-08-05','anthropic-example'],
 'knowledge-system-setup':['2026-07-10','custom'],
 'critical-thinking-partner':['2026-07-09','custom'],
 'frontend-design':['2026-06-07','custom'],
 'webaudio-plugin-builder':['2026-07-13','custom'],
 'mydesignskill':['2026-06-14','custom'],
 'pdf':['2026-07-10','anthropic'],
 'public-service-website':['2026-05-28','custom'],
 'skill-creator':['2026-08-05','anthropic-example'],
 'bootstrap5-migration':['2026-05-28','custom'],
 'ecommerce-security-audit':['2026-07-16','custom'],
 'xlsx':['2026-08-03','anthropic'],
 'docx':['2026-08-03','anthropic'],
 'pptx':['2026-08-03','anthropic'],
 'session-start-hook':['2026-08-06','plugin']
};
const MONTH=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const niceDate=d=>{ const [y,m,dd]=d.split('-'); return +dd+' '+MONTH[+m-1]+' '+y; };
// how long ago, measured from the build rather than from now — the page is static, so "today"
// has to mean the day it was built or it drifts a little further from true every time it is
// opened without being rebuilt
const ago=iso=>{ const d=Math.round((Date.parse(BUILT)-Date.parse(iso))/86400000);
  return d<=0?'today':d===1?'yesterday':d<14?d+' days ago'
       :d<60?Math.round(d/7)+' weeks ago':Math.round(d/30)+' months ago'; };

const RINGS=[
  {key:'core',    label:'Always-on',    frac:.26,  col:'--r1'},
  {key:'phasemap',label:'In the build plan',frac:.52,  col:'--r2'},
  {key:'unmapped',label:'Not in the build plan',   frac:.755, col:'--r3'},
  {key:'builtin', label:'Claude Code',  frac:.975, col:'--r5'}
];
const ringOf=s=>s.ring;
const SECTOR={never:'#5E6B8C',G:'#8FD9A8',A:'#5EE0E8',B:'#6BB6F5',C:'#A78BFA',D:'#EC8CE0',E:'#F58A8A',
  F:'#F5C24E',H:'#6EE7A8',S2:'#7C9BF0'};

/* ---- what each skill is FOR ------------------------------------------------------------
   The build plan answers "when does this fire", and for half the library the answer is that
   nobody ever said — which is a true and useful finding, and the rings still carry it. It is
   not a place to put things. A column headed UNASSIGNED holding eighteen skills tells you
   nothing about any of them.

   So the board groups by what a thing is for. Where the build plan has an answer that answer
   is used, because it is the plan's and not mine to overrule; where it is silent, the group
   is the job the skills actually do. Every one of the 63 is in exactly one column and there
   is no bucket — build-map.mjs fails the build if that stops being true. */
const GROUP={
  // the build plan's own assignments, kept as it made them
  'engineering-standards':'always','debugging':'always','reviewing-code':'always',
  'refactoring':'always',
  'project-setup':'A','infrastructure':'A',
  'data-modelling':'B','privacy-and-compliance':'B',
  'auth-and-accounts':'C','data-grids':'C','forms-and-input':'C','cms':'C',
  'design-system':'C','accessibility':'C','responsive-design':'C',
  'seo':'D','performance':'D','api-design':'D',
  'integrations':'E','background-jobs':'E','observability':'E',
  'analytics-dashboards':'F',
  'preflight':'H','regression-testing':'H','releasing':'H','security':'H',
  'ecommerce-security-audit':'H','security-route-auditor':'H',
  'email-and-notifications':'S2','internationalization':'S2',
  'webaudio-plugin-builder':'never',

  // the design collision, together in one place for the first time — this is the group the
  // routing work in docs/skills-map/design-routing.md is about, and it is easier to argue
  // about five skills claiming one job when they are side by side
  'frontend-design':'design','mydesignskill':'design','bootstrap5-migration':'design',
  'public-service-website':'design','artifact-design':'design',
  'artifact-diagramming':'design','artifact-capabilities':'design','dataviz':'design',

  'pdf':'docs','docx':'docs','pptx':'docs','xlsx':'docs',
  'security-review':'quality','simplify':'quality','code-review':'quality',
  'ask-dont-guess':'style','critical-thinking-partner':'style',
  'accessibility-auditor':'audit','design-system-auditor':'audit',
  'feature-completeness-auditor':'audit','regression-auditor':'audit',
  'skill-creator':'setup','knowledge-system-setup':'setup','session-start-hook':'setup',
  'update-config':'setup','keybindings-help':'setup','fewer-permission-prompts':'setup',
  'loop':'setup','init':'setup','run':'setup','claude-api':'setup','morning':'setup'
};
const GROUP_ORDER=['always','A','B','C','D','E','F','H','S2',
                   'design','quality','audit','style','docs','setup','never'];
const GROUP_NAME={
  always:['Always on',       'loaded every session'],
  A:     ['Skeleton',        'build step 1 · pipeline'],
  B:     ['Database',        'build step 2 · migrations'],
  C:     ['Admin',           'build step 3'],
  D:     ['Public site',     'build step 4'],
  E:     ['Feeds',           'build step 5'],
  F:     ['Advertising',     'build step 6'],
  H:     ['Hardening',       'build step 8 · launch'],
  S2:    ['Accounts',        'after launch'],
  design:['Front-end design','how things look'],
  quality:['Code review',    'reading the diff'],
  audit: ['Auditors',        'agents that check'],
  style: ['How I work',      'disposition'],
  docs:  ['Documents',       'files in, files out'],
  setup: ['The setup',       'the tools themselves'],
  never: ['Excluded',        'never use']
};

/* ---- what a column actually means -------------------------------------------------------
   A heading is a label, not an explanation. "How I work" or "Auditors" tells you the name
   of the pile and nothing about why those things are in it or what you would do with them,
   and the phase-lettered ones are worse — they name a step of a plan the reader may not
   have open. Clicking a heading says what the column is for and what being in it implies. */
const GROUP_ABOUT={
  agreement:'<code>CLAUDE.md</code> is the project agreement, and it is not a skill. It loads before every session and decides which skills do — it names the always-on three, points at the four ledgers, and hands the step-by-step assignments to <code>BUILD-PLAN.md</code>. Everything else on this board is downstream of it.',
  always:'Loaded on every request, before any task is chosen, because <code>CLAUDE.md</code> names them by hand. They cost you context in every single session, so the bar for adding one is high — and <code>refactoring</code> is here on the build plan\u2019s say-so while <code>CLAUDE.md</code> lists only three. That mismatch was raised and settled; the finding on <code>refactoring</code> has the detail.',
  A:'Build step 1 of the plan: the skeleton and the deploy pipeline. Repo, Next.js app, Supabase projects, Vercel, DNS, CI — the empty page that is live and deploying before any feature exists.',
  B:'Build step 2: the database and its migrations. Every table, RLS on before data goes in, and every schema change as a SQL file in the repo rather than a click in the dashboard.',
  C:'Build step 3: the admin area. The only authenticated surface in stage 1 — auth, CRUD, forms, the CMS and the design system it is all built out of.',
  D:'Build step 4: the public site. This is the one that has to rank, so anything here is bound by the non-negotiable that it server-renders.',
  E:'Build step 5: the ticket feeds. Skiddle, Eventbrite and Ticketmaster. Blocked on affiliate approval rather than on any of these skills.',
  F:'Build step 6: the advertising engine.',
  H:'Build step 8: hardening and launch. Security, accessibility, performance, regression and the release itself — the work that decides whether the thing is safe to put in front of people.',
  S2:'After launch — stage 2, when accounts and the advert builder arrive together. Parked, but the schema already anticipates it.',
  design:'Everything that decides how something looks, in one column for the first time. <b>This is the collision.</b> Five of these fire on roughly the same intent, so which one Claude picks is not predictable, and the broader description usually wins. <code>docs/skills-map/design-routing.md</code> is the routing table that resolves it, drafted and not yet applied.',
  quality:'Reading a diff after it is written. Three skills claim it — the always-on <code>reviewing-code</code>, plus <code>simplify</code> for quality and <code>code-review</code> for bugs — and nothing says which owns what.',
  audit:'Agents rather than skills: they run as a separate pass with their own context instead of loading into yours. Four of the five appear in no document at all, so nothing says when any of them should be used.',
  style:'Not tasks — disposition. How to work rather than what to build: ask instead of guessing, and argue with an idea rather than agreeing with it. The open question is whether this belongs in a skill at all or in <code>CLAUDE.md</code>, where it would apply without needing to be triggered.',
  docs:'Files in, files out. PDFs, Word, PowerPoint, spreadsheets — nothing to do with VibeHQ, and they only fire when you name a file of that kind.',
  setup:'The tools that configure the tools. Making and editing skills, hooks, permissions, keybindings, the API reference, running the app. You reach for these while working on the workshop rather than on the work.',
  never:'Present, working, and marked <b>never use</b> for this project. It stays on the map because a skill that exists can still fire by accident — knowing it is parked is the point.'
};
