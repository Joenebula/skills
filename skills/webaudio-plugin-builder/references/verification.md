# Verification

The rule: **never claim it works because it looks like it should.** In this project, every
time something was verified against reality it produced a surprise. Every time.

A syntax check proves nothing. `node --check` passes on code that throws on the first click.

## The four levels

### 1. Syntax — necessary, not sufficient

```bash
python3 -c "
import re; s=open('app.html').read()
open('/tmp/s.js','w').write(re.findall(r'<script[^>]*>(.*?)</script>', s, re.S)[-1])"
node --check /tmp/s.js
```

### 2. Dangling references — the one that catches removals

After removing any UI, **scan**. A `$("removedId").onclick = …` throws at load and kills the
entire script; you'll see a blank page and no clue why.

```bash
python3 - <<'PY'
import re
s = open('app.html').read()
ids  = set(re.findall(r'id="([^"]+)"', s))
used = set(re.findall(r'\$\("([^"]+)"\)', s))
print("MISSING ELEMENT IDS:", sorted(used - ids) or "none")
PY
```

Also grep for the *identifiers* you removed. Beware substring false positives —
`reversedB` matches inside `reversedBuffer`, `srcB` inside `srcBuf`. Check the hits, don't
just count them.

### 3. Real execution in a DOM — this is the one that matters

`jsdom` will run the whole app with stubbed audio. It catches everything the static scans miss.

```bash
npm i -s jsdom
node -e "
const fs=require('fs'), {JSDOM}=require('jsdom');
let html=fs.readFileSync('app.html','utf8');
// stub Web Audio + storage, which jsdom lacks
const stub='<script>(function(){const N=()=>new Proxy(function(){},{get:(t,k)=>k===\"then\"?undefined:N(),apply:()=>N(),set:()=>true});window.AudioContext=function(){return N()};window.OfflineAudioContext=function(){return N()};window.storage={get:async()=>null,set:async()=>{}};})();<\/script>';
html=html.replace('<script>', stub+'<script>');
const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({})});
  w.addEventListener('error',e=>errs.push('ERROR: '+e.message));
  w.console.error=(...a)=>errs.push('console.error: '+a.join(' '));
}});
setTimeout(()=>{
  console.log(errs.length ? errs.slice(0,8).join('\n') : 'no runtime errors at load');
  const d=dom.window.document;
  console.log('panels:', d.querySelectorAll('.panel').length);
  // then assert on whatever you just changed:
  d.querySelector('[data-help]').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
  console.log('modal opens:', d.querySelector('#helpModal').classList.contains('open'));
},600);"
```

Expect one benign error — the audio decode failing under the stub. Everything else is real.

### 4. Test the logic against the real data

This is the level people skip, and it's where the real bugs are.

**Extract the actual functions from the app** — not a re-implementation, the real ones — and
feed them the real input:

```bash
# pull the real functions out and run them against the user's actual file
python3 -c "
import re; s=open('app.html').read()
out=''
for fn in ['bpmFromName','bpmFromOnsets','scoreCandidate','detectTempo']:
    out += re.search(r'  function '+fn+r'\(.*?\n  \}', s, re.S).group(0) + '\n'
open('/tmp/probe.js','w').write(out)"
# then append a driver that loads the real audio and prints the scores
node /tmp/probe.js
```

This is how the tempo bug was found. Reasoning about the regex would have got the wrong
answer; *running* it printed `bpmFromName: 77` next to `bars=4 bpm=140.00 score=6.725` and the
cause was instantly visible.

Same technique for the tempo-sync check: 2,000 random rolls, assert every one lands exactly on
a note division. A property you can assert over a thousand trials is worth more than a hundred
lines of careful reading.

## The verification checklist

Before saying it's done:

- [ ] Syntax passes.
- [ ] No missing element IDs.
- [ ] The app **loads and runs** in jsdom without throwing.
- [ ] The specific thing you changed is asserted, in the DOM, programmatically.
- [ ] Any numeric/musical logic is checked against **real** input, not a hypothetical.
- [ ] Anything with a random component is checked over many trials, not one.
- [ ] You have told the user what was actually wrong, not just that it's fixed.
