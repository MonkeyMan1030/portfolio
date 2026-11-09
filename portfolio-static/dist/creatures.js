import { Habitat, WIDTH, HEIGHT, GROUND, randomGenerator } from './ecosystem.mjs';
const $ = id => document.getElementById(id);
const canvas = $('creature-canvas'), ctx = canvas.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const world = new Habitat();
const INK = '#171c1c', PAPER = '#eee8d8', RED = '#e3402c', BLUE = '#1466bf';
let paused = reduce.matches, inspect = false, visible = true, frameId = 0, last = 0, accumulator = 0, pixelRatio = 1, uiAt = 0;
const sourceLetters = new Map();
const scenery = document.createElement('canvas'); scenery.width = WIDTH; scenery.height = HEIGHT;
const bg = scenery.getContext('2d');
function polygon(c, points, fill) { c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fillStyle = fill; c.fill(); }
function line(c, points, color, width = 1) { c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function buildScenery() {
  const rand = randomGenerator(227);
  bg.fillStyle = BLUE; bg.fillRect(0,0,WIDTH,HEIGHT);
  const sun = Array.from({length:37},(_,i) => { const a=i/37*Math.PI*2,r=89+rand()*10;return [185+Math.cos(a)*r,163+Math.sin(a)*r]; });
  polygon(bg,sun,RED);
  // An angular, branching tree. Its asymmetry stays deterministic across frames.
  function branch(x,y,length,angle,width,depth) {
    const ex=x+Math.cos(angle)*length,ey=y+Math.sin(angle)*length;
    polygon(bg,[[x-width,y+2],[ex-width*.3,ey],[ex+width*.3,ey-2],[x+width,y-2]],INK);
    if (depth <= 0) return;
    branch(ex,ey,length*.71,angle-.35-rand()*.26,width*.57,depth-1);
    branch(ex,ey,length*.58,angle+.45+rand()*.3,width*.5,depth-1);
  }
  branch(715,511,170,-1.75,23,4); branch(740,490,125,-2.6,15,3);
  polygon(bg,[[0,506],[47,502],[105,509],[163,503],[244,506],[312,501],[376,508],[440,504],[530,508],[603,501],[681,506],[760,499],[760,620],[0,620]],INK);
  // Sparse cut marks give the earth an engraved surface.
  for(let i=0;i<78;i++) { const x=rand()*WIDTH,y=526+rand()*90;line(bg,[[x,y],[x+5+rand()*19,y-3-rand()*7]],i%4?PAPER:RED,.6+rand()); }
  for(let i=0;i<25;i++) {const x=rand()*WIDTH;line(bg,[[x,507],[x-5,489-rand()*18],[x+3,500]],INK,1.6);}
  for(let i=0;i<2500;i++) {bg.globalAlpha=.04+rand()*.16;bg.fillStyle=i%3?PAPER:INK;bg.fillRect(rand()*WIDTH,rand()*HEIGHT,.4+rand()*2.4,.4+rand()*1.5);}
  bg.globalAlpha=1;
  // Registration cross and caption belong to the printed scene.
  line(bg,[[28,39],[52,39]],PAPER,1);line(bg,[[40,27],[40,51]],PAPER,1);
}
function drawBear(c,b) {
  const flipping=b.state==='flip', jump=flipping?Math.sin(b.flip*Math.PI)*116:0;
  const eating=b.state==='eat', bob=b.state==='seek'?Math.abs(Math.sin(b.gait))*3:Math.sin(world.time*1.6+b.id)*1.2;
  c.save();c.translate(b.x,GROUND-jump);c.scale(b.scale,b.scale);
  if(flipping){c.translate(0,-70);c.rotate(b.flip*Math.PI*2*b.facing);c.translate(0,70);}
  c.scale(b.facing,1);c.translate(0,-bob);
  // Back feet and the offset red printing pass.
  for(const [x,phase] of [[-58,0],[48,Math.PI]]) {
    const move=b.state==='seek'?Math.sin(b.gait+phase)*12:0;
    polygon(c,[[x-19,-60],[x+15,-56],[x+12+move,-6],[x+27+move,0],[x-15+move,0]],'#2a2d27');
  }
  c.save();c.translate(4,2);
  const torso=[[-99,-73],[-94,-111],[-72,-137],[-38,-152],[2,-151],[30,-140],[56,-126],[72,-94],[61,-52],[18,-38],[-50,-43],[-84,-55]];
  polygon(c,torso,RED);c.restore();polygon(c,torso,INK);
  // Forelegs are pivoted from the shoulder so movement stays attached.
  for(const [x,phase] of [[-67,Math.PI],[40,0]]) {
    const move=b.state==='seek'?Math.sin(b.gait+phase)*12:0;
    polygon(c,[[x-15,-65],[x+20,-67],[x+16+move,-10],[x+28+move,-3],[x+29+move,3],[x-14+move,2]],INK);
    line(c,[[x-5+move,-6],[x-3+move,0]],PAPER,.8);line(c,[[x+4+move,-6],[x+6+move,0]],PAPER,.8);
  }
  c.save();c.translate(40,-106);c.rotate(eating?Math.sin(world.time*22)*.07:Math.sin(world.time*.8+b.id)*.025);
  polygon(c,[[-16,-30],[-24,-47],[-16,-63],[-3,-64],[10,-50],[31,-43],[42,-29],[50,-5],[80,9],[82,23],[63,40],[30,41],[10,23],[-11,17],[-23,-3]],RED);
  polygon(c,[[-19,-28],[-29,-48],[-21,-64],[-7,-68],[8,-51],[32,-46],[46,-29],[53,-6],[78,5],[88,16],[77,32],[56,40],[25,33],[7,18],[-17,13],[-26,-4]],INK);
  // Angular cheek, ear cutout, white eye, and red muzzle.
  polygon(c,[[-16,-51],[-16,-59],[-7,-57],[-1,-47]],RED);
  polygon(c,[[28,-26],[35,-12],[34,9],[48,27],[66,30],[77,22],[71,12],[47,5]],RED);
  polygon(c,[[30,-25],[42,-22],[33,-18]],PAPER);
  polygon(c,[[76,6],[88,14],[81,20],[72,15]],INK);
  line(c,[[53,25],[66,24],[73,20]],PAPER,1.3);
  if(eating){c.fillStyle=PAPER;c.font='bold 16px Georgia';c.fillText('·',87,29);}
  c.restore();
  // Hand-cut fur marks: intentionally angular, never a raster sprite.
  const cuts=[[[-70,-119],[-62,-128],[-65,-111]],[[-43,-139],[-35,-130],[-31,-141]],[[-81,-84],[-71,-76],[-76,-94]],[[-24,-59],[-10,-53],[-17,-68]],[[8,-127],[16,-113],[22,-121]],[[1,-70],[9,-57],[16,-67]]];
  cuts.forEach((p,i)=>polygon(c,p,i%3? '#34372c':RED));
  line(c,[[-52,-136],[-44,-124],[-38,-119]],PAPER,.7);
  line(c,[[-83,-106],[-73,-101],[-67,-90]],PAPER,.7);
  c.restore();
  if(inspect) {
    c.save();c.strokeStyle=PAPER;c.lineWidth=1;c.setLineDash([5,5]);c.strokeRect(b.x-100*b.scale,GROUND-172*b.scale,235*b.scale,172*b.scale);c.setLineDash([]);
    c.font='12px monospace';c.fillStyle=PAPER;c.fillText(`#${b.id} ${b.state}`,b.x-85*b.scale,GROUND-185*b.scale-jump);
    const t=world.letters.find(l=>l.id===b.target);if(t) {line(c,[[b.x,GROUND-70*b.scale],[t.x,t.y]],PAPER,1);c.beginPath();c.arc(t.x,t.y,t.r+6,0,Math.PI*2);c.stroke();}
    c.restore();
  }
}
function draw() {
  if(!ctx)return;
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.drawImage(scenery,0,0);
  world.bears.slice().sort((a,b)=>a.scale-b.scale).forEach(b=>drawBear(ctx,b));
  for(const l of world.letters) {ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.font='bold 43px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=INK;ctx.fillText(l.char,2,2);ctx.fillStyle=PAPER;ctx.fillText(l.char,0,0);if(inspect){ctx.beginPath();ctx.arc(0,0,l.r,0,Math.PI*2);ctx.strokeStyle=RED;ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();}
}
function resize() {pixelRatio=Math.min(2,Math.max(1,canvas.clientWidth/WIDTH*(devicePixelRatio||1)));canvas.width=Math.round(WIDTH*pixelRatio);canvas.height=Math.round(HEIGHT*pixelRatio);draw();}
function announce(message){$('creature-status').textContent=message;}
function restore(id) {const button=sourceLetters.get(id);if(button){button.removeAttribute('aria-disabled');sourceLetters.delete(id);}}
function sync() {
  $('creature-pause').textContent=paused?'▶':'Ⅱ';$('creature-pause').setAttribute('aria-pressed',String(paused));$('creature-pause').setAttribute('aria-label',paused?'Play creature animation':'Pause creature animation');
  $('behavior').textContent=world.bears.map(b=>b.state).join(' / ');$('eaten').textContent=world.eaten;$('population').textContent=`${world.bears.length} / 4`;
}
function processEvents() {for(const event of world.drainEvents()){if(event.type==='eat'){restore(event.letter);announce(world.eaten%3===0&&world.bears.length<4?'Three letters. Watch for a cub.':`“${event.char}” eaten. A flip, on the house.`);}else if(event.type==='birth')announce('A cub! Now there are '+world.bears.length+' bears.');else restore(event.letter);}}
function frame(now) {
  frameId=0;const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused&&visible&&!document.hidden){accumulator+=elapsed;let count=0;while(accumulator>=1/120&&count++<8){world.step(1/120);accumulator-=1/120;}processEvents();draw();if(now-uiAt>180){sync();uiAt=now;}}
  schedule();
}
function schedule() {if(!frameId&&!paused&&visible&&!document.hidden)frameId=requestAnimationFrame(frame);else if(paused||!visible||document.hidden)last=0;}
function spawn(char,x,y,vx=0,vy=0,button=null){
  if(!ctx)return;
  const l=world.spawnLetter(char,x,y,vx,vy);
  if(!l){announce('The habitat is full of letters. Let them eat a few first.');return;}
  if(button){button.setAttribute('aria-disabled','true');sourceLetters.set(l.id,button);}
  announce(paused?'Letter added. Press Play to let the bear find it.':'Dinner is falling.');draw();schedule();
}
let feedIndex=0;
$('feed').addEventListener('click',()=>{const alphabet='MATTIASREINHARDT',char=alphabet[feedIndex++%alphabet.length];spawn(char,310+world.random()*190,70,world.random()*60-30);});
$('creature-pause').addEventListener('click',()=>{paused=!paused;sync();schedule();});
$('inspect').addEventListener('click',()=>{inspect=!inspect;$('mechanics').hidden=!inspect;$('inspect').setAttribute('aria-pressed',String(inspect));sync();draw();});
$('restart').addEventListener('click',()=>{for(const id of sourceLetters.keys())restore(id);world.reset();accumulator=0;sync();draw();announce('Fresh ink. One hungry bear.');schedule();});
// Pointer capture keeps a dragged heading letter attached outside the text bounds.
let drag=null, suppressClickUntil=0;
for(const button of document.querySelectorAll('.edible')) {
  button.addEventListener('pointerdown',e=>{
    if(button.getAttribute('aria-disabled')==='true'||e.button!==0||drag)return;
    button.setPointerCapture(e.pointerId);
    const ghost=document.createElement('span');ghost.className='drag-letter';ghost.textContent=button.textContent;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);
    drag={button,ghost,id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),vx:0,vy:0,moved:false};
  });
  button.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const now=performance.now(),dt=Math.max(.016,(now-drag.time)/1000),r=canvas.getBoundingClientRect();
    drag.vx=(e.clientX-drag.lastX)/dt*WIDTH/r.width;drag.vy=(e.clientY-drag.lastY)/dt*HEIGHT/r.height;
    drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=now;
    drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;
    drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  });
  button.addEventListener('pointerup',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const d=drag;drag=null;d.ghost.remove();suppressClickUntil=performance.now()+400;
    const r=canvas.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    if(inside)spawn(button.textContent,(e.clientX-r.left)/r.width*WIDTH,(e.clientY-r.top)/r.height*HEIGHT,d.vx,d.vy,button);
    else if(!d.moved)spawn(button.textContent,320+world.random()*180,70,0,0,button);
    else announce('Drop the letter into the blue woodland.');
  });
  const cancel=()=>{if(drag?.button===button){drag.ghost.remove();drag=null;}};
  button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
  button.addEventListener('click',e=>{if(performance.now()<suppressClickUntil||button.getAttribute('aria-disabled')==='true')return;if(e.detail===0)spawn(button.textContent,320+world.random()*180,70,0,0,button);});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){drag.ghost.remove();drag=null;}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;schedule();}).observe(canvas);
document.addEventListener('visibilitychange',()=>{last=0;schedule();});
reduce.addEventListener('change',e=>{if(e.matches){paused=true;sync();}});
new ResizeObserver(resize).observe(canvas);
if(ctx&&bg){buildScenery();resize();sync();schedule();if(paused)announce('Motion is paused. Add a letter, then press Play when ready.');}
else {announce('Canvas is unavailable. Project pages and source links still work.');$('feed').disabled=true;}
