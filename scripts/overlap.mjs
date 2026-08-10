/* Description overlap — the one finding that can be mechanical.
 *
 * What decides whether a skill fires is its `description`. Two skills whose descriptions
 * claim the same ground are a real problem: both match, either can win, and which one does
 * is not predictable. Up to now that call was mine, made by reading names. This makes it
 * reproducible.
 *
 * The method, and its limits, stated plainly:
 *
 *   1. Descriptions are reduced to their *trigger* vocabulary — the words that describe
 *      what the skill is for, with stopwords and the boilerplate of skill-writing removed
 *      ("use", "when", "skill", "user", "trigger" and so on, which every description shares
 *      and which therefore carry no signal).
 *   2. Each remaining term is weighted by inverse document frequency, so a word used by one
 *      skill counts for far more than a word used by fifteen. Without this, every pair looks
 *      similar because every description says "code" and "file".
 *   3. Pairs are scored by weighted Jaccard overlap, and the shared high-weight terms are
 *      reported alongside the score — so a finding says *what* the collision is about, not
 *      just that one exists.
 *
 *   4. A skill's own name, and the names of every other skill, are struck out of the
 *      vocabulary. This one was learned the hard way. A description that routes properly
 *      says "for marketing pages use mydesignskill" — it names its neighbours on purpose,
 *      to hand work over. Counting those names as shared vocabulary made the corrected
 *      descriptions score WORSE than the broken ones they replaced: applying seven routing
 *      fixes took the measurement from 5 colliding pairs to 7. The metric was rewarding
 *      exactly the ambiguity it exists to find. Names are routing signal, not collision.
 *
 * What this cannot do: judge whether an overlap matters. Two skills can share vocabulary and
 * still be complementary. The score says "these two claim overlapping ground"; whether that
 * is a problem is still a reading. So the finding it produces is graded `observed` for the
 * measurement and asks for a decision, rather than asserting a fault.
 */

const STOP = new Set(`a an and are as at be been being but by can could do does for from
has have how if in into is it its may might must not of on or should so than that the their
them then there these they this those to use used uses using was were what when where which
while who why will with would you your i me my we our us
skill skills claude user users assistant agent task tasks trigger triggers invoke invoked
also only always never any all each every other others same such via without within
want wants wanted asks asking need needs needed help helps helping make makes making
work works working thing things something anything way ways new create creates creating
build builds building run runs running write writes writing read reads reading
file files folder folders directory directories name names
example examples e g ie eg etc more most less least good better best
do not use case cases context contexts request requests prompt prompts
apply applies applied appropriate relevant related general specific
before after during first next then finally instead rather
one two three four five six seven eight nine ten
its it's don't doesn't cannot can't won't isn't aren't`.split(/\s+/).filter(Boolean));

export function terms(text){
  return [...new Set(
    String(text||'')
      .toLowerCase()
      .replace(/`[^`]*`/g,' ')            // code spans are usually file names, not triggers
      .replace(/https?:\/\/\S+/g,' ')
      .replace(/[^a-z0-9\-\s]/g,' ')
      .split(/\s+/)
      .map(w=>w.replace(/^-+|-+$/g,''))
      .filter(w=>w.length>2 && !STOP.has(w) && !/^\d+$/.test(w))
  )];
}

export function overlaps(items, {min=0.10, top=3}={}){
  // every skill's name, in whole and in parts, so a routing hand-off does not read as a clash
  const NAMES = new Set();
  for(const s of items){
    NAMES.add(String(s.id).toLowerCase());
    for(const part of String(s.id).toLowerCase().split(/[-_]/)) if(part.length>2) NAMES.add(part);
  }
  const T = items.map(s=>({id:s.id,
    t:new Set(terms(s.description).filter(w=>!NAMES.has(w)))}));
  const N = T.length;
  // inverse document frequency: a word one skill uses is worth far more than one they share
  const df = new Map();
  for(const s of T) for(const w of s.t) df.set(w,(df.get(w)||0)+1);
  const idf = w => Math.log((N+1)/((df.get(w)||0)+0.5));

  const weight = set => [...set].reduce((a,w)=>a+idf(w),0);
  const out=[];
  for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
    const A=T[i].t, B=T[j].t;
    if(!A.size || !B.size) continue;
    const shared=[...A].filter(w=>B.has(w));
    if(!shared.length) continue;
    const inter=shared.reduce((a,w)=>a+idf(w),0);
    const union=weight(new Set([...A,...B]));
    const score=inter/union;
    if(score<min) continue;
    out.push({a:T[i].id, b:T[j].id, score:+score.toFixed(3),
      shared: shared.sort((x,y)=>idf(y)-idf(x)).slice(0,8)});
  }
  out.sort((p,q)=>q.score-p.score);
  // keep each skill's strongest few, so one verbose description cannot flood the list
  const seen={}, kept=[];
  for(const o of out){
    seen[o.a]=(seen[o.a]||0); seen[o.b]=(seen[o.b]||0);
    if(seen[o.a]>=top && seen[o.b]>=top) continue;
    seen[o.a]++; seen[o.b]++; kept.push(o);
  }
  return kept;
}
