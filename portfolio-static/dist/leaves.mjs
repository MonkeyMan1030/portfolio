// Browser-independent leaf dynamics. Coordinates are CSS pixels in the document.
export function seededRandom(seed=83){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export class LeafField {
  constructor(seed=83){this.random=seededRandom(seed);this.leaves=[];this.ledges=new Map();this.wind=0;this.time=0;this.nextId=1;this.width=1000;this.height=1500;this.maxLeaves=64;}
  setLedges(ledges){this.ledges=new Map(ledges.map(l=>[l.id,l]));}
  spawn(x,y,options={}){
    if(!Number.isFinite(x)||!Number.isFinite(y))return null;
    if(this.leaves.length>=this.maxLeaves)this.leaves.shift();
    const r=this.random;
    const leaf={id:this.nextId++,x,y,vx:options.vx??(-25+r()*45),vy:options.vy??(5+r()*15),r:options.r??(4+r()*4),angle:r()*6.28,spin:r()*2-1,phase:r()*6.28,color:Math.floor(r()*4),age:0,rest:0,ledge:null,offset:0,...options};
    this.leaves.push(leaf);return leaf;
  }
  gust(strength){if(Number.isFinite(strength))this.wind=Math.max(-160,Math.min(160,this.wind+strength));}
  disturb(x,y,vx,vy=0){
    for(const l of this.leaves){const d=Math.hypot(l.x-x,l.y-y);if(d<85){const f=1-d/85;l.ledge=null;l.vx+=Math.max(-110,Math.min(110,vx))*.5*f;l.vy-=Math.min(65,Math.abs(vy)*.2+25)*f;l.y-=2;}}
  }
  step(dt){
    if(!Number.isFinite(dt)||dt<=0||dt>.1)throw new RangeError('Leaf timestep must be in (0, 0.1].');
    this.time+=dt;this.wind*=Math.exp(-1.2*dt);
    for(const l of this.leaves){
      l.age+=dt;
      if(l.ledge!==null){
        const ledge=this.ledges.get(l.ledge);
        if(ledge&&Math.abs(this.wind)<48+l.r*2&&l.rest<9){l.x=ledge.x+l.offset;l.y=ledge.y-l.r*.55;l.rest+=dt;continue;}
        l.ledge=null;l.y-=3;l.vx=this.wind*.8-12;l.vy=-16;l.rest=0;
      }
      const previousY=l.y;
      const flow=this.wind+Math.sin(this.time*1.15+l.phase)*15-9;
      l.vx+=(flow-l.vx)*Math.min(1,dt*1.1);l.vy=Math.min(38+l.r*2,l.vy+29*dt);
      l.x+=l.vx*dt;l.y+=l.vy*dt;l.angle+=(l.spin*.7+l.vx*.012)*dt;
      if(l.vy>0){
        let hit=null;
        for(const ledge of this.ledges.values()){
          if(l.x>=ledge.x+1&&l.x<=ledge.x+ledge.width-1&&previousY+l.r*.55<=ledge.y&&l.y+l.r*.55>=ledge.y&&(!hit||ledge.y<hit.y))hit=ledge;
        }
        if(hit&&this.leaves.filter(other=>other.ledge===hit.id).length<2){l.ledge=hit.id;l.offset=l.x-hit.x;l.y=hit.y-l.r*.55;l.vx=0;l.vy=0;l.angle=l.spin*.5;l.rest=0;}
      }
    }
    this.leaves=this.leaves.filter(l=>l.age<30&&l.y<this.height+35&&l.x>-180&&l.x<this.width+180);
  }
}
