// Pulls a three-colour reduction print of the app screenshot, in the browser.
// Blue goes down first over everything but the brightest marks (those stay paper), red over the
// light areas, black last over the dark ones. Each pass is its own canvas, a little off-register.
import { seededRandom } from './leaves.mjs';
const img = document.querySelector('.shot img');
const INKS = { blue: [17, 121, 204], red: [192, 40, 28], black: [20, 17, 18] };
function build() {
  const box = img.parentElement, w = img.clientWidth, h = img.clientHeight;
  if (!w || !h || box.querySelector('.print-stack')) return;
  const scale = 1.5, W = Math.round(w * scale), H = Math.round(h * scale);
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const sx = src.getContext('2d', { willReadFrequently: true });
  // Same crop as the photo (cover, anchored to the top), softened so the shapes read as cut blocks.
  const k = W / img.naturalWidth; sx.filter = 'blur(1.1px)';
  sx.drawImage(img, 0, 0, img.naturalWidth, H / k, 0, 0, W, H);
  const px = sx.getImageData(0, 0, W, H).data, lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
  // Cut points come from this image's own tonal range, so any screenshot splits into usable layers.
  const sorted = Float32Array.from(lum).sort(), at = q => sorted[Math.floor(q * (sorted.length - 1))];
  const dark = at(0.6), light = at(0.86), paper = at(0.975);
  const tests = { blue: v => v <= paper, red: v => v > light && v <= paper, black: v => v <= dark };
  const stack = document.createElement('div'); stack.className = 'print-stack'; stack.setAttribute('aria-hidden', 'true');
  Object.entries(INKS).forEach(([name, rgb], n) => {
    const random = seededRandom(41 + n * 17), c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'pass pass-' + name;
    const cx = c.getContext('2d'), out = cx.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!tests[name](lum[i])) continue;
      // The roller runs dry toward the edges of the block and skips the odd fleck everywhere.
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y), miss = edge < 7 ? 0.5 - edge * 0.06 : 0.035;
      if (random() < miss) continue;
      out.data[i * 4] = rgb[0]; out.data[i * 4 + 1] = rgb[1]; out.data[i * 4 + 2] = rgb[2]; out.data[i * 4 + 3] = 255;
    }
    cx.putImageData(out, 0, 0); stack.append(c);
  });
  box.append(stack);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { stack.classList.add('real'); return; }
  const pull = () => {
    if (document.getElementById('splash') || document.body.classList.contains('drawing-on')) return setTimeout(pull, 300);
    stack.classList.add('pulled'); setTimeout(() => stack.classList.add('real'), 3600);
  };
  new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); pull(); } }, { threshold: 0.5 }).observe(box);
}
if (img) { if (img.complete && img.naturalWidth) build(); else img.addEventListener('load', build, { once: true }); }
