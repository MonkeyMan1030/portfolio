import { LeafField, seededRandom } from './leaves.mjs';
const canvas=document.getElementById('page-sketch'),ctx=canvas?.getContext('2d');
const book=document.querySelector('.notebook'),anchor=document.querySelector('.tree-anchor');
const replay=document.getElementById('replay-drawing'),motion=document.getElementById('page-motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const field=new LeafField(231),colors=['#c5391f','#d39a2c','#8f2f1c','#5f7d45'];
let paused=reduced.matches,raf=0,last=0,acc=0,scrollY=window.scrollY,previousScroll=scrollY,lastScrollAt=0;
let W=innerWidth,H=innerHeight,dpr=1,tree=null,branches=[],buds=[],surfaces=[],bookRect=null,geometryDirty=true;
let introStart=0,intro=false,seedBurst=false,spawnAt=0,frameCount=0,windVisual=0,pointer=null,hasStarted=false;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function measure(){
  W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const b=book.getBoundingClientRect();bookRect={left:b.left,right:b.right,top:b.top+scrollY,height:book.offsetHeight};
  field.width=W;field.height=document.documentElement.scrollHeight;
  surfaces=[...document.querySelectorAll('.edible,.leaf-ledge')].map((element,id)=>({element,id}));
  updateLedges();
  if(anchor){const r=anchor.getBoundingClientRect();tree={x:r.left,y:r.top+scrollY,w:r.width,h:r.height};buildTree();}
  geometryDirty=false;
}
function updateLedges(){
  field.setLedges(surfaces.filter(s=>s.element.getAttribute('aria-disabled')!=='true').map(({element,id})=>{const r=element.getBoundingClientRect();return{id,x:r.left,y:r.top+scrollY+Math.min(9,r.height*.15),width:r.width};}).filter(s=>s.width>2));
}
function buildTree(){
  branches=[];buds=[];const random=seededRandom(823),w=tree.w,h=tree.h;
  function grow(x,y,len,angle,width,depth,start){
    const ex=x+Math.cos(angle)*len,ey=y+Math.sin(angle)*len;
    branches.push({x,y,ex,ey,cx:(x+ex)/2+(random()-.5)*14,cy:(y+ey)/2+(random()-.5)*12,width,start,duration:.25+len/1700});
    if(depth===0){for(let i=0;i<4;i++)buds.push({x:ex+(random()-.5)*28,y:ey+(random()-.5)*22,r:3.7+random()*4,angle:random()*6.28,color:Math.floor(random()*4),delay:start+.3+random()*.45});return;}
    grow(ex,ey,len*(.66+random()*.07),angle-.38-random()*.35,width*.64,depth-1,start+.22);
    grow(ex,ey,len*(.62+random()*.12),angle+.30+random()*.4,width*.63,depth-1,start+.24);
  }
  grow(w*.81,h*.94,h*.29,-1.75,3.2,4,.05);
  grow(w*.77,h*.66,w*.30,-2.66,2.1,3,.4);
  if(W>760){
    const b={x:w*.75,y:h*.44,ex:-w*.85,ey:h*.19,cx:w*.05,cy:h*.07,width:1.3,start:.35,duration:.75};
    branches.push(b);
    for(const t of [.58,.75,.9,1]){
      const x=(1-t)**2*b.x+2*(1-t)*t*b.cx+t*t*b.ex;
      const y=(1-t)**2*b.y+2*(1-t)*t*b.cy+t*t*b.ey;
      grow(x,y,15+t*7,t===1?-2:-1.5,.7,1,.8+t*.3);
    }
  }
}
function leafShape(x,y,r,a,color,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r*.7,-r*.8,0,-r*.55);ctx.lineTo(r*.45,-r*.9);ctx.lineTo(r*.55,-r*.25);ctx.lineTo(r,0);ctx.quadraticCurveTo(r*.2,r, -r,0);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#695b3f';ctx.lineWidth=.45;ctx.stroke();ctx.beginPath();ctx.moveTo(-r*1.3,.3);ctx.lineTo(r*.68,0);ctx.moveTo(-r*.3,0);ctx.lineTo(r*.1,-r*.35);ctx.stroke();ctx.restore();
}
function drawTree(elapsed){
  if(!tree||tree.y+tree.h<scrollY-100)return;
  const drawTime=intro?elapsed:10;
  ctx.save();ctx.beginPath();ctx.rect(bookRect.left,bookRect.top+68,bookRect.right-bookRect.left,bookRect.height);ctx.clip();ctx.translate(tree.x,tree.y);if(W<=760)ctx.globalAlpha=.28;
  const sway=windVisual*.025;
  function moved(x,y){return[x+sway*(1-y/tree.h)**2,y];}
  for(const b of branches){
    const t=clamp((drawTime-b.start)/b.duration,0,1);if(t===0)continue;
    // Subdivision draws the growing tip along the actual quadratic, not a clip of a movie.
    const p0=moved(b.x,b.y),p1=moved(b.cx,b.cy),p2=moved(b.ex,b.ey);
    const q=[p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t];
    const e=[(1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]];
    ctx.beginPath();ctx.moveTo(...p0);ctx.quadraticCurveTo(...q,...e);ctx.strokeStyle='#23261f';ctx.lineWidth=b.width*1.25;ctx.lineCap='round';ctx.stroke();
    ctx.beginPath();ctx.moveTo(p0[0]+2,p0[1]+.8);ctx.quadraticCurveTo(q[0]+1.8,q[1],e[0]+1,e[1]);ctx.strokeStyle='#7a76564d';ctx.lineWidth=.65;ctx.stroke();
    if(t<1){ctx.beginPath();ctx.arc(e[0],e[1],1.4,0,Math.PI*2);ctx.fillStyle='#535e48';ctx.fill();}
  }
  buds.forEach((b,i)=>{const t=clamp((drawTime-b.delay)/.65,0,1);if(!t)return;const p=moved(b.x,b.y);leafShape(p[0],p[1],b.r*t,b.angle+Math.sin(field.time*.7+i)*.04,colors[b.color],.55+(i%3)*.13);});
  ctx.restore();
}
function drawMargins(elapsed){
  if(!bookRect)return;const left=bookRect.left+16,right=bookRect.right-15;
  const maxY=Math.min(bookRect.top+bookRect.height-30,scrollY+H*.88),begin=bookRect.top+95;
  const reveal=intro?clamp(elapsed/2.6,0,1):1;
  for(const [x,sign]of[[left,1],[right,-1]]){
    const end=begin+(maxY-begin)*reveal;
    ctx.beginPath();let started=false;
    for(let y=Math.max(begin,scrollY-30);y<end;y+=4){const xx=x+Math.sin(y*.016)*5+Math.sin(y*.035)*2+Math.sin(field.time*.4+y*.02)*Math.min(1.3,Math.abs(windVisual)*.015);if(!started){ctx.moveTo(xx,y);started=true;}else ctx.lineTo(xx,y);}
    ctx.strokeStyle='#3f5a34d9';ctx.lineWidth=1.7;ctx.lineCap='round';ctx.stroke();
    for(let y=begin+30;y<end;y+=66){if(y<scrollY-30||y>scrollY+H+20)continue;const xx=x+Math.sin(y*.016)*5,side=(Math.floor(y/66)%2?1:-1)*sign;ctx.beginPath();ctx.moveTo(xx,y);ctx.quadraticCurveTo(xx+side*16,y-18,xx+side*9,y-24);ctx.quadraticCurveTo(xx+side*1,y-19,xx,y);ctx.fillStyle=Math.floor(y/66)%3?'#5f7d45b3':'#b0612fb3';ctx.fill();ctx.strokeStyle='#33482bd9';ctx.lineWidth=1.1;ctx.stroke();}
  }
}
function drawUnderlines(elapsed){
  const e=document.getElementById('name');if(!e)return;
  const names=e.querySelectorAll('.name-line');
  names.forEach((line,i)=>{const r=line.getBoundingClientRect(),y=r.bottom+scrollY-9;const t=intro?clamp((elapsed-1.2-i*.35)/.65,0,1):1;ctx.beginPath();ctx.moveTo(r.left+4,y);const end=r.left+(r.width-7)*t;ctx.quadraticCurveTo(r.left+r.width*.5,y+4,end,y+1);ctx.strokeStyle='#c5391fd9';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.stroke();if(intro&&t>0&&t<1){ctx.beginPath();ctx.moveTo(end,y);ctx.lineTo(end+16,y-29);ctx.strokeStyle='#626a56';ctx.lineWidth=3;ctx.stroke();}});
}
function render(now){
  if(!ctx)return;const elapsed=(now-introStart)/1000;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(0,-scrollY);
  drawMargins(elapsed);drawTree(elapsed);drawUnderlines(elapsed);
  for(const l of field.leaves){if(l.y<scrollY-25||l.y>scrollY+H+25)continue;const fade=Math.min(1,(30-l.age)/2);leafShape(l.x,l.y,l.r,l.angle,colors[l.color],fade*.86);}
  ctx.restore();
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
function finishIntro(){intro=false;document.body.classList.remove('drawing-on');if(replay)replay.textContent='Replay drawing';geometryDirty=true;}
function startIntro(){
  if(!anchor||paused){finishIntro();render(performance.now());return;}
  introStart=performance.now();intro=true;seedBurst=false;field.leaves=[];spawnAt=0;document.body.classList.remove('drawing-on');void book.offsetWidth;document.body.classList.add('drawing-on');replay.textContent='Skip drawing';geometryDirty=true;last=0;schedule();
}
function frame(now){
  raf=0;scrollY=window.scrollY;
  if(geometryDirty)measure();
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused){
    acc+=dt;let steps=0;while(acc>=1/120&&steps++<8){field.step(1/120);acc-=1/120;}
    windVisual+=(field.wind-windVisual)*Math.min(1,dt*3);
    if(frameCount++%10===0)updateLedges();
    const elapsed=(now-introStart)/1000;
    if(intro&&elapsed>1.5&&!seedBurst){release(14);seedBurst=true;}
    if(intro&&elapsed>3.1)finishIntro();
    if(tree&&tree.y+tree.h>scrollY&&tree.y<scrollY+H&&now-spawnAt>1600&&(!intro||elapsed>1.6)){release();spawnAt=now;}
  }
  render(now);schedule();
}
function schedule(){if(ctx&&!raf&&!document.hidden&&!paused)raf=requestAnimationFrame(frame);}
function setPaused(value){paused=value;motion?.setAttribute('aria-pressed',String(paused));if(motion)motion.textContent=paused?'Resume motion':'Pause motion';motion?.setAttribute('aria-label',paused?'Resume page animation':'Pause page animation');document.dispatchEvent(new CustomEvent('notebook-motion',{detail:{paused}}));if(paused){finishIntro();if(raf)cancelAnimationFrame(raf);raf=0;render(performance.now());}else{last=0;schedule();}}
replay?.addEventListener('click',()=>{if(intro)finishIntro();else{if(paused)setPaused(false);startIntro();}});
motion?.addEventListener('click',()=>setPaused(!paused));
window.addEventListener('scroll',()=>{const now=performance.now(),y=window.scrollY,delta=y-previousScroll,dt=Math.max(16,now-lastScrollAt);field.gust(clamp(delta/dt*10,-30,30));previousScroll=y;lastScrollAt=now;scrollY=y;if(paused)render(now);},{passive:true});
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;const now=performance.now();if(pointer){const dt=Math.max(16,now-pointer.time);const vx=(e.clientX-pointer.x)/dt*1000,vy=(e.clientY-pointer.y)/dt*1000;field.disturb(e.clientX,e.clientY+scrollY,vx,vy);if(Math.abs(vx)>100)field.gust(clamp(vx*.003,-3,3));}pointer={x:e.clientX,y:e.clientY,time:now};},{passive:true});
window.addEventListener('resize',()=>{geometryDirty=true;if(paused){measure();render(performance.now());}});
new ResizeObserver(()=>{geometryDirty=true;}).observe(book);
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();});
reduced.addEventListener('change',e=>{if(e.matches)setPaused(true);});
if(!anchor&&replay)replay.hidden=true;
if(ctx){
  measure();setPaused(paused);
  // Wait for the local handwriting font, but never leave content waiting on it.
  const ready=document.fonts?Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,500))]):Promise.resolve();
  ready.then(()=>{if(hasStarted)return;hasStarted=true;measure();if(anchor&&!paused)startIntro();else render(performance.now());schedule();});
}else {if(replay)replay.hidden=true;if(motion)motion.hidden=true;}
