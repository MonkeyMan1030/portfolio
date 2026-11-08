/** Deterministic geometry shared by the drawings and checks. */
export function gearOutline(teeth, radius, depth = 8) {
  const points = [];
  for (let tooth = 0; tooth < teeth; tooth++) {
    for (const [offset, r] of [[0, radius - depth], [.18, radius], [.55, radius], [.73, radius - depth]]) {
      const angle = (tooth + offset) / teeth * Math.PI * 2;
      points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    }
  }
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ') + 'Z';
}
export function curvePoint(t, frequency, phase) {
  return [Math.sin(frequency * t + phase), Math.sin(2 * t)];
}
