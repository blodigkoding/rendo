import type { Checkout, Department, Fixture, StorePlan } from '../types';

/**
 * Demo-butikkplan for «Rendo Torg». Bygget opp av de samme byggeklossene som en
 * BIM-modell ville gitt oss: ytre mål, reolrader, kjøl/frys langs vegg, kasser,
 * inngang og servicepunkter.
 *
 * Layouten er en klassisk dagligvareplan: kjølevegg til venstre, ferskvare og
 * frys langs bakveggen, drikke til høyre, seks dobbeltsidige gondolrader i
 * midten og kassesone foran.
 */

const WIDTH = 38;
const DEPTH = 28;

export const DEPARTMENTS: Department[] = [
  { id: 'frukt', name: 'Frukt & grønt' },
  { id: 'bakeri', name: 'Bakeri & brød' },
  { id: 'meieri', name: 'Meieri' },
  { id: 'kjott', name: 'Kjøtt & fisk' },
  { id: 'frys', name: 'Frys' },
  { id: 'drikke', name: 'Drikke' },
  { id: 'torrvarer', name: 'Tørrvarer' },
  { id: 'hermetikk', name: 'Hermetikk & saus' },
  { id: 'frokost', name: 'Frokost & pålegg' },
  { id: 'snacks', name: 'Snacks & godteri' },
  { id: 'husholdning', name: 'Husholdning' },
  { id: 'hygiene', name: 'Hygiene & apotek' },
  { id: 'baby', name: 'Baby' },
  { id: 'dyr', name: 'Dyr & fritid' },
];

/** Gondolrader: x er venstre kant av raden, radene er 1,2 m dype og dobbeltsidige. */
interface RunSpec {
  x: number;
  left: { dept: string; aisle: number };
  right: { dept: string; aisle: number };
}

const RUNS: RunSpec[] = [
  { x: 6, left: { dept: 'frukt', aisle: 1 }, right: { dept: 'bakeri', aisle: 2 } },
  { x: 11, left: { dept: 'torrvarer', aisle: 2 }, right: { dept: 'torrvarer', aisle: 3 } },
  { x: 16, left: { dept: 'hermetikk', aisle: 3 }, right: { dept: 'frokost', aisle: 4 } },
  { x: 21, left: { dept: 'snacks', aisle: 4 }, right: { dept: 'torrvarer', aisle: 5 } },
  { x: 26, left: { dept: 'husholdning', aisle: 5 }, right: { dept: 'hygiene', aisle: 6 } },
  { x: 31, left: { dept: 'baby', aisle: 6 }, right: { dept: 'dyr', aisle: 7 } },
];

const RUN_DEPTH = 1.2;
const SECTION_LENGTH = 2;
const RUN_Y0 = 6;
const RUN_SECTIONS = 8;

const pad = (n: number) => String(n).padStart(2, '0');

function buildGondolas(): Fixture[] {
  const fixtures: Fixture[] = [];

  for (const run of RUNS) {
    for (let i = 0; i < RUN_SECTIONS; i++) {
      const y = RUN_Y0 + i * SECTION_LENGTH;

      // Vestsiden av raden – kunden står i gangen til venstre.
      fixtures.push({
        id: `fx-${run.x}-w-${i}`,
        code: `G${run.left.aisle}-${pad(i + 1)}`,
        type: 'gondola',
        departmentId: run.left.dept,
        aisle: `Gang ${run.left.aisle}`,
        facing: 'west',
        x: run.x,
        y,
        w: RUN_DEPTH / 2,
        d: SECTION_LENGTH,
        heightCm: 180,
        levels: 5,
      });

      // Østsiden av samme rad – kunden står i gangen til høyre.
      fixtures.push({
        id: `fx-${run.x}-e-${i}`,
        code: `G${run.right.aisle}-${pad(i + 11)}`,
        type: 'gondola',
        departmentId: run.right.dept,
        aisle: `Gang ${run.right.aisle}`,
        facing: 'east',
        x: run.x + RUN_DEPTH / 2,
        y,
        w: RUN_DEPTH / 2,
        d: SECTION_LENGTH,
        heightCm: 180,
        levels: 5,
      });
    }
  }

  return fixtures;
}

function buildWallUnits(): Fixture[] {
  const fixtures: Fixture[] = [];

  // Kjølevegg til venstre (meieri) – kunden står i Gang 1.
  for (let i = 0; i < RUN_SECTIONS; i++) {
    fixtures.push({
      id: `fx-wall-w-${i}`,
      code: `G1-${pad(i + 11)}`,
      type: 'cooler',
      departmentId: 'meieri',
      aisle: 'Gang 1',
      facing: 'east',
      x: 0.4,
      y: RUN_Y0 + i * SECTION_LENGTH,
      w: 1,
      d: SECTION_LENGTH,
      heightCm: 200,
      levels: 6,
    });
  }

  // Drikkevegg til høyre – kunden står i Gang 7.
  for (let i = 0; i < RUN_SECTIONS; i++) {
    fixtures.push({
      id: `fx-wall-e-${i}`,
      code: `G7-${pad(i + 11)}`,
      type: 'wall',
      departmentId: 'drikke',
      aisle: 'Gang 7',
      facing: 'west',
      x: WIDTH - 1.4,
      y: RUN_Y0 + i * SECTION_LENGTH,
      w: 1,
      d: SECTION_LENGTH,
      heightCm: 200,
      levels: 6,
    });
  }

  // Bakvegg: ferskvare til venstre, frys til høyre. Kunden står i bakgangen.
  const backSections = 12;
  const backLength = 2.5;
  for (let i = 0; i < backSections; i++) {
    const isFreezer = i >= 6;
    fixtures.push({
      id: `fx-back-${i}`,
      code: `BV-${pad(i + 1)}`,
      type: isFreezer ? 'freezer' : 'cooler',
      departmentId: isFreezer ? 'frys' : 'kjott',
      aisle: 'Bakgang',
      facing: 'south',
      x: 4 + i * backLength,
      y: 0.4,
      w: backLength,
      d: 1,
      heightCm: 200,
      levels: isFreezer ? 5 : 4,
    });
  }

  return fixtures;
}

function buildCheckouts(): Checkout[] {
  const checkouts: Checkout[] = [];
  for (let i = 0; i < 6; i++) {
    checkouts.push({
      id: `co-${i + 1}`,
      name: `Kasse ${i + 1}`,
      x: 8 + i * 3,
      y: 24,
      w: 1.6,
      d: 1.2,
    });
  }
  return checkouts;
}

export const DEMO_PLAN: StorePlan = {
  storeId: 'st-rendo-torg',
  width: WIDTH,
  depth: DEPTH,
  wallHeightCm: 320,
  departments: DEPARTMENTS,
  fixtures: [...buildGondolas(), ...buildWallUnits()],
  checkouts: buildCheckouts(),
  entrances: [{ id: 'en-1', name: 'Hovedinngang', position: { x: 3.6, y: 26.6 } }],
  landmarks: [
    { id: 'lm-kasser', name: 'Kasser', position: { x: 16.5, y: 25.8 } },
    { id: 'lm-service', name: 'Kundeservice', position: { x: 34, y: 25.4 } },
    { id: 'lm-pant', name: 'Pant', position: { x: 34, y: 21.4 } },
  ],
};

export const DEPARTMENT_NAME = new Map(DEPARTMENTS.map((d) => [d.id, d.name]));
