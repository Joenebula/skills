/* Build the layout preview: the same 63 nodes drawn four ways, so a layout can be chosen
 * by looking at it rather than by reading a description of it.
 *
 * The data is lifted out of skills-data.js at build time for the same reason the map is —
 * a preview drawn from retyped data is a preview of something that does not exist.
 *
 *   node scripts/build-views.mjs
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT,'docs/skills-map/skills-data.js');
const OUT  = path.join(ROOT,'docs/skills-map/views-preview.html');

/* evaluate the data block in a sandbox so SKILLS/RINGS/etc arrive as real values */
const src = fs.readFileSync(DATA,'utf8');
const grab = name => {
  const m = new RegExp('const '+name+'\\s*=\\s*').exec(src);
  if (!m) throw new Error('missing '+name);
  const open = src.indexOf(src[m.index+m[0].length]==='[' ? '[' : '{', m.index);
  let d=0;
  for (let i=open;i<src.length;i++){
    const c=src[i];
    if (c==='['||c==='{') d++;
    else if (c===']'||c==='}'){ d--; if(!d) return src.slice(open,i+1); }
  }
  throw new Error('unbalanced '+name);
};
const S=(id,ring,phase,srcLib,w,desc,rel=[])=>({id,ring,phase,src:srcLib,w,desc,rel});
const SKILLS = new Function('S','return '+grab('SKILLS'))(S);
const RINGS  = new Function('return '+grab('RINGS'))();
const SECTOR = new Function('return '+grab('SECTOR'))();
const PHASES = new Function('return '+grab('PHASES'))();
const FIXES  = new Function('return '+grab('FIXES'))();

/* evidence, established exactly as the map build establishes it */
const LOADED = ['dataviz','artifact-design','artifact-diagramming','artifact-capabilities',
  'update-config','keybindings-help','code-review','simplify','fewer-permission-prompts',
  'loop','claude-api','run','init','security-review'];
const seen = new Set();
for (const dir of [process.env.HOME && path.join(process.env.HOME,'.claude/skills'),
                   path.join(ROOT,'docs/skills-map/restore-skills/skills')]) {
  if (!dir || !fs.existsSync(dir)) continue;
  for (const d of fs.readdirSync(dir))
    if (fs.existsSync(path.join(dir,d,'SKILL.md'))) seen.add(d);
}
const NODES = SKILLS.map(s=>({
  id:s.id, ring:s.ring, phase:s.phase, src:s.src, rel:s.rel,
  agent:s.src==='agent',
  open:!!FIXES[s.id],
  ev: seen.has(s.id) ? 'seen' : LOADED.includes(s.id) ? 'loaded' : 'named'
}));

const RINGCOL={core:'#F2A03C',phasemap:'#A78BFA',unmapped:'#5EC8F0',builtin:'#3E9C8F'};
const PAYLOAD = JSON.stringify({NODES,RINGS,SECTOR,PHASES,RINGCOL});

fs.writeFileSync(OUT, page(PAYLOAD));
console.log('built '+path.relative(ROOT,OUT));
console.log('  '+NODES.length+' nodes · '
  +NODES.filter(n=>n.ev==='named').length+' unverified · '
  +NODES.reduce((a,n)=>a+n.rel.length,0)+' declared relations');

