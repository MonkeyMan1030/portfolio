// Small live two-body drawing for the home page card. Same physics module as the full simulator.
import { createSystem, step } from './physics.mjs';
const canvas = document.getElementById('orbit-mini');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const presets = [[1, 0.894], [3, 0.8], [6, 1.02], [1.6, 0.7]];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(pointer: coarse)').matches,frameInterval=mobile?1000/30:1000/60;
  let paintedAt=0;
  let which = 0, bodies, trails, paused = reduce.matches, visible = true, raf = 0, last = 0, acc = 0, W = 0, H = 0, dpr = 1;
  function reset() { bodies = createSystem(...presets[which]); trails = [[], []]; }
  function size() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, mobile?1.5:2);
    W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  // Two slightly offset passes so every line looks like it was gone over twice in pencil.
  function pencil(points, color, width) {
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      points.forEach(([x, y], i) => { const j = pass ? Math.sin(i * 1.7 + pass) * 0.9 : 0; i ? ctx.lineTo(x + j, y - j) : ctx.moveTo(x + j, y - j); });
      ctx.strokeStyle = color; ctx.globalAlpha = pass ? 0.35 : 0.9; ctx.lineWidth = pass ? width * 0.6 : width; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const s = Math.min(W, H * 1.5) * 0.5, cx = W / 2, cy = H / 2, to = p => [cx + p.x * s, cy + p.y * s * 0.8];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    pencil([[cx - 7, cy], [cx + 7, cy]], '#1d201b', 1.2); pencil([[cx, cy - 7], [cx, cy + 7]], '#1d201b', 1.2);
    const colors = ['#c5391f', '#1f4f9e'];
    trails.forEach((t, i) => { if (t.length > 1) pencil(t, colors[i], 1.5); });
    pencil([to(bodies[0]), to(bodies[1])], '#1d201b55', 0.8);
    bodies.forEach((b, i) => {
      const [x, y] = to(b), r = 5 + Math.cbrt(b.m) * 11;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = colors[i]; ctx.fill();
      ctx.beginPath(); ctx.arc(x + 1.5, y - 1, r + 1.5, 0.3, Math.PI * 2.2); ctx.strokeStyle = '#1d201b'; ctx.lineWidth = 1.3; ctx.stroke();
    });
  }
  function frame(now) {
    raf = 0; if(now-paintedAt<frameInterval-1){schedule();return;}paintedAt=now;const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now; acc += dt * 1.4;
    let n = 0;
    while (acc >= 1 / 240 && n++ < 24) {
      try { step(bodies, 1 / 240); } catch { reset(); }
      acc -= 1 / 240;
    }
    const s = Math.min(W, H * 1.5) * 0.5;
    bodies.forEach((b, i) => { trails[i].push([W / 2 + b.x * s, H / 2 + b.y * s * 0.8]); if (trails[i].length > 420) trails[i].shift(); });
    draw(); schedule();
  }
  function schedule() { if (!raf && !paused && visible && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
  const change=document.createElement('button');change.id='change-orbit';change.type='button';change.textContent='Change orbit example';canvas.closest('a').after(change);
  change.addEventListener('click', e => { e.preventDefault(); which = (which + 1) % presets.length; reset(); if (paused) draw(); });
  document.addEventListener('notebook-motion', e => { paused = e.detail.paused; paused ? stop() : schedule(); });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : schedule(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? schedule() : stop(); }).observe(canvas);
  new ResizeObserver(() => { size(); trails = [[], []]; draw(); }).observe(canvas);
  reset(); size(); draw(); schedule();
}
