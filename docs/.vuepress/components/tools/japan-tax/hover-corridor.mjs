// Convex safe polygon between the trigger and its help panel. It never captures clicks.
export function inHoverCorridor(point, trigger, panel, padding = 10) {
  const points = [trigger, panel].flatMap(r => [
    [r.left - padding, r.top - padding], [r.right + padding, r.top - padding],
    [r.right + padding, r.bottom + padding], [r.left - padding, r.bottom + padding],
  ]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = points => { const h = []; for (const p of points) { while (h.length > 1 && cross(h.at(-2), h.at(-1), p) <= 0) h.pop(); h.push(p); } return h; };
  const lower = half(points), upper = half([...points].reverse());
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return hull.every((p, i) => cross(p, hull[(i + 1) % hull.length], point) >= 0);
}
