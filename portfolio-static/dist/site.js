// Start the print reveal only after enhancement loads. No hidden content without JS.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const skip = document.querySelector('#skip-print');
let seen = false;
try { seen = sessionStorage.getItem('mr-print-seen') === 'yes'; } catch {}
function finishPrint() {
  document.body.classList.remove('printing');
  if (skip) skip.hidden = true;
  try { sessionStorage.setItem('mr-print-seen', 'yes'); } catch {}
}
if (document.body.classList.contains('home') && !seen && !reduce.matches) {
  document.body.classList.add('printing');
  if (skip) { skip.hidden = false; skip.addEventListener('click', finishPrint); }
  setTimeout(finishPrint, 1800);
}
reduce.addEventListener('change', e => { if (e.matches) finishPrint(); });
