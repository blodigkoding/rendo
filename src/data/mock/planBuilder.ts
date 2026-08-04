import type { Checkout, Department, Fixture, FixtureType, Rect, Room, StorePlan } from '../types';
import { buildOutline } from './outline';

/**
 * Byggeklossene i en norsk butikk.
 *
 * Målene følger det som faktisk står i butikkene her hjemme:
 *
 *  - Reolseksjoner er 1,0 m brede. Det er modulen norsk butikkinnredning selges
 *    i, og den som seksjonsmerkingen i hylla følger.
 *  - En gondolrad er 1,25 m dyp, altså 0,625 m per side, og 180 cm høy i
 *    lavprisbutikk. Veggreoler går til 200–220 cm.
 *  - Ganger er 2,2–2,6 m. Under det kommer man ikke forbi hverandre med vogn.
 *  - Kjøledisker langs vegg er dypere (0,9 m) enn tørrvarereoler.
 *  - Frukt og grønt står på lave bord rett innenfor inngangen, ikke i høye
 *    reoler – det er første avdeling i så godt som alle norske butikker.
 *  - Frysere står som frittstående kummer i rader, ikke langs veggen.
 *  - Kassene står på rekke langs fronten med kølist mellom inngang og utgang.
 *
 * Hver kjede får sin egen oppskrift lenger nede i `plans.ts`.
 */

/** Norsk butikkinnredning kommer i meter-moduler. */
const SECTION = 1;
/** Gondolrad, dobbeltsidig. */
const RUN_DEPTH = 1.25;
/** Kjøledisk langs vegg. */
const COOLER_DEPTH = 0.9;

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

/** Lave bord med frukt og grønt, rett innenfor inngangen. */
export interface ProduceSpec {
  dept: string;
  aisle: number;
  /** Antall bord. */
  tables: number;
}

/** Pallplasser: varer rett fra pallen, som drikke og kampanjer. */
export interface PalletSpec {
  dept: string;
  aisle: number;
  units: number;
  x: number;
  y: number;
}

