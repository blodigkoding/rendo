import type { Facing, Fixture, Rect, Vec2 } from '../data/types';

export const FACING_VECTOR: Record<Facing, Vec2> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

export function rectCenter(r: Rect): Vec2 {
  return { x: r.x + r.w / 2, y: r.y + r.d / 2 };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function pathLength(points: Vec2[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

/** Midt på varefronten til en seksjon. */
export function fixtureFrontCenter(fixture: Fixture): Vec2 {
  const c = rectCenter(fixture);
  const n = FACING_VECTOR[fixture.facing];
  return {
    x: c.x + (n.x * fixture.w) / 2,
    y: c.y + (n.y * fixture.d) / 2,
  };
}

/**
 * Punktet i gangen der kunden står når varen plukkes – litt ut fra reolen, slik
 * at ruten ender i gangen og ikke inne i hylla.
 */
export function fixtureAccessPoint(fixture: Fixture, standoff = 0.9): Vec2 {
  const front = fixtureFrontCenter(fixture);
  const n = FACING_VECTOR[fixture.facing];
  return { x: front.x + n.x * standoff, y: front.y + n.y * standoff };
}

/**
 * Nøyaktig punkt der varen står: på reolfronten, forskjøvet langs seksjonen slik
 * planogrammet angir.
 */
export function productMarker(fixture: Fixture, offsetCm: number): Vec2 {
  const offset = Math.min(offsetCm / 100, fixture.facing === 'north' || fixture.facing === 'south' ? fixture.w : fixture.d);
  if (fixture.facing === 'east') return { x: fixture.x + fixture.w, y: fixture.y + offset };
  if (fixture.facing === 'west') return { x: fixture.x, y: fixture.y + offset };
  if (fixture.facing === 'south') return { x: fixture.x + offset, y: fixture.y + fixture.d };
  return { x: fixture.x + offset, y: fixture.y };
}

export function rectContains(r: Rect, p: Vec2, margin = 0): boolean {
  return (
    p.x >= r.x - margin && p.x <= r.x + r.w + margin && p.y >= r.y - margin && p.y <= r.y + r.d + margin
  );
}

/** Formaterer meter til noe som er hyggelig å lese på en skjerm i butikk. */
export function formatMeters(m: number): string {
  if (m < 10) return `${m.toFixed(1).replace('.', ',')} m`;
  return `${Math.round(m)} m`;
}

/** Antatt ganghastighet i butikk, inkludert litt nøling. */
export const WALK_SPEED_MS = 1.1;

export function formatWalkTime(meters: number): string {
  const seconds = meters / WALK_SPEED_MS;
  if (seconds < 60) return `${Math.max(10, Math.round(seconds / 5) * 5)} sek`;
  return `${Math.round(seconds / 60)} min`;
}
