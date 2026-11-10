export const WIDTH=760,HEIGHT=620,GROUND=504,MAX_BEARS=4,MAX_LETTERS=32;
export function randomGenerator(seed=731){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
export const mouthPosition=b=>({x:b.x+b.facing*43*b.scale,y:GROUND-79*b.scale});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),WORDS=['HONEY','BERRY','NUT','APPLE'];
export class Habitat{
 constructor(seed=731){this.random=randomGenerator(seed);this.reset();}
 reset(){this.time=0;this.nextId=1;this.letters=[];this.events=[];this.eaten=0;this.round=0;this.word=WORDS[0];this.filled=Array(this.word.length).fill(false);this.sleepRemaining=0;this.bears=[this.makeBear(405,1.35)];}
 makeBear(x,scale){return{id:this.nextId++,x,scale,facing:1,state:'idle',timer:0,gait:0,target:null,meals:0,totalMeals:0,flip:0};}
 spawnLetter(char,x,y,vx=0,vy=0){if(this.sleepRemaining||this.letters.length>=MAX_LETTERS)return null;const l={id:this.nextId++,char:String(char).slice(0,1),x:clamp(x,20,WIDTH-20),y:clamp(y,20,GROUND-19),vx:clamp(vx,-700,700),vy:clamp(vy,-700,700),r:19,angle:0,age:0,owner:null,lift:false};this.letters.push(l);return l;}
 step(dt){
  if(!(dt>0&&dt<=1/30))throw new RangeError('Use a fixed timestep no larger than 1/30 s');this.time+=dt;
  if(this.sleepRemaining){this.sleepRemaining=Math.max(0,this.sleepRemaining-dt);if(!this.sleepRemaining){this.round++;this.word=WORDS[this.round%WORDS.length];this.filled=Array(this.word.length).fill(false);this.bears.forEach(b=>{b.state='idle';b.target=null;});this.events.push({type:'wake'});}return;}
  for(const l of this.letters){l.age+=dt;if(l.lift)continue;l.vy+=820*dt;l.x=clamp(l.x+l.vx*dt,l.r,WIDTH-l.r);l.y+=l.vy*dt;if(l.y+l.r>=GROUND){l.y=GROUND-l.r;l.vy=Math.abs(l.vy)<30?0:-Math.abs(l.vy)*.3;l.vx*=Math.exp(-5*dt);}}
  for(const b of [...this.bears]){
   b.timer-=dt;
   if(b.state==='eat'||b.state==='wrong'){if(b.timer>0)continue;b.state='flip';b.timer=1.25;}
   if(b.state==='flip'){b.flip=clamp(1-b.timer/1.25,0,1);if(b.timer>0)continue;b.flip=0;b.state='idle';}
   let l=this.letters.find(l=>l.id===b.target);
   if(!l){b.target=null;l=this.letters.filter(l=>l.owner===null).sort((a,c)=>Math.abs(a.x-b.x)-Math.abs(c.x-b.x))[0];if(l){l.owner=b.id;b.target=l.id;}}
   if(!l){b.state='idle';continue;}
   b.state='seek';if(!l.lift&&Math.abs(l.x-b.x)>100*b.scale)b.facing=Math.sign(l.x-b.x);
   const mouth=mouthPosition(b),dx=l.x-mouth.x;
   if(Math.abs(dx)<35*b.scale&&l.y>=mouth.y-25){l.lift=true;b.state='pickup';}
   if(l.lift){const d=Math.hypot(dx,l.y-mouth.y),move=Math.min(1,dt*180/Math.max(d,.001));l.x+=(mouth.x-l.x)*move;l.y+=(mouth.y-l.y)*move;}
   else if(Math.abs(dx)>20){b.x=clamp(b.x+Math.sign(dx)*95*dt,95,WIDTH-95);b.gait+=dt*9;}
   if(Math.hypot(l.x-mouth.x,l.y-mouth.y)>12*b.scale)continue;
   this.letters=this.letters.filter(a=>a!==l);b.target=null;b.timer=.8;this.eaten++;b.meals++;b.totalMeals++;
   const index=[...this.word].findIndex((c,i)=>c===l.char.toUpperCase()&&!this.filled[i]);
   if(index>=0)this.filled[index]=true;b.state=index>=0?'eat':'wrong';
   this.events.push({type:'eat',letter:l.id,char:l.char,bear:b.id,correct:index>=0});
   if(b.meals>=3&&this.bears.length<MAX_BEARS){const cub=this.makeBear(clamp(b.x-b.facing*130,80,WIDTH-80),.6);this.bears.push(cub);b.meals=0;this.events.push({type:'birth',bear:cub.id,parent:b.id});}
   if(this.filled.every(Boolean)){this.sleepRemaining=20;this.bears.forEach(a=>{a.state='sleep';a.target=null;});for(const a of this.letters)this.events.push({type:'expire',letter:a.id});this.letters=[];this.events.push({type:'sleep'});break;}
  }
  for(const l of this.letters.filter(l=>l.age>30))this.events.push({type:'expire',letter:l.id});
  this.letters=this.letters.filter(l=>l.age<=30);
 }
 drainEvents(){return this.events.splice(0);}
}