/** Frittstående frysekummer på rekke. */
export interface FreezerSpec {
  dept: string;
  aisle: number;
  units: number;
  /** Øverste kant på raden. */
  y: number;
  x: number;
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
  /** Frukt og grønt på bord ved inngangen. */
  produce?: ProduceSpec;
  /** Frysekummer midt på gulvet. */
  freezers?: FreezerSpec;
  /** Pallplasser på gulvet. */
  pallets?: PalletSpec;
  /** Møblerte utstillingsrom fremst i butikken. */
  showrooms?: Array<{ name: string; dept: string }>;
  checkouts: number;
  /** Butikken har egen disk for vareutlevering. */
  pickup?: boolean;
  entranceX: number;
  landmarks?: Array<{ id: string; name: string; x: number; y: number }>;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function buildPlan(spec: PlanSpec): StorePlan {
  const sectionLength = spec.sectionLength ?? SECTION;
  const runDepth = spec.runDepth ?? RUN_DEPTH;
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
        w: spec.leftWall.type === 'cooler' || spec.leftWall.type === 'freezer' ? COOLER_DEPTH : 0.6,
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
        x:
          spec.width -
          0.4 -
          (spec.rightWall.type === 'cooler' || spec.rightWall.type === 'freezer'
            ? COOLER_DEPTH
            : 0.6),
        y: spec.runY0 + i * sectionLength,
        w: spec.rightWall.type === 'cooler' || spec.rightWall.type === 'freezer' ? COOLER_DEPTH : 0.6,
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
          d: segment.type === 'cooler' || segment.type === 'freezer' ? COOLER_DEPTH : 0.6,
          heightCm: segment.heightCm,
          levels: segment.levels,
        });
        index++;
      }
    }
  }

  // Frukt og grønt: lave bord rett innenfor inngangen. De ligger på tvers av
  // fronten, ikke i dybden – slik står de i butikken, så du går forbi hele
  // avdelingen på vei inn.
  if (spec.produce) {
    const tableW = 1.6;
    const tableD = 1.1;
    for (let i = 0; i < spec.produce.tables; i++) {
      const row = i % 2;
      const column = Math.floor(i / 2);
      fixtures.push({
        id: `fx-produce-${i}`,
        code: `FG-${pad(i + 1)}`,
        type: 'island',
        departmentId: spec.produce.dept,
        aisle: `Gang ${spec.produce.aisle}`,
        facing: 'south',
        x: 1.6 + column * (tableW + 0.9),
        y: spec.depth - 8.5 + row * (tableD + 1.2),
        w: tableW,
        d: tableD,
        heightCm: 95,
        levels: 2,
      });
    }
  }

  /*
    Utstillingsrom: JYSK bygger møblerte rom – soverom, kjøkkenkrok, spisestue –
    fremst i butikken, og har reolene bak. Et rom er en klynge lave møbler du
    kan gå rundt, ikke en hylle du plukker fra.
  */
  if (spec.showrooms) {
    spec.showrooms.forEach((room, r) => {
      const x0 = 1.8 + r * 6.4;
      // Rommene ligger foran reolene, mellom siste seksjon og kassesonen.
      const y0 = spec.runY0 + spec.runSections * sectionLength + 1;
      const pieces: Array<[number, number, number, number, number]> = [
        // x, y, bredde, dybde, høyde i cm
        [0, 0, 2.6, 2.0, 60],
        [3.0, 0.4, 1.4, 1.4, 75],
        [0.6, 2.8, 3.2, 1.0, 45],
      ];
      pieces.forEach(([dx, dy, w, d, h], i) => {
        fixtures.push({
          id: `fx-show-${r}-${i}`,
          code: `U${r + 1}-${pad(i + 1)}`,
          type: 'island',
          departmentId: room.dept,
          aisle: room.name,
          facing: 'south',
          x: x0 + dx,
          y: y0 + dy,
          w,
          d,
          heightCm: h,
          levels: 1,
        });
      });
    });
  }

  // Frysekummer på rekke, som midt på gulvet i en norsk butikk.
  if (spec.freezers) {
    for (let i = 0; i < spec.freezers.units; i++) {
      fixtures.push({
        id: `fx-freezer-${i}`,
        code: `FR-${pad(i + 1)}`,
        type: 'freezer',
        departmentId: spec.freezers.dept,
        aisle: `Gang ${spec.freezers.aisle}`,
        facing: 'south',
        x: spec.freezers.x,
        y: spec.freezers.y + i * 1.9,
        w: 2.1,
        d: 1.7,
        heightCm: 90,
        levels: 2,
      });
    }
  }

  // Pallplasser: en halv europall er 0,8 × 1,2 m, og varene stables på den.
  if (spec.pallets) {
    for (let i = 0; i < spec.pallets.units; i++) {
      fixtures.push({
        id: `fx-pallet-${i}`,
        code: `PL-${pad(i + 1)}`,
        type: 'pallet',
        departmentId: spec.pallets.dept,
        aisle: `Gang ${spec.pallets.aisle}`,
        facing: 'south',
        x: spec.pallets.x + (i % 2) * 1.5,
        y: spec.pallets.y + Math.floor(i / 2) * 2.1,
        w: 1.2,
        d: 1.5,
        heightCm: 130,
        levels: 3,
      });
    }
  }

  const checkoutY = spec.depth - 4;
  let checkouts: Checkout[] = Array.from({ length: spec.checkouts }, (_, i) => ({
    id: `co-${i + 1}`,
    name: `Kasse ${i + 1}`,
    kind: 'checkout' as const,
    // Kassepunkt med bånd: smal disk, bred køgang mellom.
    x: 6.5 + i * 2.6,
    y: checkoutY,
    w: 1.1,
    d: 2.4,
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
