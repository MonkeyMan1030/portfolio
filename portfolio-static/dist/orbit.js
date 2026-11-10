import {createSystem,step,energy} from './physics.mjs';
const $=id=>document.getElementById(id);

// Keep initial physical scales and restored browser form values consistent.
$('preset').value='binary';$('ratio').value='0';$('velocity').value='0.894';$('rate').value='1';$('vectors').checked=false;
const canvas=$('orbit-canvas'),ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,visible=true,bodies,initialEnergy,trails=[[],[]],prediction=[[],[]];
let accumulator=0,last=0,steps=0,physicalMass=1.2e25,physicalDistance=3.84e8;
let fitRadius=1; let raf=0;
let yaw=-0.35,pitch=0.65,zoom=1,width=0,height=0,drag=null,renderedAt=0;
const colors=['#7db6ff','#ffb888'];
function syncPause(){ $('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));$('sim-status').textContent=paused?'Paused':'Running'; }
function reset(){
 const ratio=10**Number($('ratio').value), speed=Number($('velocity').value);
 fitRadius=Math.max(1, speed>1 ? speed*speed/(2-speed*speed) : 1); zoom=1; bodies=createSystem(ratio,speed);initialEnergy=energy(bodies);trails=[[],[]];steps=0;accumulator=0;
 $('ratio-out').textContent=`${ratio.toFixed(ratio<2?1:0).replace('.0','')} : 1`;
 $('velocity-out').textContent=`${speed.toFixed(3)}× circular`;
 // Faint guide is computed from the same differential equations on each reset.
 const guide=bodies.map(b=>({...b}));prediction=[[],[]];
 for(let k=0;k<3600;k++){step(guide,.002);if(k%6===0)guide.forEach((b,i)=>prediction[i].push({x:b.x,y:b.y}));}
 bodies.forEach((b,i)=>trails[i].push({x:b.x,y:b.y}));
 syncPause();readouts();draw();
}
function project(x,y,z=0){const xx=x*Math.cos(yaw)-y*Math.sin(yaw),yy=x*Math.sin(yaw)+y*Math.cos(yaw);const scale=Math.min((width-70)/(2*fitRadius),(height-100)/(2*fitRadius))*zoom;return {x:width/2+xx*scale,y:height*.55+(yy*Math.cos(pitch)-z*Math.sin(pitch))*scale};}
function line(a,b,color,thickness=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();}
function path(points,color,alpha=1){if(points.length<2)return;ctx.beginPath();points.forEach((p,i)=>{const q=project(p.x,p.y);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;}
function arrow(a,b,color){line(a,b,color,1.2);const angle=Math.atan2(b.y-a.y,b.x-a.x);for(const d of [-.45,.45])line(b,{x:b.x-7*Math.cos(angle+d),y:b.y-7*Math.sin(angle+d)},color,1.2);}
function draw(){
 if(!ctx||!width||!bodies)return;
 ctx.clearRect(0,0,width,height);
 const bg=ctx.createRadialGradient(width*.5,height*.52,0,width*.5,height*.52,width*.65);bg.addColorStop(0,'#192b43');bg.addColorStop(1,'#0d1725');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 // A projected coordinate plane makes orbital orientation visible.
 for(let n=-8;n<=8;n++){const u=n*.25;line(project(u,-2),project(u,2),'#8baddf12');line(project(-2,u),project(2,u),'#8baddf12');}
 for(let n=0;n<60;n++){const x=(Math.sin(n*153.1)*4321)%1,y=(Math.cos(n*84.3)*1231)%1;ctx.fillStyle='#aec4e338';ctx.fillRect(Math.abs(x)*width,Math.abs(y)*height,1,1);}
 ctx.setLineDash([3,6]);prediction.forEach((p,i)=>path(p,colors[i],.14));ctx.setLineDash([]);
 trails.forEach((points,i)=>{const chunks=8;for(let k=0;k<chunks;k++){const start=Math.floor(k*points.length/chunks),end=Math.floor((k+1)*points.length/chunks)+1;path(points.slice(start,end),colors[i],.1+.9*(k+1)/chunks);}});
 const center=project(0,0);line({x:center.x-5,y:center.y},{x:center.x+5,y:center.y},'#d1dded88');line({x:center.x,y:center.y-5},{x:center.x,y:center.y+5},'#d1dded88');
 line(project(bodies[0].x,bodies[0].y),project(bodies[1].x,bodies[1].y),'#abc9ed25');
 bodies.map((b,i)=>({b,i,p:project(b.x,b.y)})).sort((a,b)=>a.p.y-b.p.y).forEach(({b,i,p})=>{
  const radius=5+8*Math.cbrt(b.m),glow=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,radius*4);glow.addColorStop(0,colors[i]+'50');glow.addColorStop(1,colors[i]+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,radius*4,0,Math.PI*2);ctx.fill();
  const sphere=ctx.createRadialGradient(p.x-radius*.3,p.y-radius*.35,0,p.x,p.y,radius);sphere.addColorStop(0,'#ffffff');sphere.addColorStop(.3,colors[i]);sphere.addColorStop(1,i===0?'#245491':'#a0502b');ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
  ctx.font='10px monospace';ctx.fillStyle=colors[i];ctx.fillText(`m${i+1}`,p.x+radius+8,p.y-8);
  if($('vectors').checked)arrow(p,project(b.x+b.vx*.32,b.y+b.vy*.32),colors[i]);
 });
}
function readouts(){const distance=Math.hypot(bodies[1].x-bodies[0].x,bodies[1].y-bodies[0].y)*physicalDistance;const force=6.674e-11*bodies[0].m*bodies[1].m*physicalMass**2/distance**2;$('separation').textContent=`${distance.toExponential(2)} m`;$('force').textContent=`${force.toExponential(2)} N`;$('energy').textContent=`${(Math.abs((energy(bodies)-initialEnergy)/initialEnergy)*100).toFixed(4)}%`;}
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);draw();}
function schedule(){if(!raf&&!paused&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
function frame(now){raf=0;const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
 if(visible&&!document.hidden){if(!paused){accumulator+=elapsed*Number($('rate').value)*.9;let count=0;try{while(accumulator>=.002&&count<100){step(bodies,.002);accumulator-=.002;steps++;count++;if(steps%3===0)bodies.forEach((b,i)=>{trails[i].push({x:b.x,y:b.y});if(trails[i].length>1600)trails[i].shift();});}}catch{paused=true;syncPause();$('sim-status').textContent='Numerical limit reached — reset to continue';}}
 draw();if(now-renderedAt>180){readouts();renderedAt=now;}}
 schedule();
}
$('pause').addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('motion-request',{detail:{paused:!paused}}));});
document.addEventListener('notebook-motion',e=>{paused=e.detail.paused;syncPause();last=0;if(paused&&raf){cancelAnimationFrame(raf);raf=0;}draw();schedule();});
$('reset').addEventListener('click',()=>{reset();});
for(const id of ['ratio','velocity'])$(id).addEventListener('input',()=>{reset();});
$('rate').addEventListener('input',()=>{$('rate-out').textContent=`${$('rate').value}×`;});
$('preset').addEventListener('change',()=>{const p=$('preset').value;physicalDistance=3.84e8;physicalMass=p==='earth'?5.97e24+7.35e22:1.2e25;$('ratio').value=p==='earth'?Math.log10(5.97e24/7.35e22):0;$('velocity').value=p==='ellipse'?.7:p==='earth'?1:.894;reset();});
$('view').addEventListener('click',()=>{pitch=pitch===0?.65:0;$('view').textContent=pitch===0?'Tilt view':'Top view';draw();});
$('vectors').addEventListener('change',draw);
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(0,Math.min(1.35,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};$('view').textContent=pitch===0?'Tilt view':'Top view';draw();});
canvas.addEventListener('pointerup',()=>{drag=null});canvas.addEventListener('pointercancel',()=>{drag=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw();},{passive:false});
reduced.addEventListener('change',e=>{if(e.matches){paused=true;syncPause();}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}schedule();},{threshold:0}).observe(canvas);
new ResizeObserver(resize).observe(canvas);
if(ctx){reset();resize();schedule();}else{$('sim-status').textContent='Canvas unavailable. Download the Python project instead.';}

document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();});
for(const [id,factor] of [['zoom-in',1.2],['zoom-out',1/1.2],['reset-view',0]])document.getElementById(id).onclick=()=>{zoom=factor?Math.max(.2,Math.min(3,zoom*factor)):1;if(!factor){yaw=-.35;pitch=.65;}draw();};
