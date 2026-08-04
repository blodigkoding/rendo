import type { Rect, Vec2 } from '../data/types';

/** Enkel polygongeometri for butikkflaten. */

export function pointInPolygon(polygon: Vec2[], p: Vec2): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.y > p.y !== b.y > p.y;
    if (crosses && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Korteste avstand fra et punkt til polygonets kant. */
export function distanceToEdge(polygon: Vec2[], p: Vec2): number {
  let best = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    best = Math.min(best, distanceToSegment(p, polygon[j], polygon[i]));
  }
  return best;
}

export function polygonBounds(polygon: Vec2[]): Rect {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, d: Math.max(...ys) - y };
}

/** Alle fire hjørnene i et rektangel ligger innenfor polygonet, med klaring. */
export function rectInsidePolygon(polygon: Vec2[], rect: Rect, clearance = 0): boolean {
  const corners: Vec2[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x, y: rect.y + rect.d },
    { x: rect.x + rect.w, y: rect.y + rect.d },
    { x: rect.x + rect.w / 2, y: rect.y + rect.d / 2 },
  ];
  return corners.every(
    (corner) => pointInPolygon(polygon, corner) && distanceToEdge(polygon, corner) >= clearance,
  );
}

export function toPathData(polygon: Vec2[]): string {
  return `${polygon.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')} Z`;
}
