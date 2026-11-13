import {SketchTiles} from './sketch-tiles.mjs?v=13';
import {textSurfaces} from './contact.js?v=13';
import { LeafField, seededRandom } from './leaves.mjs?v=13';
const canvas=document.getElementById('page-sketch');
let ctx=canvas?.getContext('2d');
const drawing=new SketchTiles(canvas,()=>{const tile=document.createElement('canvas');document.body.append(tile);return tile;});
let paintTop=0,paintBottom=0;
const book=document.querySelector('.notebook'),anchor=document.querySelector('.tree-anchor');
const replay=document.getElementById('replay-drawing'),motion=document.getElementById('page-motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(pointer: coarse)').matches,frameInterval=mobile?1000/30:1000/60;
const field=new LeafField(231),colors=['#bd4e22','#dba832','#8f3826','#d77724'];
let paused=reduced.matches,raf=0,last=0,acc=0,scrollY=window.scrollY,previousScroll=scrollY,lastScrollAt=0;
let W=innerWidth,H=innerHeight,dpr=1,tree=null,branches=[],buds=[],foliage=[],bookRect=null,geometryDirty=true;
let introStart=0,intro=false,seedBurst=false,spawnAt=0,windVisual=0,pointer=null,hasStarted=false;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let underlines=[],ledgesDirty=false,paintRequested=true,paintAt=0,treeSize='',introDoneAt=0;
field.maxLeaves=mobile?96:600;
function measure(){
  W=document.documentElement.clientWidth||innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,mobile?1.5:2);
  const b=book.getBoundingClientRect();bookRect={left:b.left,right:b.right,top:b.top+scrollY,height:book.offsetHeight};
  field.width=W;field.height=Math.ceil(bookRect.top+bookRect.height);
  drawing.resize(W,field.height,dpr);
  underlines=[...document.querySelectorAll('#name .name-line')].map(line=>{const r=line.getBoundingClientRect();return{left:r.left,width:r.width,y:r.bottom+scrollY+3};});
  updateLedges();
  if(anchor){const r=anchor.getBoundingClientRect();tree={x:r.left,y:r.top+scrollY,w:r.width,h:r.height};const key=[r.width,r.height,dpr].join(':');if(key!==treeSize){treeSize=key;buildTree();}}
  geometryDirty=false;
}
function updateLedges(reuseLayout=false){field.setLedges(textSurfaces({reuseLayout}));ledgesDirty=false;}
document.addEventListener('letter-layout',()=>{ledgesDirty=true;requestPaint();});
if(anchor){anchor.removeAttribute('aria-hidden');const reset=document.createElement('button');reset.id='reset-leaves';reset.type='button';reset.textContent='reset leaves';anchor.append(reset);reset.onclick=()=>{drawing.invalidate();for(const l of field.leaves){l.ledge=null;l.clearing=true;l.vx=(field.random()-.5)*80;}if(paused){field.leaves=[];render(performance.now());}else schedule();};}
function buildTree(){
 branches=[];buds=[];const random=seededRandom(823),w=Math.min(tree.w*.94,450),h=tree.h,ox=(tree.w-w)*.6;
 const branch=(x,y,cx,cy,ex,ey,width,endWidth,start)=>branches.push({x:ox+x*w,y:y*h,cx:ox+cx*w,cy:cy*h,ex:ox+ex*w,ey:ey*h,width,endWidth,start,duration:.6});
 branch(.54,.94,.56,.70,.49,.43,17,7,.05);
 branch(.53,.75,.39,.62,.22,.45,8,1.5,.35);
 branch(.53,.69,.68,.57,.82,.46,7,1.5,.4);
 branch(.51,.58,.38,.43,.29,.29,6,1,.45);
 branch(.50,.53,.62,.40,.69,.25,5,1,.5);
 branch(.49,.44,.46,.27,.49,.12,5,.8,.55);
 branch(.42,.63,.28,.59,.13,.59,3,.6,.65);
 branch(.66,.58,.75,.60,.89,.59,3,.6,.7);
 const clusters=[[.48,.20,.16,.14],[.31,.31,.17,.16],[.66,.30,.17,.14],[.20,.46,.15,.13],[.79,.46,.15,.12],[.49,.43,.23,.20],[.32,.58,.17,.12],[.66,.58,.18,.12]];
 // Overlapping irregular clumps follow the branch structure instead of a flat ellipse.
 foliage=[];
 clusters.forEach(([cx,cy,rx,ry],index)=>{const layer=document.createElement('canvas');layer.width=Math.ceil(tree.w*dpr);layer.height=Math.ceil(h*dpr);const paint=layer.getContext('2d');paint.scale(dpr,dpr);for(let i=0;i<210;i++){
  const angle=random()*Math.PI*2,rad=Math.sqrt(random()),edge=1+.12*Math.sin(angle*5+index);
  const bud={x:ox+(cx+Math.cos(angle)*rad*rx*edge)*w,y:(cy+Math.sin(angle)*rad*ry*edge)*h,r:4+random()*4.6,angle:random()*6.28,color:Math.floor(random()*4),delay:.65+index*.06+random()*.85};buds.push(bud);leafShape(bud.x,bud.y,bud.r,bud.angle,colors[bud.color],.82+(i%3)*.06,paint);
 }foliage.push(layer);});
}
function leafShape(x,y,r,a,color,alpha=1,paint=ctx){
  const ctx=paint;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r*.7,-r*.8,0,-r*.55);ctx.lineTo(r*.45,-r*.9);ctx.lineTo(r*.55,-r*.25);ctx.lineTo(r,0);ctx.quadraticCurveTo(r*.2,r, -r,0);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#695b3f';ctx.lineWidth=.45;ctx.stroke();ctx.beginPath();ctx.moveTo(-r*1.3,.3);ctx.lineTo(r*.68,0);ctx.moveTo(-r*.3,0);ctx.lineTo(r*.1,-r*.35);ctx.stroke();ctx.restore();
}
function drawTree(elapsed){
  if(!tree||tree.y+tree.h<paintTop||tree.y>paintBottom)return;
  const drawTime=intro?elapsed:10;
  ctx.save();ctx.beginPath();ctx.rect(bookRect.left,bookRect.top+68,bookRect.right-bookRect.left,bookRect.height);ctx.clip();ctx.translate(tree.x,tree.y);
  const sway=windVisual*.025;
  function moved(x,y){return[x+sway*(1-y/tree.h)**2,y];}
  for(const b of branches){
    const t=clamp((drawTime-b.start)/b.duration,0,1);if(t===0)continue;
    // Subdivision draws the growing tip along the actual quadratic, not a clip of a movie.
    const p0=moved(b.x,b.y),p1=moved(b.cx,b.cy),p2=moved(b.ex,b.ey);
    const q=[p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t];
    const e=[(1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]];
    // Short tapered pencil segments preserve a natural widening toward the roots.
    ctx.strokeStyle='#35362d';ctx.lineCap='round';
    for(let j=0;j<24;j++){const a=t*j/24,z=t*(j+1)/24;const at=u=>[(1-u)**2*p0[0]+2*(1-u)*u*p1[0]+u*u*p2[0],(1-u)**2*p0[1]+2*(1-u)*u*p1[1]+u*u*p2[1]];ctx.beginPath();ctx.moveTo(...at(a));ctx.lineTo(...at(z));ctx.lineWidth=b.width+(b.endWidth-b.width)*z;ctx.stroke();}
    ctx.beginPath();ctx.moveTo(p0[0]+2,p0[1]+.8);ctx.quadraticCurveTo(q[0]+1.8,q[1],e[0]+1,e[1]);ctx.strokeStyle='#7a76564d';ctx.lineWidth=.65;ctx.stroke();
    if(t<1){ctx.beginPath();ctx.arc(e[0],e[1],1.4,0,Math.PI*2);ctx.fillStyle='#535e48';ctx.fill();}
  }
  foliage.forEach((layer,i)=>{const t=intro?clamp((drawTime-.65-i*.06)/1.5,0,1):1;if(!t)return;ctx.save();ctx.globalAlpha=t;ctx.drawImage(layer,Math.sin(field.time*.6+i)*.7+windVisual*.008,0,tree.w,tree.h);ctx.restore();});
  ctx.restore();
}
function drawMargins(elapsed){
  if(!bookRect)return;const left=bookRect.left+16,right=bookRect.right-15;
  const maxY=bookRect.top+bookRect.height-30,begin=bookRect.top+95;
  const reveal=intro?clamp(elapsed/2.6,0,1):1;
  for(const [x,sign]of[[left,1],[right,-1]]){
    const end=begin+(maxY-begin)*reveal;
    ctx.beginPath();let started=false;
    for(let y=Math.max(begin,begin+Math.floor((paintTop-begin)/4)*4-4);y<Math.min(end,paintBottom+4);y+=4){const xx=x+Math.sin(y*.016)*5+Math.sin(y*.035)*2+Math.sin(field.time*.4+y*.02)*Math.min(1.3,Math.abs(windVisual)*.015);if(!started){ctx.moveTo(xx,y);started=true;}else ctx.lineTo(xx,y);}
    ctx.strokeStyle='#3f5a34d9';ctx.lineWidth=1.7;ctx.lineCap='round';ctx.stroke();
    for(let y=begin+30;y<end;y+=66){if(y<paintTop-30||y>paintBottom+30)continue;const xx=x+Math.sin(y*.016)*5,side=(Math.floor(y/66)%2?1:-1)*sign;ctx.beginPath();ctx.moveTo(xx,y);ctx.quadraticCurveTo(xx+side*16,y-18,xx+side*9,y-24);ctx.quadraticCurveTo(xx+side*1,y-19,xx,y);ctx.fillStyle=Math.floor(y/66)%3?'#5f7d45b3':'#b0612fb3';ctx.fill();ctx.strokeStyle='#33482bd9';ctx.lineWidth=1.1;ctx.stroke();}
  }
}
function drawUnderlines(elapsed){
  underlines.forEach((r,i)=>{const y=r.y;if(y<paintTop-30||y>paintBottom+30)return;const t=intro?clamp((elapsed-1.2-i*.35)/.65,0,1):1;ctx.beginPath();ctx.moveTo(r.left+4,y);const end=r.left+(r.width-7)*t;ctx.quadraticCurveTo(r.left+r.width*.5,y+4,end,y+1);ctx.strokeStyle='#c5391fd9';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.stroke();if(intro&&t>0&&t<1){ctx.beginPath();ctx.moveTo(end,y);ctx.lineTo(end+16,y-29);ctx.strokeStyle='#626a56';ctx.lineWidth=3;ctx.stroke();}});
}
function render(now){
  if(!ctx||!drawing.tiles.length)return;const elapsed=(now-introStart)/1000;
  const visible=new Set(drawing.visible(scrollY,H));
  for(const tile of drawing.tiles){
    // Populate every tile on layout/intro changes. Idle offscreen drawings stay
    // ready for a fast fling without waiting for a JavaScript scroll event.
    if(!tile.dirty&&!intro&&!visible.has(tile))continue;
    ctx=tile.ctx;paintTop=tile.top;paintBottom=tile.top+tile.height;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,tile.height);
    ctx.save();ctx.translate(0,-tile.top);
    drawMargins(elapsed);drawTree(elapsed);drawUnderlines(elapsed);
    for(const l of field.leaves){if(l.y<paintTop-25||l.y>paintBottom+25)continue;leafShape(l.x,l.y,l.r,l.angle,colors[l.color],.86);}
    ctx.restore();tile.dirty=false;
  }
}

