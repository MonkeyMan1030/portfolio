import { gearOutline, curvePoint } from './geometry.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const projects = {
  elite: { category: 'PERSONAL PROJECT / FITNESS', title: 'Elite Hypertrophy', lead: 'A fitness app project, built around a personal interest in training.', focus: 'Training × software', context: 'Elite Hypertrophy is part of my personal project collection. It brings my interest in fitness into the things I build.', next: 'A closer look inside', detail: 'Project screenshots, a feature walkthrough, and the technical write-up will be added here as the project documentation is brought together.' },
  alchemy: { category: 'PERSONAL PROJECT / MARTIAL ARTS', title: 'Alchemy Martial Arts', lead: 'A martial arts app project. Another way to bring a personal interest into software.', focus: 'Practice × software', context: 'Alchemy is an app project centered on martial arts, and part of my ongoing personal work.', next: 'From practice to product', detail: 'This space is reserved for the actual app screens, the problems the app addresses, and a look at the implementation.' },
  python: { category: 'SCHOOL PROJECTS / PROGRAMMING', title: 'Python, one problem at a time.', lead: 'Coursework is a place to try things, work through problems, and build a stronger foundation.', focus: 'Python coursework', context: 'A growing collection of Python projects from school. Individual programs and their write-ups will be collected here.', next: 'Inside the collection', detail: 'Source code, sample input and output, and notes on each solution will be added with the individual projects.' }
};

// Native dialog provides focus containment, Escape handling, and inert background.
const dialog = document.querySelector('#project-dialog');
let opener;
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.project];
  opener = button;
  document.querySelector('#dialog-category').textContent = project.category;
  const content = document.querySelector('#dialog-content');
  content.replaceChildren();
  const title = document.createElement('h2'); title.id = 'dialog-title'; title.className = 'dialog-title'; title.textContent = project.title;
  const lead = document.createElement('p'); lead.className = 'dialog-lead'; lead.textContent = project.lead;
  const columns = document.createElement('div'); columns.className = 'dialog-columns';
  for (const [heading, text] of [[project.focus, project.context], [project.next, project.detail]]) {
    const column = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = heading;
    const p = document.createElement('p'); p.textContent = text;
    column.append(h, p); columns.append(column);
  }
  const note = document.createElement('p'); note.className = 'dialog-note'; note.textContent = 'Documentation in progress. Interested in this project? Get in touch and I’ll be happy to talk about it.';
  const link = document.createElement('a'); link.href = `mailto:reinhardmattias10@gmail.com?subject=${encodeURIComponent('About ' + project.title)}`; link.className = 'dialog-link'; link.textContent = 'Ask me about this project ↗';
  content.append(title, lead, columns, note, link);
  dialog.showModal();
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => opener?.focus());

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('.project').forEach(project => {
    const shown = button.dataset.filter === 'all' || project.dataset.category === button.dataset.filter;
    project.hidden = !shown;
    if (shown) count++;
  });
  document.querySelector('#filter-status').textContent = `Showing ${count} ${count === 1 ? 'project' : 'projects'}`;
}));

const svgNS = 'http://www.w3.org/2000/svg';
const gears = [
  { id: 'gear-a', x: -50, y: -40, teeth: 24, radius: 89, color: '#718859', speed: 1 },
  { id: 'gear-b', x: 62, y: 35, teeth: 16, radius: 61, color: '#c0cca9', speed: -1.5 },
  { id: 'gear-c', x: -47, y: 91, teeth: 12, radius: 46, color: '#d6deca', speed: -2 }
];
for (const gear of gears) {
  gear.group = document.querySelector('#' + gear.id);
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', gearOutline(gear.teeth, gear.radius));
  path.setAttribute('fill', gear.color); path.setAttribute('stroke', '#405b36'); path.setAttribute('stroke-width', '1.5');
  gear.group.append(path);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', Math.cos(a) * gear.radius * .52); circle.setAttribute('cy', Math.sin(a) * gear.radius * .52); circle.setAttribute('r', gear.radius * .17); circle.setAttribute('fill', '#eeede7'); circle.setAttribute('stroke', '#405b36'); circle.setAttribute('stroke-width', '1'); gear.group.append(circle);
  }
}

