import type { Checkout, Department, Fixture, FixtureType, StorePlan } from '../types';

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
  const checkouts: Checkout[] = Array.from({ length: spec.checkouts }, (_, i) => ({
    id: `co-${i + 1}`,
    name: `Kasse ${i + 1}`,
    x: 7 + i * 3,
    y: checkoutY,
    w: 1.6,
    d: 1.2,
  }));

  return {
    storeId: spec.storeId,
    width: spec.width,
    depth: spec.depth,
    wallHeightCm: 320,
    departments: spec.departments,
    fixtures,
    checkouts,
    entrances: [
      {
        id: 'en-1',
        name: 'Inngang',
        position: { x: spec.entranceX, y: spec.depth - 1.4 },
      },
    ],
    landmarks: [
      { id: 'lm-kasser', name: 'Kasser', position: { x: 7 + spec.checkouts * 1.5, y: checkoutY + 2.4 } },
      { id: 'lm-service', name: 'Kundeservice', position: { x: spec.width - 4, y: checkoutY + 1.6 } },
      ...(spec.landmarks ?? []).map((l) => ({ id: l.id, name: l.name, position: { x: l.x, y: l.y } })),
    ],
  };
}