function release(count=1){
  if(!tree||!buds.length)return;
  for(let i=0;i<count;i++){
    // The leftmost canopy reaches the name, so leaves can settle on actual letters.
    const candidates=buds.filter(b=>b.x<tree.w*.6),pool=candidates.length?candidates:buds;
    const b=pool[Math.floor(field.random()*pool.length)];
    field.spawn(tree.x+b.x,tree.y+b.y,{vx:-35-field.random()*40,vy:8+field.random()*12,color:b.color,r:4+field.random()*3});
  }
}
function finishIntro(){intro=false;drawing.invalidate();document.body.classList.remove('drawing-on','intro-pending');if(replay)replay.textContent='Replay drawing';}
function startIntro(){
  if(!anchor||paused){finishIntro();render(performance.now());return;}
  introStart=performance.now();intro=true;seedBurst=false;field.leaves=[];spawnAt=0;document.body.classList.remove('drawing-on');void book.offsetWidth;drawing.invalidate();document.body.classList.add('drawing-on');document.body.classList.remove('intro-pending');replay.textContent='Skip drawing';last=0;introDoneAt=introStart+3600;requestPaint();
}
function frame(now){
  raf=0;
  if(now-paintAt<frameInterval-1){schedule();return;}
  paintAt=now;paintRequested=false;scrollY=window.scrollY;
  if(geometryDirty)measure();else if(ledgesDirty)updateLedges(true);
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused){
    acc+=dt;let steps=0;while(acc>=1/120&&steps++<8){field.step(1/120);acc-=1/120;}
    windVisual+=(field.wind-windVisual)*Math.min(1,dt*3);

    const elapsed=(now-introStart)/1000;
    if(intro&&elapsed>1.5&&!seedBurst){release(14);seedBurst=true;}
    if(intro&&now>=introDoneAt)finishIntro();
    if(tree&&tree.y+tree.h>scrollY&&tree.y<scrollY+H&&now-spawnAt>1600&&(!intro||elapsed>1.6)){release();spawnAt=now;}
  }
  render(now);schedule();
}
function requestPaint(){paintRequested=true;schedule();}
function schedule(){if(ctx&&hasStarted&&!raf&&!document.hidden&&(paintRequested||(!paused&&(intro||(tree&&tree.y+tree.h>scrollY&&tree.y<scrollY+H)||field.leaves.some(l=>l.ledge===null)))))raf=requestAnimationFrame(frame);}
function setPaused(value){paused=value;document.body.classList.toggle("motion-paused",value);motion?.setAttribute('aria-pressed',String(paused));if(motion)motion.textContent=paused?'Resume motion':'Pause motion';motion?.setAttribute('aria-label',paused?'Resume page animation':'Pause page animation');document.dispatchEvent(new CustomEvent('notebook-motion',{detail:{paused}}));if(paused){finishIntro();if(raf)cancelAnimationFrame(raf);raf=0;render(performance.now());}else{last=0;schedule();}}
replay?.addEventListener('click',()=>{if(intro){finishIntro();requestPaint();}else{if(paused)setPaused(false);startIntro();}});
motion?.addEventListener('click',()=>setPaused(!paused));
document.addEventListener('motion-request',e=>setPaused(e.detail.paused));
window.addEventListener('scroll',()=>{const now=performance.now(),y=window.scrollY,delta=y-previousScroll,dt=Math.max(16,now-lastScrollAt);field.gust(clamp(delta/dt*10,-30,30));previousScroll=y;lastScrollAt=now;scrollY=y;requestPaint();},{passive:true});
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;const now=performance.now();if(pointer){const dt=Math.max(16,now-pointer.time);const vx=(e.clientX-pointer.x)/dt*1000,vy=(e.clientY-pointer.y)/dt*1000;field.disturb(e.clientX,e.clientY+scrollY,vx,vy);if(Math.abs(vx)>100)field.gust(clamp(vx*.003,-3,3));}pointer={x:e.clientX,y:e.clientY,time:now};},{passive:true});
window.addEventListener('resize',()=>{if((document.documentElement.clientWidth||innerWidth)!==W)geometryDirty=true;H=innerHeight;requestPaint();});
new ResizeObserver(()=>{geometryDirty=true;requestPaint();}).observe(book);
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else requestPaint();});
reduced.addEventListener('change',e=>{if(e.matches)setPaused(true);});
if(!anchor&&replay)replay.hidden=true;
if(ctx){
  setPaused(paused);
  // Wait for the local handwriting font, but never leave content waiting on it.
  const ready=document.fonts?document.fonts.ready:Promise.resolve();
  const begin=()=>{if(hasStarted)return;hasStarted=true;measure();if(anchor&&!paused)startIntro();else render(performance.now());schedule();};
  // The title card plays first; the page drawing starts when it lifts.
  const card=document.getElementById('splash');
  ready.then(()=>{if(card&&card.isConnected&&!paused&&getComputedStyle(card).display!=='none'){document.addEventListener('splash-done',begin,{once:true});setTimeout(begin,4500);}else begin();});
}else {if(replay)replay.hidden=true;if(motion)motion.hidden=true;}
