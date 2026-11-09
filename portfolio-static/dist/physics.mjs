// Dimensionless two-body system: G = 1, total mass = 1, initial separation = 1.
export function createSystem(ratio = 1, speed = 0.894) {
  const m2 = 1 / (1 + ratio), m1 = 1 - m2;
  return [{m:m1,x:-m2,y:0,vx:0,vy:-speed*m2}, {m:m2,x:m1,y:0,vx:0,vy:speed*m1}];
}
function acceleration(b) {
  const dx=b[1].x-b[0].x, dy=b[1].y-b[0].y, r2=dx*dx+dy*dy;
  if (r2 < 1e-12 || !Number.isFinite(r2)) throw new Error('Bodies too close to resolve');
  const factor=1/(r2*Math.sqrt(r2));
  return [{x:dx*factor*b[1].m,y:dy*factor*b[1].m},{x:-dx*factor*b[0].m,y:-dy*factor*b[0].m}];
}
export function step(b, dt) {
  const a=acceleration(b);
  for(let i=0;i<2;i++){b[i].x+=b[i].vx*dt+0.5*a[i].x*dt*dt;b[i].y+=b[i].vy*dt+0.5*a[i].y*dt*dt;}
  const next=acceleration(b);
  for(let i=0;i<2;i++){b[i].vx+=0.5*(a[i].x+next[i].x)*dt;b[i].vy+=0.5*(a[i].y+next[i].y)*dt;}
}
export function energy(b) {
 return b.reduce((sum,p)=>sum+0.5*p.m*(p.vx*p.vx+p.vy*p.vy),0)-b[0].m*b[1].m/Math.hypot(b[1].x-b[0].x,b[1].y-b[0].y);
}