function page(payload){ return `<title>Skills map — four ways to lay it out</title>
<style>
 :root{
  --void:#05070E; --ink:#E8EDF8; --ink2:#9AA6C4; --ink3:#5C6788;
  --amber:#F2A03C; --r3:#5EC8F0; --overlap:#E879C7; --present:#6EE7A8;
  --edge:rgba(140,170,235,.30); --edge2:rgba(140,170,235,.16);
  --font:'Roboto','Roboto Flex','Helvetica Neue',system-ui,-apple-system,sans-serif;
  --mono:'Roboto Mono',ui-monospace,'SF Mono',Menlo,monospace;
  --ease:cubic-bezier(.32,.72,.28,1);
 }
 *{box-sizing:border-box}
 html,body{margin:0;background:var(--void);color:var(--ink);font-family:var(--font);
  font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
 .wrap{max-width:1180px;margin:0 auto;padding:34px 22px 70px}
 h1{font-size:25px;font-weight:700;letter-spacing:-.02em;margin:0 0 7px}
 .sub{color:var(--ink2);font-size:15px;margin:0 0 26px;max-width:74ch}
 .sub b{color:var(--ink);font-weight:600}

 .tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;
  -webkit-user-select:none;user-select:none}
 .tab{appearance:none;border:0;cursor:pointer;font-family:inherit;font-size:14px;
  font-weight:600;padding:9px 15px;border-radius:9px;background:rgba(140,170,235,.08);
  color:var(--ink2);transition:background .16s var(--ease),color .16s var(--ease),
  box-shadow .16s var(--ease)}
 .tab:hover{background:rgba(140,170,235,.18);color:var(--ink)}
 .tab.on{background:rgba(94,200,240,.20);color:var(--r3);
  box-shadow:inset 0 0 0 1.2px rgba(94,200,240,.45)}
 .tab i{font-style:normal;opacity:.6;font-weight:400;margin-left:7px;font-family:var(--mono);
  font-size:12px}

 .stage{position:relative;background:rgba(8,12,24,.72);border-radius:14px;
  box-shadow:0 0 0 1px var(--edge2),0 18px 50px rgba(0,0,0,.55);overflow:hidden}
 svg{display:block;width:100%;height:auto;touch-action:none}
 .note{display:flex;gap:14px;align-items:flex-start;padding:15px 18px;
  border-top:1px solid var(--edge2);font-size:14px;color:var(--ink2);line-height:1.6}
 .note b{color:var(--ink);font-weight:600}
 .note .ans{flex:none;font-family:var(--mono);font-size:12px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--r3);padding-top:2px;width:104px}
 @media(max-width:700px){.note{display:block}.note .ans{width:auto;margin-bottom:5px}}

 .lbl{font-family:var(--font);font-size:8.5px;font-weight:600;fill:var(--ink);
  paint-order:stroke;stroke:var(--void);stroke-width:2.6px;stroke-linejoin:round;
  pointer-events:none}
 .lbl.dim{fill:var(--ink3)}
 .cap{font-family:var(--font);font-size:8px;font-weight:700;letter-spacing:.18em;
  fill:var(--ink3);text-transform:uppercase;pointer-events:none}
 .dot{transition:cx .85s var(--ease),cy .85s var(--ease),r .5s var(--ease),
  fill-opacity .5s var(--ease)}
 .lg{transition:transform .85s var(--ease),opacity .4s var(--ease)}
 .lk{fill:none;stroke:var(--overlap);stroke-opacity:.30;stroke-width:.9;
  transition:opacity .5s var(--ease),d .85s var(--ease)}
 .scaf{transition:opacity .5s var(--ease)}
 .hot .dot{fill-opacity:1}
 .node{cursor:pointer}
 .node.off .dot{fill-opacity:.13}
 .node.off .lbl{opacity:.22}

 .key{display:flex;flex-wrap:wrap;gap:9px 18px;margin:20px 0 0;font-size:13.5px;
  color:var(--ink2);-webkit-user-select:none;user-select:none}
 .key span{display:flex;align-items:center;gap:8px}
 .key i{width:9px;height:9px;border-radius:50%;flex:none}
 .key i.hollow{background:transparent;box-shadow:inset 0 0 0 1.5px var(--ink3)}
 .key i.dash{background:transparent;border:1.4px dotted var(--r3);width:13px;height:13px}
 .key i.ln{width:18px;height:2px;border-radius:0;background:var(--overlap)}
 @media(prefers-reduced-motion:reduce){.dot,.lg,.lk{transition:none}}
</style>

<div class="wrap">
<h1>Four ways to lay out the same map</h1>
<p class="sub">Every view below draws the <b>same 63 nodes</b> from your real library — same colours,
same evidence, same declared overlaps. Only the arrangement changes, so what you are judging is
whether the shape answers a question you actually have. The right-hand menu is unchanged in all of
them; this is the node area only. <b>Hover a node</b> to pick it out.</p>

<div class="tabs" id="tabs"></div>
<div class="stage">
  <svg id="viz" viewBox="0 0 1000 620" role="img" aria-label="Skills map layout preview"></svg>
  <div class="note"><span class="ans" id="ans"></span><span id="why"></span></div>
</div>

<div class="key">
  <span><i style="background:#F2A03C"></i>always-on</span>
  <span><i style="background:#A78BFA"></i>phase map</span>
  <span><i style="background:#5EC8F0"></i>not in phase map</span>
  <span><i style="background:#3E9C8F"></i>Claude Code</span>
  <span><i class="hollow"></i>unverified — name only</span>
  <span><i class="dash"></i>agent</span>
  <span><i class="ln"></i>declared overlap</span>
</div>
</div>

<script>
const D=${payload};
const {NODES:NN,SECTOR,PHASES,RINGCOL}=D;
const W=1000,H=620;
const svg=document.getElementById('viz');
const mk=(t,a)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',t);
  for(const k in a) e.setAttribute(k,a[k]); return e;};

/* only relations both sides can see, de-duplicated the same way the map does it */
const IDX={}; NN.forEach((n,i)=>IDX[n.id]=i);
const LINKS=[]; const seenPair=new Set();
NN.forEach(n=>n.rel.forEach(r=>{ if(IDX[r]===undefined) return;
  const k=n.id<r?n.id+'|'+r:r+'|'+n.id;
  if(seenPair.has(k)) return; seenPair.add(k); LINKS.push([n.id,r]); }));
const neigh={}; NN.forEach(n=>neigh[n.id]=new Set());
LINKS.forEach(([a,b])=>{neigh[a].add(b);neigh[b].add(a);});

/* ---------- layouts: each returns {x,y} per id, plus optional scaffolding ---------- */
const PHASE_ORDER=['always','A','B','C','D','E','F','G','H','S2','never','unmapped','builtin'];
const rad=(cx,cy,r,a)=>[cx+Math.cos(a)*r, cy+Math.sin(a)*r];

/* 1 — the radial map you have now, for comparison */
function layRadial(){
  const pos={}, scaf=[];
  const FR={core:.30,phasemap:.54,unmapped:.775,builtin:.97};
  const MAXR=Math.min(W,H)*.40;
  const byRing={};
  NN.forEach(n=>(byRing[n.ring]??=[]).push(n));
  for(const [ring,list] of Object.entries(byRing)){
    scaf.push({t:'ring',r:FR[ring]*MAXR,col:RINGCOL[ring],
      label:{core:'ALWAYS-ON',phasemap:'PHASE MAP',unmapped:'NOT IN PHASE MAP',
             builtin:'CLAUDE CODE'}[ring]});
    list.forEach((n,i)=>{
      const t=(i*0.6180339887)%1, r=FR[ring]*MAXR*(0.90+0.20*t);
      const [x,y]=rad(W/2,H/2,r,-Math.PI/2+((i+.5)/list.length)*Math.PI*2);
      pos[n.id]={x,y};
    });
  }
  return {pos,scaf,anchor:{x:W/2,y:H/2},links:true};
}

/* Whatever a simulation settles on, it has no idea how big the frame is. Scaling the
   result to fill the stage afterwards is what stops a layout being judged on how well its
   force constants happened to be tuned — the first attempt collapsed into a ball a tenth
   of the width, which says nothing about whether clustering is a useful view. */
function fit(pos,{padX=58,padY=46}={}){
  const xs=Object.values(pos).map(p=>p.x), ys=Object.values(pos).map(p=>p.y);
  const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const s=Math.min((W-padX*2)/Math.max(1,x1-x0),(H-padY*2)/Math.max(1,y1-y0));
  const ox=(W-(x1-x0)*s)/2-x0*s, oy=(H-(y1-y0)*s)/2-y0*s;
  const out={}; for(const k in pos) out[k]={x:pos[k].x*s+ox, y:pos[k].y*s+oy};
  return out;
}

/* 2 — clusters: overlap pulls, everything else pushes. The groups find themselves. */
function layCluster(){
  const P={}; let s=7;
  const rnd=()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff);
  NN.forEach(n=>{ const a=rnd()*Math.PI*2, r=90+rnd()*230;
    P[n.id]={x:W/2+Math.cos(a)*r, y:H/2+Math.sin(a)*r*.7, vx:0, vy:0}; });
  const deg={}; NN.forEach(n=>deg[n.id]=neigh[n.id].size);
  for(let it=0;it<900;it++){
    const cool=Math.max(.12,1-it/900);
    for(const [a,b] of LINKS){                       // overlap draws two nodes together
      const p=P[a],q=P[b], dx=q.x-p.x, dy=q.y-p.y;
      const d=Math.max(20,Math.hypot(dx,dy)), f=(d-72)*0.014;
      p.vx+=dx/d*f; p.vy+=dy/d*f; q.vx-=dx/d*f; q.vy-=dy/d*f;
    }
    // Repulsion has to reach further than a node's own neighbourhood or the unconnected
    // majority — 34 of 63 declare nothing — has nothing holding it apart and piles up.
    for(let i=0;i<NN.length;i++){
      const p=P[NN[i].id];
      for(let j=i+1;j<NN.length;j++){
        const q=P[NN[j].id]; const dx=q.x-p.x, dy=q.y-p.y;
        const d2=dx*dx+dy*dy; if(d2>62500||d2<1e-6) continue;   // 250 units of reach
        const d=Math.sqrt(d2), f=Math.min(3.2, 2400/d2);
        p.vx-=dx/d*f; p.vy-=dy/d*f; q.vx+=dx/d*f; q.vy+=dy/d*f;
      }
      // an isolated node drifts forever without this, but it is weak enough that a
      // cluster's own cohesion beats it
      p.vx+=(W/2-p.x)*0.0009; p.vy+=(H/2-p.y)*0.0013;
      p.vx*=.86*cool+.05; p.vy*=.86*cool+.05;
      p.x+=p.vx; p.y+=p.vy;
    }
  }
  const pos={}; NN.forEach(n=>pos[n.id]={x:P[n.id].x,y:P[n.id].y});
  return {pos:fit(pos),scaf:[],anchor:null,links:true};
}

/* 3 — a column per phase. Reading order, left to right, is the order they fire in. */
function layBoard(){
  const cols=PHASE_ORDER.filter(p=>NN.some(n=>n.phase===p));
  // Stacked from a common floor rather than centred. The whole point of the view is that
  // a taller column means more work waiting in that phase, and centring put the biggest
  // and the smallest column at the same eye level, which threw that away.
  const padL=30, padR=30;
  const cw=(W-padL-padR)/cols.length;
  const pos={}, scaf=[];
  // Three to a row rather than as many as fit. Wide rows make every column short and the
  // height differences vanish, which is the one thing this view is for.
  const per=Math.min(3,Math.max(1,Math.floor((cw-10)/16)));
  const tallest=Math.max(...cols.map(p=>Math.ceil(NN.filter(n=>n.phase===p).length/per)));
  const rowH=Math.min(30,(H-190)/Math.max(1,tallest-1));
  // the block is centred, and the boxes hug it — sized to the content rather than the frame
  const contentH=(tallest-1)*rowH;
  const base=Math.round((H+contentH)/2)+14, top=base-contentH;
  cols.forEach((p,ci)=>{
    const list=NN.filter(n=>n.phase===p);
    const cx=padL+cw*ci+cw/2;
    scaf.push({t:'col',x:padL+cw*ci,w:cw,label:shortPhase(p),n:list.length,
               col:SECTOR[p]||'#5C6788',top,base});
    list.forEach((n,i)=>{
      const row=Math.floor(i/per), inRow=i%per;
      const rowN=Math.min(per,list.length-row*per);
      pos[n.id]={x:cx+(inRow-(rowN-1)/2)*16, y:base-row*rowH};   // grows upward from the floor
    });
  });
  return {pos,scaf,anchor:null,links:false};
}

/* 4 — one row, overlaps arced over it. Density is the whole point. */
function layArc(){
  const order=[...NN].sort((a,b)=>
    PHASE_ORDER.indexOf(a.phase)-PHASE_ORDER.indexOf(b.phase) || a.id.localeCompare(b.id));
  const padL=48, padR=48, y=H-96;
  const step=(W-padL-padR)/(order.length-1);
  const pos={}, scaf=[];
  order.forEach((n,i)=>pos[n.id]={x:padL+step*i, y});
  // A phase name under a 63-node row has about 15 units of width and needs 40, so they
  // printed straight through each other. Two staggered rows, and the lettered phases drop
  // the word "phase" — the tick colour already says what kind of label it is.
  let last=null, k=0;
  order.forEach((n,i)=>{ if(n.phase!==last){ last=n.phase;
    scaf.push({t:'tick',x:padL+step*i,y,label:shortPhase(n.phase,true),
               col:SECTOR[n.phase]||'#5C6788',row:(k++)%2}); }});
  return {pos,scaf,anchor:null,links:'arc'};
}

function shortPhase(p,terse){
  if(p==='always')return'ALWAYS';
  if(p==='unmapped')return'UNMAPPED';
  if(p==='builtin')return'BUILT IN';
  if(p==='never')return'NEVER';
  if(p==='S2')return terse?'ST2':'STAGE 2';
  return terse?p:'PHASE '+p;
}

const VIEWS=[
 {k:'radial',name:'Radial',n:'what you have now',lay:layRadial,
  ans:'where it lives',
  why:'<b>Distance from the centre is authority.</b> The inner band loads every session; the outer is built into Claude Code and you did not write it. Good for holding the whole library at once, and the one view where the governing document is visibly at the centre of everything. Weak on overlap — two colliding skills can sit on opposite sides of the map.'},
 {k:'cluster',name:'Clusters',n:'overlap pulls',lay:layCluster,
  ans:'what collides',
  why:'<b>Skills that declare an overlap pull together; everything else pushes apart.</b> The groups are not drawn, they emerge — so a tight knot is a real collision zone you can point at, and a node sitting alone is one nothing else competes with. This is the view for the problem the map exists to solve. Weak on structure: ring and phase become almost invisible.'},
 {k:'board',name:'Phase board',n:'a column each',lay:layBoard,
  ans:'when it fires',
  why:'<b>One column per phase, left to right in the order you build.</b> Column height is how much you are carrying into that phase — and the two tallest columns here are the ones nothing has assigned. The clearest view for planning a phase, and the fastest to scan for gaps. It cannot show overlap at all, which is why it is not the only view.'},
 {k:'arc',name:'Arc',n:'one row, links over',lay:layArc,
  ans:'how tangled',
  why:'<b>Every skill on one line, every declared overlap arced above it.</b> A tall arc is a collision reaching across phases; a cluster of short ones is a local tangle. Density is legible at a glance in a way it is not on any other view — you can see the whole overlap problem in one shape. Weak at telling you about any individual node.'}
];

/* ---------- draw ---------- */
const gScaf=mk('g',{class:'scaf'}), gLink=mk('g',{}), gNode=mk('g',{});
svg.append(gScaf,gLink,gNode);
const el={}, lgEl={}, linkEl=[];
let anchorEl=null;

NN.forEach(n=>{
  const g=mk('g',{class:'node',tabindex:'0','aria-label':n.id});
  const c=RINGCOL[n.ring]||'#9AA6C4';
  const r=n.agent?4.2:3.6;
  if(n.ev==='named'){
    g.appendChild(mk('circle',{class:'dot',r,fill:c,'fill-opacity':.16}));
    g.appendChild(mk('circle',{class:'dot',r,fill:'none',stroke:c,'stroke-width':1.1,
      'stroke-opacity':.85}));
  } else g.appendChild(mk('circle',{class:'dot',r,fill:c}));
  if(n.agent) g.appendChild(mk('circle',{class:'dot',r:r+3.4,fill:'none',stroke:c,
    'stroke-width':.9,'stroke-dasharray':'1.8 2.6'}));
  if(n.open) g.appendChild(mk('circle',{class:'dot',r:r+6,fill:'none',stroke:'#F2A03C',
    'stroke-width':.8,'stroke-opacity':.55}));
  g.appendChild(mk('circle',{r:11,fill:'transparent'}));
  const t=mk('text',{class:'lbl'+(n.ev==='named'?' dim':''),x:0,y:-8.5,'text-anchor':'middle'});
  t.textContent=n.id; t.style.opacity=0; g.appendChild(t);
  gNode.appendChild(g); el[n.id]=g; lgEl[n.id]=t;
  g.onpointerenter=()=>light(n.id);
  g.onpointerleave=()=>light(null);
  g.onfocus=()=>light(n.id); g.onblur=()=>light(null);
});
LINKS.forEach(()=>{ const p=mk('path',{class:'lk'}); gLink.appendChild(p); linkEl.push(p); });

let cur=null;
function render(v,animate){
  const {pos,scaf,anchor,links}=v.lay();
  // scaffolding is rebuilt rather than tweened — it is a different thing each time
  gScaf.style.opacity=0;
  setTimeout(()=>{
    gScaf.replaceChildren();
    scaf.forEach(s=>{
      if(s.t==='ring'){
        gScaf.appendChild(mk('circle',{cx:W/2,cy:H/2,r:s.r,fill:'none',stroke:s.col,
          'stroke-opacity':.16,'stroke-width':.8,'stroke-dasharray':'1.5 4'}));
        const tx=mk('text',{class:'cap',x:W/2,y:H/2-s.r-7,'text-anchor':'middle'});
        tx.textContent=s.label; gScaf.appendChild(tx);
      } else if(s.t==='col'){
        gScaf.appendChild(mk('rect',{x:s.x+2,y:s.top-14,width:s.w-4,height:s.base-s.top+30,
          rx:8,fill:s.col,'fill-opacity':.045}));
        gScaf.appendChild(mk('line',{x1:s.x+4,y1:s.base+13,x2:s.x+s.w-4,y2:s.base+13,
          stroke:s.col,'stroke-opacity':.30,'stroke-width':1}));
        const tx=mk('text',{class:'cap',x:s.x+s.w/2,y:s.top-24,'text-anchor':'middle'});
        tx.textContent=s.label; gScaf.appendChild(tx);
        const c2=mk('text',{class:'cap',x:s.x+s.w/2,y:s.base+28,'text-anchor':'middle'});
        c2.textContent=s.n; c2.style.fill=s.col; c2.style.opacity=.85; gScaf.appendChild(c2);
      } else if(s.t==='tick'){
        const dy=s.row?30:16;
        gScaf.appendChild(mk('line',{x1:s.x-5,y1:s.y+12,x2:s.x-5,y2:s.y+dy+6,
          stroke:s.col,'stroke-opacity':.45,'stroke-width':1}));
        const tx=mk('text',{class:'cap',x:s.x-1,y:s.y+dy+15,'text-anchor':'start'});
        tx.textContent=s.label; tx.style.fill=s.col; tx.style.opacity=.9;
        gScaf.appendChild(tx);
      }
    });
    if(anchor){
      gScaf.appendChild(mk('circle',{cx:anchor.x,cy:anchor.y,r:26,fill:'#F2A03C',
        'fill-opacity':.10}));
      gScaf.appendChild(mk('circle',{cx:anchor.x,cy:anchor.y,r:8,fill:'#F2A03C'}));
      const tx=mk('text',{class:'cap',x:anchor.x,y:anchor.y+24,'text-anchor':'middle'});
      tx.textContent='CLAUDE.MD'; tx.style.fill='#F2A03C'; gScaf.appendChild(tx);
    }
    gScaf.style.opacity=1;
  },animate?260:0);

  NN.forEach(n=>{ const p=pos[n.id];
    el[n.id].setAttribute('transform','translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')');
    el[n.id].classList.add('lg');
  });
  gLink.style.opacity=links?1:0;
  LINKS.forEach(([a,b],i)=>{
    const p=pos[a], q=pos[b];
    if(links==='arc'){
      const mx=(p.x+q.x)/2, h=Math.min(430,Math.abs(q.x-p.x)*.76);
      linkEl[i].setAttribute('d','M'+p.x+' '+p.y+' Q'+mx+' '+(p.y-h)+' '+q.x+' '+q.y);
    } else {
      linkEl[i].setAttribute('d','M'+p.x+' '+p.y+' L'+q.x+' '+q.y);
    }
  });
  cur=v; document.getElementById('ans').textContent=v.ans;
  document.getElementById('why').innerHTML=v.why;
}

function light(id){
  NN.forEach(n=>{
    const on = !id || n.id===id || neigh[id].has(n.id);
    el[n.id].classList.toggle('off', !!id && !on);
    lgEl[n.id].style.opacity = id && (n.id===id || neigh[id].has(n.id)) ? 1 : 0;
  });
  LINKS.forEach(([a,b],i)=>
    linkEl[i].style.opacity = !id ? .55 : (a===id||b===id ? 1 : .07));
}

const tabs=document.getElementById('tabs');
VIEWS.forEach((v,i)=>{
  const b=document.createElement('button');
  b.className='tab'+(i===0?' on':''); b.innerHTML=v.name+'<i>'+v.n+'</i>';
  b.onclick=()=>{ [...tabs.children].forEach(c=>c.classList.remove('on'));
    b.classList.add('on'); render(v,true); light(null); };
  tabs.appendChild(b);
});
render(VIEWS[0],false); light(null);
</script>
`;}