const canvas = document.querySelector('#lissajous');
const ctx = canvas.getContext('2d');
const freq = document.querySelector('#frequency');
const phase = document.querySelector('#phase');
let machinePaused = reducedMotion.matches, labPaused = reducedMotion.matches, machineVisible = true, labVisible = false;
let angle = 0, clock = 0, last = 0, frame = 0;
let width = 450, height = 300;
function sizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width; height = rect.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCurve();
}
function drawMachine() {
  for (const gear of gears) gear.group.setAttribute('transform', `translate(${gear.x} ${gear.y}) rotate(${angle * gear.speed})`);
}
function drawCurve() {
  if (!ctx || !width) return;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#81916c24'; ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y < height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const a = Number(freq.value), delta = Number(phase.value) * Math.PI / 180;
  ctx.beginPath();
  const samples = 800, scaleX = width * .37, scaleY = height * .37;
  for (let i = 0; i <= samples; i++) {
    const [x, y] = curvePoint(i / samples * 2 * Math.PI, a, delta);
    const px = width / 2 + x * scaleX, py = height / 2 + y * scaleY;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = '#c3d5a5'; ctx.lineWidth = 1.2; ctx.stroke();
  const [x, y] = curvePoint(clock, a, delta);
  ctx.beginPath(); ctx.arc(width / 2 + x * scaleX, height / 2 + y * scaleY, 4, 0, Math.PI * 2); ctx.fillStyle = '#eef5df'; ctx.fill();
  ctx.beginPath(); ctx.arc(width / 2 + x * scaleX, height / 2 + y * scaleY, 10, 0, Math.PI * 2); ctx.strokeStyle = '#c3d5a54a'; ctx.stroke();
}
function syncControls() {
  const machineButton = document.querySelector('#pause-motion');
  machineButton.setAttribute('aria-pressed', String(machinePaused)); machineButton.textContent = machinePaused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
  document.querySelector('#motion-status').textContent = machinePaused ? 'SYSTEM AT REST' : 'SYSTEM IN MOTION';
  const labButton = document.querySelector('#lab-pause'); labButton.setAttribute('aria-pressed', String(labPaused)); labButton.textContent = labPaused ? 'Resume ▷' : 'Pause Ⅱ';
}
function animate(now) {
  frame = 0;
  const elapsed = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
  if (!machinePaused && machineVisible) { angle = (angle + elapsed * 9) % 360; drawMachine(); }
  if (!labPaused && labVisible) { clock += elapsed * .8; drawCurve(); }
  schedule();
}
function schedule() {
  if (document.hidden || frame) return;
  if ((!machinePaused && machineVisible) || (!labPaused && labVisible)) frame = requestAnimationFrame(animate);
  else last = 0;
}
document.querySelector('#pause-motion').addEventListener('click', () => { machinePaused = !machinePaused; syncControls(); schedule(); });
document.querySelector('#lab-pause').addEventListener('click', () => { labPaused = !labPaused; syncControls(); schedule(); });
function updateCurve() { document.querySelector('#freq-value').textContent = `${freq.value} : 2`; document.querySelector('#phase-value').textContent = `${phase.value}°`; drawCurve(); }
freq.addEventListener('input', updateCurve); phase.addEventListener('input', updateCurve);
document.querySelector('#reset-lab').addEventListener('click', () => { freq.value = 3; phase.value = 90; clock = 0; updateCurve(); });
const observer = new IntersectionObserver(entries => { for (const entry of entries) { if (entry.target === canvas) labVisible = entry.isIntersecting; else machineVisible = entry.isIntersecting; } schedule(); }, { threshold: .05 });
observer.observe(canvas); observer.observe(document.querySelector('#machine'));
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else schedule(); });
reducedMotion.addEventListener('change', event => { if (event.matches) { machinePaused = true; labPaused = true; syncControls(); } schedule(); });
new ResizeObserver(sizeCanvas).observe(canvas);
document.querySelector('#year').textContent = new Date().getFullYear();
drawMachine(); syncControls(); sizeCanvas(); schedule();
