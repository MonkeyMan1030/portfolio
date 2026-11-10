import assert from 'node:assert/strict';
import {Habitat,mouthPosition} from '../portfolio-static/dist/ecosystem.mjs';
const h=new Habitat();const events=[];
function advance(seconds){for(let i=0;i<Math.ceil(seconds*120);i++){h.step(1/120);events.push(...h.drainEvents());}}
h.spawnLetter('X',405,485);advance(4);assert.equal(h.filled.filter(Boolean).length,0);assert(events.some(e=>e.type==='eat'&&!e.correct));
for(const char of h.word){h.spawnLetter(char,405,70);advance(4);}
assert(h.sleepRemaining>0);assert(h.bears.every(b=>b.state==='sleep'));assert(h.bears.length>=2);assert(events.filter(e=>e.type==='birth').every(e=>e.parent));
const left=h.sleepRemaining;advance(left-.1);assert(h.sleepRemaining>0);advance(.2);assert.equal(h.sleepRemaining,0);assert.equal(h.word,'BERRY');assert(events.some(e=>e.type==='wake'));
assert.deepEqual(mouthPosition({x:100,facing:1,scale:1}),{x:143,y:425});
console.log('PASS: wrong letters, word completion, sleep duration, wake/new word, per-parent cub events');
