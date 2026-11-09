import assert from 'node:assert/strict';
import {Habitat,WIDTH,GROUND,MAX_BEARS,MAX_LETTERS} from '../portfolio-static/dist/ecosystem.mjs';
function run(w,seconds) {const events=[];for(let i=0;i<seconds*120;i++){w.step(1/120);events.push(...w.drainEvents());for(const l of w.letters)assert.ok([l.x,l.y,l.vx,l.vy].every(Number.isFinite));}return events;}
// Every reachable drop position must be consumed, not expire in a targeting deadlock.
for(const x of [20,100,300,405,450,600,740]) {
 const w=new Habitat();w.spawnLetter('M',x,50);const e=run(w,18);
 assert.ok(e.some(e=>e.type==='eat'),`Unreachable letter at ${x}`);
}
// Repeated meals yield cubs, while population and input remain bounded.
const w=new Habitat();for(let j=0;j<30;j++){w.spawnLetter('A',100+(j*97)%560,50);run(w,4);}
assert.equal(w.bears.length,MAX_BEARS);assert.ok(w.eaten>=12);
for(let i=0;i<100;i++)w.spawnLetter('B',300,40);
assert.equal(w.letters.length,MAX_LETTERS);
run(w,50);assert.equal(w.letters.length,0);
// Identical seeds and inputs produce identical states at any frame partition.
const a=new Habitat(10),b=new Habitat(10);a.spawnLetter('X',400,30);b.spawnLetter('X',400,30);run(a,3);run(b,1);run(b,2);assert.equal(JSON.stringify(a),JSON.stringify(b));
assert.throws(()=>a.step(1));
console.log('PASS: reachable drops, cub lifecycle, caps, finite contacts, expiration, deterministic fixed steps');
