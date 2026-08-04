import type { Checkout, Department, Fixture, FixtureType, Rect, Room, StorePlan } from '../types';
import { buildOutline } from './outline';

/**
 * Butikkplanene bygges av de samme byggeklossene en BIM-modell ville gitt oss:
 * gondolrader i midten, veggseksjoner rundt, kassesone foran og en inngang.
 * Hver kjede får sin egen oppskrift lenger nede i `plans.ts`.
 */

export interface RunSide {
  dept: string;
  aisle: number;
}

export interface RunSpec {
  /** Venstre kant av raden. */
  x: number;
  left: RunSide;
  right: RunSide;
}

export interface WallSpec {
  dept: string;
  aisle: number;
  type: FixtureType;
  heightCm: number;
  levels: number;
}

export interface BackWallSegment {
  dept: string;
  sections: number;
  type: FixtureType;
  heightCm: number;
  levels: number;
}

export interface PlanSpec {
  storeId: string;
  width: number;
  depth: number;
  departments: Department[];
  runs: RunSpec[];
  runY0: number;
  runSections: number;
  sectionLength?: number;
  runDepth?: number;
  gondolaHeightCm?: number;
  gondolaLevels?: number;
  leftWall?: WallSpec;
  rightWall?: WallSpec;
  backWall?: BackWallSegment[];
  checkouts: number;
  /** Butikken har egen disk for vareutlevering. */
  pickup?: boolean;
  entranceX: number;
  landmarks?: Array<{ id: string; name: string; x: number; y: number }>;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function buildPlan(spec: PlanSpec): StorePlan {
  const sectionLength = spec.sectionLength ?? 2;
  const runDepth = spec.runDepth ?? 1.2;
  const gondolaHeightCm = spec.gondolaHeightCm ?? 180;
  const gondolaLevels = spec.gondolaLevels ?? 5;

  const fixtures: Fixture[] = [];

  for (const run of spec.runs) {
    for (let i = 0; i < spec.runSections; i++) {
      const y = spec.runY0 + i * sectionLength;

      // Vestsiden – kunden står i gangen til venstre.
      fixtures.push({
        id: `fx-${run.x}-w-${i}`,
        code: `G${run.left.aisle}-${pad(i + 1)}`,
        type: 'gondola',
        departmentId: run.left.dept,
        aisle: `Gang ${run.left.aisle}`,
        facing: 'west',
        x: run.x,
        y,
        w: runDepth / 2,
        d: sectionLength,
        heightCm: gondolaHeightCm,
        levels: gondolaLevels,
      });

      // Østsiden av samme rad.
      fixtures.push({
        id: `fx-${run.x}-e-${i}`,
        code: `G${run.right.aisle}-${pad(i + 11)}`,
        type: 'gondola',
        departmentId: run.right.dept,
        aisle: `Gang ${run.right.aisle}`,
        facing: 'east',
        x: run.x + runDepth / 2,
        y,
        w: runDepth / 2,
        d: sectionLength,
        heightCm: gondolaHeightCm,
        levels: gondolaLevels,
      });
    }
  }

  if (spec.leftWall) {
    for (let i = 0; i < spec.runSections; i++) {
      fixtures.push({
        id: `fx-wall-w-${i}`,
        code: `G${spec.leftWall.aisle}-${pad(i + 11)}`,
        type: spec.leftWall.type,
        departmentId: spec.leftWall.dept,
        aisle: `Gang ${spec.leftWall.aisle}`,
        facing: 'east',
        x: 0.4,
        y: spec.runY0 + i * sectionLength,
        w: 1,
        d: sectionLength,
        heightCm: spec.leftWall.heightCm,
        levels: spec.leftWall.levels,
      });
    }
  }

  if (spec.rightWall) {
    for (let i = 0; i < spec.runSections; i++) {
      fixtures.push({
        id: `fx-wall-e-${i}`,
        code: `G${spec.rightWall.aisle}-${pad(i + 11)}`,
        type: spec.rightWall.type,
        departmentId: spec.rightWall.dept,
        aisle: `Gang ${spec.rightWall.aisle}`,
        facing: 'west',
        x: spec.width - 1.4,
        y: spec.runY0 + i * sectionLength,
        w: 1,
        d: sectionLength,
        heightCm: spec.rightWall.heightCm,
        levels: spec.rightWall.levels,
      });
    }
  }

  if (spec.backWall) {
    const total = spec.backWall.reduce((sum, segment) => sum + segment.sections, 0);
    const available = spec.width - 8;
    const length = available / total;
    let index = 0;
    for (const segment of spec.backWall) {
      for (let i = 0; i < segment.sections; i++) {
        fixtures.push({
          id: `fx-back-${index}`,
          code: `BV-${pad(index + 1)}`,
          type: segment.type,
          departmentId: segment.dept,
          aisle: 'Bakgang',
          facing: 'south',
          x: 4 + index * length,
          y: 0.4,
          w: length,
          d: 1,
          heightCm: segment.heightCm,
          levels: segment.levels,
        });
        index++;
      }
    }
  }

  const checkoutY = spec.depth - 4;
  let checkouts: Checkout[] = Array.from({ length: spec.checkouts }, (_, i) => ({
    id: `co-${i + 1}`,
    name: `Kasse ${i + 1}`,
    kind: 'checkout' as const,
    x: 7 + i * 3,
    y: checkoutY,
    w: 1.6,
    d: 1.2,
  }));

  /**
   * Vareutleveringen er et lager med en luke, ikke en disk. Rommet legges i
   * hjørnet bak kassene, og alt som ellers ville stått der, flyttes ut.
   */
  const rooms: Room[] = [];
  if (spec.pickup) {
    const w = Math.min(11, spec.width * 0.3);
    const d = Math.min(8, spec.depth * 0.3);
    const room: Room = {
      id: 'room-pickup',
      name: 'Vareutlevering',
      kind: 'storage',
      heightCm: 300,
      x: spec.width - w - 0.6,
      y: spec.depth - d - 0.6,
      w,
      d,
      opening: { side: 'west', at: d * 0.32, width: 2.6 },
    };
    rooms.push(room);

    const clash = (r: Rect) =>
      r.x < room.x + room.w + 0.5 &&
      r.x + r.w > room.x - 0.5 &&
      r.y < room.y + room.d + 0.5 &&
      r.y + r.d > room.y - 0.5;

    for (let i = fixtures.length - 1; i >= 0; i--) if (clash(fixtures[i])) fixtures.splice(i, 1);
    checkouts = checkouts.filter((c) => !clash(c));
  }

  const entrance = { x: spec.entranceX, y: spec.depth - 1.4 };

  // Veggen legges rundt alt som allerede står i butikken, pluss litt luft foran
  // inngangen og kassene.
  const keepInside: Rect[] = [
    ...fixtures.map((f) => ({ x: f.x, y: f.y, w: f.w, d: f.d })),
    ...checkouts.map((c) => ({ x: c.x - 1, y: c.y - 1, w: c.w + 2, d: c.d + 2 })),
    ...rooms.map((r) => ({ x: r.x - 0.4, y: r.y - 0.4, w: r.w + 0.8, d: r.d + 0.8 })),
    { x: entrance.x - 2.4, y: entrance.y - 1.6, w: 4.8, d: 2.6 },
  ];

  const outline = buildOutline({
    seed: spec.storeId,
    width: spec.width,
    depth: spec.depth,
    keepInside,
  });

  return {
    storeId: spec.storeId,
    outline,
    width: spec.width,
    depth: spec.depth,
    wallHeightCm: 320,
    departments: spec.departments,
    fixtures,
    checkouts,
    rooms,
    entrances: [{ id: 'en-1', name: 'Inngang', position: entrance }],
    landmarks: [
      { id: 'lm-kasser', name: 'Kasser', position: { x: 7 + spec.checkouts * 1.5, y: checkoutY + 2.4 } },
      ...(spec.pickup
        ? []
        : [
            {
              id: 'lm-service',
              name: 'Kundeservice',
              position: { x: spec.width - 4, y: checkoutY + 1.6 },
            },
          ]),
      ...(spec.landmarks ?? []).map((l) => ({ id: l.id, name: l.name, position: { x: l.x, y: l.y } })),
    ],
  };
}
