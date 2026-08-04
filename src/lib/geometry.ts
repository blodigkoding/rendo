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


/**
 * Hvor varen står langs gangen.
 *
 * En reolrad kan være femten meter lang, og «seksjon G1-01» sier ingenting om
 * hvor langt inn man må gå. Her regnes avstanden fra den enden av raden som
 * ligger nærmest inngangen, som er den man kommer fra.
 */
export interface ShelfPosition {
  /** Meter inn i gangen, fra enden nærmest inngangen. */
  metersIn: number;
  /** Hele radens lengde. */
  runLength: number;
  /** Seksjonens nummer talt fra samme ende, og hvor mange det er. */
  index: number;
  count: number;
  /** Andel 0–1 langs raden – brukes til tegningen. */
  fraction: number;
}

export function shelfPosition(
  fixtures: Fixture[],
  fixture: Fixture,
  entrance: Vec2,
): ShelfPosition {
  // Raden man går langs: samme gang, samme side.
  const run = fixtures.filter((f) => f.aisle === fixture.aisle && f.facing === fixture.facing);
  const xs = run.map((f) => f.x + f.w / 2);
  const ys = run.map((f) => f.y + f.d / 2);
  const vertical = Math.max(...ys) - Math.min(...ys) >= Math.max(...xs) - Math.min(...xs);

  const along = (f: Fixture) => (vertical ? f.y + f.d / 2 : f.x + f.w / 2);
  const low = Math.min(...run.map(along));
  const high = Math.max(...run.map(along));
  const entranceAlong = vertical ? entrance.y : entrance.x;

  // Nærmeste ende sett fra inngangen er den man kommer inn fra.
  const fromLow = Math.abs(entranceAlong - low) <= Math.abs(entranceAlong - high);
  const runLength = Math.max(0.1, high - low);
  const here = along(fixture);
  const metersIn = fromLow ? here - low : high - here;

  const ordered = [...run].sort((a, b) => (fromLow ? along(a) - along(b) : along(b) - along(a)));

  return {
    metersIn,
    runLength,
    index: ordered.findIndex((f) => f.id === fixture.id) + 1,
    count: run.length,
    fraction: Math.min(1, Math.max(0, metersIn / runLength)),
  };
}


/**
 * Hva slags innredning varen står i, på norsk. Det er forskjell på å lete i en
 * tørrvarereol og i en frysekum, og det bør stå.
 */
export function fixtureTypeName(fixture: Fixture, definite = false): string {
  const [indefinite, def] = ((): [string, string] => {
    switch (fixture.type) {
      case 'cooler':
        return ['kjøledisk', 'kjøledisken'];
      case 'freezer':
        return fixture.heightCm < 120
          ? ['frysekum', 'frysekummen']
          : ['fryseskap', 'fryseskapet'];
      case 'island':
        return ['utstillingsbord', 'utstillingsbordet'];
      case 'wall':
        return ['vegghylle', 'vegghylla'];
      case 'service':
        return ['betjent disk', 'den betjente disken'];
      default:
        return ['reol', 'reolen'];
    }
  })();
  return definite ? def : indefinite;
}
