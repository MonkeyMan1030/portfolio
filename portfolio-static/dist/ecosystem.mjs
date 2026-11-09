// Pure simulation: no DOM, rendering, timers, or external dependencies.
// Units are illustration pixels and seconds. Advance at a fixed 1/120 second.
export const WIDTH = 760, HEIGHT = 620, GROUND = 504, MAX_BEARS = 4, MAX_LETTERS = 16;
export function randomGenerator(seed = 731) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export class Habitat {
  constructor(seed = 731) { this.random = randomGenerator(seed); this.reset(); }
  reset() {
    this.time = 0; this.nextId = 1; this.letters = []; this.events = []; this.eaten = 0;
    this.bears = [this.makeBear(405, 1.35)];
  }
  makeBear(x, scale) { return { id: this.nextId++, x, scale, facing: 1, state: 'idle', timer: 1, age: 0, gait: 0, target: null, meals: 0, totalMeals: 0, flip: 0, born: this.time }; }
  spawnLetter(char, x, y, vx = 0, vy = 0) {
    if (this.letters.length >= MAX_LETTERS) return null;
    const letter = { id: this.nextId++, char: String(char).slice(0, 1), x: clamp(x, 25, WIDTH - 25), y: clamp(y, 20, GROUND - 23), vx: clamp(vx, -700, 700), vy: clamp(vy, -700, 700), r: 19, angle: this.random() * .5 - .25, omega: this.random() * 5 - 2.5, age: 0, owner: null };
    this.letters.push(letter); return letter;
  }
  step(dt) {
    if (!(dt > 0 && dt <= 1 / 30)) throw new RangeError('Use a positive, fixed timestep no larger than 1/30 s');
    this.time += dt;
    for (const l of this.letters) {
      l.age += dt; l.vy += 820 * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.angle += l.omega * dt;
      if (l.y + l.r > GROUND) { l.y = GROUND - l.r; l.vy = Math.abs(l.vy) < 30 ? 0 : -Math.abs(l.vy) * .34; l.vx *= Math.exp(-5 * dt); l.omega *= Math.exp(-6 * dt); }
      if (l.x < l.r) { l.x = l.r; l.vx = Math.abs(l.vx) * .55; }
      if (l.x > WIDTH - l.r) { l.x = WIDTH - l.r; l.vx = -Math.abs(l.vx) * .55; }
    }
    // Circle contacts: positional correction + a normal impulse for equal masses.
    for (let i = 0; i < this.letters.length; i++) for (let j = i + 1; j < this.letters.length; j++) {
      const a = this.letters[i], b = this.letters[j], dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.hypot(dx, dy), overlap = a.r + b.r - distance;
      if (overlap <= 0) continue;
      const nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0;
      a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
      const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (closing < 0) { const impulse = -.65 * closing; a.vx -= impulse * nx; a.vy -= impulse * ny; b.vx += impulse * nx; b.vy += impulse * ny; }
    }
    for (const l of this.letters) { l.x = clamp(l.x, l.r, WIDTH - l.r); l.y = Math.min(l.y, GROUND - l.r); }
    // Iterate a snapshot: newborns begin updating on the next simulation step.
    for (const b of [...this.bears]) {
      b.age += dt; b.timer -= dt;
      if (b.scale < .9) b.scale = Math.min(.9, b.scale + dt * .002);
      if (b.state === 'eat') {
        if (b.timer <= 0) { b.state = 'flip'; b.timer = 1.25; b.flip = 0; }
        continue;
      }
      if (b.state === 'flip') {
        b.flip = clamp(1 - b.timer / 1.25, 0, 1);
        if (b.timer <= 0) {
          if (b.meals >= 3 && this.bears.length < MAX_BEARS) {
            const cub = this.makeBear(clamp(b.x - b.facing * 115, 85, WIDTH - 85), .6);
            cub.facing = -b.facing; this.bears.push(cub); b.meals = 0;
            this.events.push({ type: 'birth', bear: cub.id });
          }
          b.state = 'idle'; b.timer = 1.5; b.flip = 0;
        }
        continue;
      }
      let target = this.letters.find(l => l.id === b.target);
      if (!target) {
        b.target = null;
        const available = this.letters.filter(l => l.owner === null);
        available.sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x));
        target = available[0];
        if (target) { target.owner = b.id; b.target = target.id; b.state = 'seek'; }
      }
      if (target) {
        b.state = 'seek'; const dx = target.x - b.x;
        if (Math.abs(dx) > 30) b.facing = Math.sign(dx);
        const mouth = b.x + b.facing * 72 * b.scale;
        const distance = Math.abs(target.x - mouth);
        if (target.y > GROUND - 105 * b.scale && (distance < 58 * b.scale || Math.abs(dx) < 65 * b.scale)) {
          this.letters = this.letters.filter(l => l.id !== target.id);
          b.target = null; b.state = 'eat'; b.timer = .65; b.meals++; b.totalMeals++; this.eaten++;
          this.events.push({ type: 'eat', letter: target.id, char: target.char, bear: b.id });
        } else {
          if (Math.abs(dx) > 65 * b.scale) { b.x += Math.sign(dx) * (83 + 20 / b.scale) * dt; b.gait += dt * 9; }
          b.x = clamp(b.x, 70 * b.scale, WIDTH - 70 * b.scale);
        }
      } else {
        b.state = 'idle';
        if (b.timer <= 0) { b.facing = this.random() > .5 ? 1 : -1; b.timer = 2.5 + this.random() * 3; }
      }
    }
    for (const l of this.letters.filter(l => l.age > 24)) {
      this.events.push({ type: 'expire', letter: l.id });
      for (const b of this.bears) if (b.target === l.id) { b.target = null; b.state = 'idle'; }
    }
    this.letters = this.letters.filter(l => l.age <= 24);
  }
  drainEvents() { return this.events.splice(0); }
}
