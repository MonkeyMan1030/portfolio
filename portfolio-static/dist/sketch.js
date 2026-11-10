// Pencil underlines. Each one is generated from a seeded random walk, so no two headings share a stroke,
// and it is drawn (stroke-dashoffset) the first time the heading scrolls into view.
import { seededRandom } from './leaves.mjs';
const NS = 'http://www.w3.org/2000/svg';
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
function underline(seed) {
  const r = seededRandom(seed), passes = 2 + (r() > 0.5);
  let d = '';
  for (let p = 0; p < passes; p++) {
    const back = p % 2, y0 = 6 + p * 2.6 + r() * 2;
    const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([(back ? 1 - t : t) * 196 + 2 + (r() - 0.5) * 5, y0 + Math.sin(t * 3 + p) * 1.8 + (r() - 0.5) * 2.4]); }
    d += (p ? 'L' : 'M') + pts[0].map(n => n.toFixed(1)).join(' ');
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d += `Q${a[0].toFixed(1)} ${(a[1] + (r() - 0.5) * 3).toFixed(1)} ${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`; }
    d += 'L' + pts[pts.length - 1].map(n => n.toFixed(1)).join(' ');
  }
  return d;
}
const seen = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.scrib').forEach((el, i) => {
  const svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
  svg.setAttribute('viewBox', '0 0 200 18'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('scribble');
  path.setAttribute('d', underline(97 + i * 13)); path.setAttribute('pathLength', '1');
  svg.append(path); el.append(svg);
  if (still) el.classList.add('seen'); else seen.observe(el);
});

// Title card: remove it when its exit animation ends, or at once on a click or key press.
const card = document.getElementById('splash');
if (card) {
  const done = () => { if (!card.isConnected) return; document.dispatchEvent(new CustomEvent('splash-done')); card.remove(); };
  if (getComputedStyle(card).display === 'none') done();
  else {
    card.addEventListener('animationend', e => { if (e.animationName === 'card-out') done(); });
    card.addEventListener('pointerdown', done);
    addEventListener('keydown', done, { once: true });
  }
}
