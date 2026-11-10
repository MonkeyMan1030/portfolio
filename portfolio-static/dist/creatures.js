import {prepareLetters} from './letters.js';
prepareLetters();
import { Habitat, WIDTH, HEIGHT, GROUND, randomGenerator, mouthPosition } from './ecosystem.mjs';
const $ = id => document.getElementById(id);
const canvas = $('creature-canvas'), ctx = canvas.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const world = new Habitat();
const INK = '#1d201b', PAPER = '#f1ead6', RED = '#c0281c', BLUE = '#dfe3d1';
let paused = reduce.matches, inspect = false, visible = true, frameId = 0, last = 0, accumulator = 0, pixelRatio = 1, uiAt = 0;
const sourceLetters = new Map();
const bubble=document.createElement('div');bubble.className='bear-request';bubble.setAttribute('role','status');canvas.before(bubble);
function requestWord(){const html=world.sleepRemaining?'Zzz · '+Math.ceil(world.sleepRemaining)+'s': '<strong>'+[...world.word].map((c,i)=>'<span class="'+(world.filled[i]?'done':'')+'">'+c+'</span>').join(' ')+'</strong><br>to get ready for hibernation';if(bubble.innerHTML!==html)bubble.innerHTML=html;}

const scenery = document.createElement('canvas'); scenery.width = WIDTH; scenery.height = HEIGHT;
const bg = scenery.getContext('2d');
function polygon(c, points, fill) { c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fillStyle = fill; c.fill(); }
function line(c, points, color, width = 1) { c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function buildScenery() {
  const rand = randomGenerator(227);
  bg.clearRect(0,0,WIDTH,HEIGHT);
  // Light graphite studies on paper; the habitat shares the notebook's surface.
  for(let y=26;y<HEIGHT;y+=52)line(bg,[[0,y],[WIDTH,y]],'#a4b09b33',.8);
  function twig(x,y,len,angle,depth){
    const ex=x+Math.cos(angle)*len,ey=y+Math.sin(angle)*len;
    line(bg,[[x,y],[x+Math.cos(angle)*len*.48+4,y+Math.sin(angle)*len*.5],[ex,ey]],'#67755c',depth*.5+.5);
    if(!depth)return;
    twig(ex,ey,len*.65,angle-.6,depth-1);twig(ex,ey,len*.67,angle+.5,depth-1);
  }
  twig(692,501,140,-1.8,3);
  line(bg,[[8,509],[65,505],[125,510],[188,505],[254,508],[312,501],[376,508],[443,504],[534,507],[603,501],[681,506],[752,502]],INK,1.8);
  for(let i=0;i<38;i++){const x=rand()*WIDTH,y=515+rand()*85;line(bg,[[x,y],[x+6+rand()*17,y-3-rand()*5]],'#79836966',.7);}
  for(let i=0;i<21;i++){const x=rand()*WIDTH;line(bg,[[x,508],[x-5,489-rand()*13],[x+3,502]],'#69755a',.9);}
}
function blob(c, pts, fill) {
  // Closed shape with rounded corners: each point is a control point between edge midpoints, like a gouge cut.
  const n = pts.length, mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  c.beginPath(); c.moveTo(...mid(0));
  for (let i = 1; i <= n; i++) c.quadraticCurveTo(pts[i % n][0], pts[i % n][1], ...mid(i));
  c.closePath(); c.fillStyle = fill; c.fill();
}
const DARK = '#141112', PLUM = '#33272d', FAR = '#2a2026';
function drawBear(c,b) {
  // Drawn after Mattias's bear print: round ears, a head turned to face you, a red blaze down the muzzle,
  // and a red pass that sits a little off-register under the black.
  const flipping=b.state==='flip', jump=flipping?Math.sin(b.flip*Math.PI)*116:0;
  const eating=b.state==='eat', bob=0;
  c.save();c.translate(b.x,GROUND-jump);c.scale(b.scale,b.scale);
  if(flipping){c.translate(0,-70);c.rotate(b.flip*Math.PI*2*b.facing);c.translate(0,70);}
  c.scale(b.facing,1);c.translate(0,-bob);
  // Far-side legs.
  for(const [x,phase] of [[-56,0],[44,Math.PI]]) {
    const move=b.state==='seek'?Math.sin(b.gait+phase)*12:0;
    blob(c,[[x-18,-64],[x+17,-62],[x+15+move,-8],[x+25+move,1],[x-17+move,1]],FAR);
  }
  const torso=[[-102,-66],[-100,-112],[-76,-142],[-36,-152],[8,-148],[44,-132],[64,-100],[60,-56],[20,-38],[-48,-40],[-90,-48]];
  c.save();c.translate(-4,-3);blob(c,torso,RED);c.restore();blob(c,torso,DARK);
  blob(c,[[-92,-96],[-78,-130],[-44,-142],[-20,-138],[-46,-120],[-70,-100],[-84,-74]],PLUM);
  // Near-side legs swing from the shoulder and hip.
  for(const [x,phase] of [[-66,Math.PI],[38,0]]) {
    const move=b.state==='seek'?Math.sin(b.gait+phase)*12:0;
    blob(c,[[x-17,-68],[x+20,-70],[x+17+move,-10],[x+29+move,-2],[x+29+move,3],[x-16+move,3]],DARK);
    line(c,[[x-5+move,-5],[x-3+move,1]],PAPER,.9);line(c,[[x+5+move,-5],[x+7+move,1]],PAPER,.9);
  }
  // Red showing through the black where the block was cut.
  line(c,[[-60,-128],[-50,-118],[-44,-116]],RED,1.4);line(c,[[-88,-92],[-80,-84],[-78,-74]],RED,1.2);line(c,[[-20,-60],[-8,-54]],RED,1.2);
  // Head, turned to the viewer.
  c.save();const mouth=mouthPosition({x:0,facing:1,scale:1});c.translate(mouth.x-1,mouth.y-GROUND-23);c.rotate(0);
  for(const [ex,ey] of [[-33,-37],[31,-39]]) {
    c.beginPath();c.arc(ex-3,ey-3,18,0,Math.PI*2);c.fillStyle=RED;c.fill();
    c.beginPath();c.arc(ex,ey,18,0,Math.PI*2);c.fillStyle=PLUM;c.fill();
    c.beginPath();c.arc(ex+1,ey+2,10,0,Math.PI*2);c.fillStyle=DARK;c.fill();
  }
  const head=[[-48,-6],[-42,-38],[-14,-52],[14,-52],[42,-38],[48,-4],[40,28],[14,44],[-14,44],[-40,28]];
  c.save();c.translate(-3,-3);blob(c,head,RED);c.restore();blob(c,head,PLUM);
  blob(c,[[-34,-20],[-20,-25],[-11,-14],[-17,-2],[-31,-5]],DARK);blob(c,[[34,-20],[20,-25],[11,-14],[17,-2],[31,-5]],DARK);
  blob(c,[[-5,-36],[7,-32],[11,-10],[28,6],[30,28],[14,42],[-14,42],[-30,28],[-26,6],[-11,-10]],RED);
  blob(c,[[-7,-45],[3,-47],[5,-40],[-3,-38]],RED);line(c,[[-3,-44],[1,-41]],PAPER,1);
  const open=eating?13+Math.abs(Math.sin(world.time*16))*7:12;
  c.beginPath();c.ellipse(1,23,16,open,0,0,Math.PI*2);c.fillStyle=DARK;c.fill();
  line(c,[[-24,30],[-17,38]],PAPER,1.4);line(c,[[19,9],[25,3]],PAPER,1.1);line(c,[[-9,-4],[-4,6]],PAPER,.8);
  if(b.state==='sleep'){c.fillStyle=PLUM;c.fillRect(-36,-28,72,30);line(c,[[-32,-9],[-18,-6]],PAPER,2);line(c,[[18,-6],[32,-9]],PAPER,2);c.font='24px Architext';c.fillStyle=PAPER;c.fillText('Zzz',-20,-70);}
  if(b.state==='wrong'){c.font='30px Architext';c.fillStyle=PAPER;c.fillText('?',-5,-65);}
  c.restore();
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
  for(const l of world.letters) {ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.font='bold 43px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=PAPER;ctx.fillText(l.char,1,1);ctx.fillStyle=INK;ctx.fillText(l.char,0,0);if(inspect){ctx.beginPath();ctx.arc(0,0,l.r,0,Math.PI*2);ctx.strokeStyle=RED;ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();}
}
function resize() {pixelRatio=Math.min(2,Math.max(1,canvas.clientWidth/WIDTH*(devicePixelRatio||1)));canvas.width=Math.round(WIDTH*pixelRatio);canvas.height=Math.round(HEIGHT*pixelRatio);draw();}
function announce(message){$('creature-status').textContent=message;}
function restore(id) {const button=sourceLetters.get(id);if(button){button.removeAttribute('aria-disabled');delete button.dataset.pending;delete button.dataset.eaten;sourceLetters.delete(id);}}
function sync() {
  requestWord();
  $('creature-pause').textContent=paused?'▶':'Ⅱ';$('creature-pause').setAttribute('aria-pressed',String(paused));$('creature-pause').setAttribute('aria-label',paused?'Play creature animation':'Pause creature animation');
  $('behavior').textContent=world.bears.map(b=>b.state).join(' / ');$('eaten').textContent=world.eaten;$('population').textContent=`${world.bears.length} / 4`;
}
function processEvents(){for(const e of world.drainEvents()){
 if(e.type==='eat'){const source=sourceLetters.get(e.letter);if(source){delete source.dataset.pending;source.dataset.eaten='';}announce(e.correct?'Correct letter.':'That letter is not needed.');document.dispatchEvent(new Event('letter-layout'));}
 else if(e.type==='birth')announce('A cub! Bear '+e.parent+' has eaten three letters.');
 else if(e.type==='wake'){for(const id of [...sourceLetters.keys()])restore(id);announce('Awake. The letters have regrown.');document.dispatchEvent(new Event('letter-layout'));}
 else if(e.type==='sleep')announce('Hibernating for 20 seconds.');else restore(e.letter);
 }requestWord();}
function frame(now) {
  frameId=0;const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused&&visible&&!document.hidden){accumulator+=elapsed;let count=0;while(accumulator>=1/120&&count++<8){world.step(1/120);accumulator-=1/120;}processEvents();draw();if(now-uiAt>180){sync();uiAt=now;}}
  schedule();
}
function schedule() {if(!frameId&&!paused&&visible&&!document.hidden)frameId=requestAnimationFrame(frame);else if(paused||!visible||document.hidden)last=0;}
function spawn(char,x,y,vx=0,vy=0,button=null){
  if(!ctx)return;
  const l=world.spawnLetter(char,x,y,vx,vy);
  if(!l){announce(world.sleepRemaining?'The bear is hibernating.':'The habitat is full of letters. Let them eat a few first.');return;}
  if(button){button.setAttribute('aria-disabled','true');button.dataset.pending='';sourceLetters.set(l.id,button);}
  announce(paused?'Letter added. Press Play to let the bear find it.':'Letter released.');draw();schedule();
}
let feedIndex=0;
$('feed').addEventListener('click',()=>{const char=[...world.word].find((c,i)=>!world.filled[i])||world.word[0];spawn(char,310+world.random()*190,70,world.random()*60-30);});
$('creature-pause').addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('motion-request',{detail:{paused:!paused}}));});
$('inspect').addEventListener('click',()=>{inspect=!inspect;$('mechanics').hidden=!inspect;$('inspect').setAttribute('aria-pressed',String(inspect));sync();draw();});
$('restart').addEventListener('click',()=>{for(const id of sourceLetters.keys())restore(id);world.reset();accumulator=0;sync();draw();announce('Simulation reset. One bear.');schedule();});
// Pointer capture keeps a dragged heading letter attached outside the text bounds.
let drag=null, suppressClickUntil=0,dragWasMoved=false;
for(const button of document.querySelectorAll('.food-letter')) {
  button.addEventListener('pointerdown',e=>{
    if(button.getAttribute('aria-disabled')==='true'||e.button!==0||drag)return;
    button.setPointerCapture(e.pointerId);
    const ghost=document.createElement('span');ghost.className='drag-letter';ghost.textContent=button.textContent;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);
    drag={button,ghost,id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),vx:0,vy:0,moved:false};
  });
  button.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const now=performance.now(),dt=Math.max(.016,(now-drag.time)/1000),r=canvas.getBoundingClientRect();
    if(e.clientY>innerHeight-65)window.scrollBy(0,22);else if(e.clientY<65)window.scrollBy(0,-22);
    drag.vx=(e.clientX-drag.lastX)/dt*WIDTH/r.width;drag.vy=(e.clientY-drag.lastY)/dt*HEIGHT/r.height;
    drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=now;
    drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;
    drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  });
  button.addEventListener('pointerup',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const d=drag;dragWasMoved=d.moved;drag=null;d.ghost.remove();suppressClickUntil=performance.now()+400;
    const r=canvas.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    if(inside)spawn(button.textContent,(e.clientX-r.left)/r.width*WIDTH,(e.clientY-r.top)/r.height*HEIGHT,d.vx,d.vy,button);
    else if(!d.moved&&button.classList.contains('edible')){spawn(button.textContent,320+world.random()*180,70,0,0,button);canvas.scrollIntoView({block:'center',behavior:reduce.matches?'instant':'smooth'});}
    else announce('Drop the letter into the bear drawing.');
  });
  const cancel=()=>{if(drag?.button===button){drag.ghost.remove();drag=null;}};
  button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
  button.addEventListener('click',e=>{if(performance.now()<suppressClickUntil||button.getAttribute('aria-disabled')==='true'){if(button.closest('a')&&dragWasMoved)e.preventDefault();return;}if(e.detail===0&&button.classList.contains('edible'))spawn(button.textContent,320+world.random()*180,70,0,0,button);});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){drag.ghost.remove();drag=null;}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;schedule();}).observe(canvas);
document.addEventListener('visibilitychange',()=>{last=0;schedule();});
reduce.addEventListener('change',e=>{if(e.matches){paused=true;sync();}});
document.addEventListener('notebook-motion', e=>{paused=e.detail.paused;sync();schedule();});
new ResizeObserver(resize).observe(canvas);
if(ctx&&bg){buildScenery();resize();sync();schedule();if(paused)announce('Motion is paused. Add a letter, then press Play when ready.');}
else {announce('Canvas is unavailable. Project pages and source links still work.');$('feed').disabled=true;}
