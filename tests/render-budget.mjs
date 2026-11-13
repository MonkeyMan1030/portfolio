import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {LeafField,seededRandom} from '../portfolio-static/dist/leaves.mjs';
// Browser harness: toolbar resizes must not resample fonts or reallocate canvases.
const source=fs.readFileSync(new URL('../portfolio-static/dist/notebook.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const events=new Map(),frames=new Map();let next=1,now=1000,layouts=0,allocations=0,reads=0,paints=0;
const paint=new Proxy({globalAlpha:1,clearRect(){paints++;}},{get:(t,k)=>t[k]??(()=>{})});
const rect=(left,top,width,height)=>({left,top:top-env.scrollY,right:left+width,bottom:top-env.scrollY+height,width,height});
function element(){return {style:{},textContent:'',isConnected:true,addEventListener:(n,f)=>events.set(n,f),setAttribute(){},removeAttribute(){},append(){},classList:{add(){},remove(){},toggle(){}}};}
function canvas(){const c={...element(),getContext:()=>paint};for(const prop of ['width','height']){let value=0;Object.defineProperty(c,prop,{get:()=>value,set:v=>{value=v;allocations++;}});}return c;}
const page=canvas(),book={...element(),getBoundingClientRect:()=>{reads++;return rect(0,0,390,2400);},offsetWidth:390,offsetHeight:2400};
const anchor={...element(),getBoundingClientRect:()=>{reads++;return rect(15,1400,350,250);}};
const controls={'page-sketch':page,'page-motion':element(),'replay-drawing':element()};
const doc={hidden:false,body:{classList:element().classList},documentElement:{scrollHeight:2400},getElementById:id=>controls[id],querySelector:s=>s==='.notebook'?book:anchor,querySelectorAll:()=>[],createElement:t=>t==='canvas'?canvas():element(),addEventListener:(n,f)=>events.set(n,f),dispatchEvent(){}};
const env={document:doc,LeafField,seededRandom,textSurfaces:()=>{layouts++;return[];},innerWidth:390,innerHeight:650,devicePixelRatio:3,scrollY:0,screen:{height:844},matchMedia:q=>({matches:q.includes('coarse'),addEventListener(){}}),performance:{now:()=>now},requestAnimationFrame:f=>{const id=next++;frames.set(id,f);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{constructor(f){events.set('book-resize',f);}observe(){}},CustomEvent:class{},setTimeout(){},getComputedStyle:()=>({display:'none'}),addEventListener:(n,f)=>events.set(n,f)};
env.window=env;vm.runInNewContext(source,env);await Promise.resolve();
function tick(ms=17){now+=ms;const callbacks=[...frames.values()];frames.clear();for(const f of callbacks)f(now);}
for(let i=0;i<300;i++)tick();
const start={layouts,allocations,reads};
for(let i=0;i<30;i++){env.innerHeight=650+i*4;env.scrollY=i*6;events.get('resize')();events.get('scroll')();tick();}
assert.equal(layouts,start.layouts,'Safari toolbar resizing must not resample glyphs');
assert.equal(allocations,start.allocations,'Safari toolbar resizing must not allocate canvases');
assert.equal(reads,start.reads,'Scrolling must not measure the DOM');
env.innerWidth=430;events.get('resize')();tick();assert.ok(layouts>start.layouts,'A real width change updates contact geometry');
const before=paints;env.scrollY=1300;events.get('scroll')();tick();for(let i=0;i<120;i++)tick(1000/120);assert.ok(paints-before<=32,'High refresh phones still paint at most about 30 times per second');
doc.hidden=true;events.get('visibilitychange')();assert.equal(frames.size,0,'Hidden tabs cancel pending work');
console.log('PASS: toolbar resize uses zero canvas allocations, zero glyph rescans, zero DOM reads; real reflow updates; 30Hz paint budget; hidden-tab cancellation');
