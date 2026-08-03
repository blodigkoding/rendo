import type { Department, StorePlan } from '../types';
import { buildPlan, type PlanSpec } from './planBuilder';

/** Avdelingene i en dagligvarebutikk. Rema og Extra deler dette settet. */
export const GROCERY_DEPARTMENTS: Department[] = [
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

/** Europris er en bruksvarebutikk – helt andre avdelinger. */
export const VARIETY_DEPARTMENTS: Department[] = [
  { id: 'kjokken', name: 'Kjøkken' },
  { id: 'interior', name: 'Interiør' },
  { id: 'oppbevaring', name: 'Oppbevaring' },
  { id: 'rengjoring', name: 'Rengjøring' },
  { id: 'personlig', name: 'Personlig pleie' },
  { id: 'godteri', name: 'Snacks & drikke' },
  { id: 'dyr', name: 'Dyr' },
  { id: 'hage', name: 'Hage & uteliv' },
  { id: 'sesong', name: 'Sesong' },
  { id: 'leker', name: 'Leker & fritid' },
  { id: 'kontor', name: 'Kontor & hobby' },
  { id: 'elektro', name: 'Elektro & lys' },
  { id: 'tekstil', name: 'Tekstil' },
  { id: 'verktoy', name: 'Verktøy' },
];

/** REMA 1000 Ås – kompakt lavprisbutikk, fem rader. */
const REMA: PlanSpec = {
  storeId: 'st-rema-as',
  width: 30,
  depth: 24,
  departments: GROCERY_DEPARTMENTS,
  runY0: 5,
  runSections: 7,
  runs: [
    { x: 5, left: { dept: 'frukt', aisle: 1 }, right: { dept: 'bakeri', aisle: 2 } },
    { x: 9.6, left: { dept: 'torrvarer', aisle: 2 }, right: { dept: 'hermetikk', aisle: 3 } },
    { x: 14.2, left: { dept: 'frokost', aisle: 3 }, right: { dept: 'snacks', aisle: 4 } },
    { x: 18.8, left: { dept: 'husholdning', aisle: 4 }, right: { dept: 'hygiene', aisle: 5 } },
    { x: 23.4, left: { dept: 'baby', aisle: 5 }, right: { dept: 'dyr', aisle: 6 } },
  ],
  leftWall: { dept: 'meieri', aisle: 1, type: 'cooler', heightCm: 200, levels: 6 },
  rightWall: { dept: 'drikke', aisle: 6, type: 'wall', heightCm: 200, levels: 6 },
  backWall: [
    { dept: 'kjott', sections: 5, type: 'cooler', heightCm: 200, levels: 4 },
    { dept: 'frys', sections: 4, type: 'freezer', heightCm: 200, levels: 5 },
  ],
  checkouts: 4,
  entranceX: 3,
};

/** Coop Extra Ås – større supermarked med fullt vareutvalg. */
const EXTRA: PlanSpec = {
  storeId: 'st-extra-as',
  width: 38,
  depth: 28,
  departments: GROCERY_DEPARTMENTS,
  runY0: 6,
  runSections: 8,
  runs: [
    { x: 6, left: { dept: 'frukt', aisle: 1 }, right: { dept: 'bakeri', aisle: 2 } },
    { x: 11, left: { dept: 'torrvarer', aisle: 2 }, right: { dept: 'torrvarer', aisle: 3 } },
    { x: 16, left: { dept: 'hermetikk', aisle: 3 }, right: { dept: 'frokost', aisle: 4 } },
    { x: 21, left: { dept: 'snacks', aisle: 4 }, right: { dept: 'torrvarer', aisle: 5 } },
    { x: 26, left: { dept: 'husholdning', aisle: 5 }, right: { dept: 'hygiene', aisle: 6 } },
    { x: 31, left: { dept: 'baby', aisle: 6 }, right: { dept: 'dyr', aisle: 7 } },
  ],
  leftWall: { dept: 'meieri', aisle: 1, type: 'cooler', heightCm: 200, levels: 6 },
  rightWall: { dept: 'drikke', aisle: 7, type: 'wall', heightCm: 200, levels: 6 },
  backWall: [
    { dept: 'kjott', sections: 6, type: 'cooler', heightCm: 200, levels: 4 },
    { dept: 'frys', sections: 6, type: 'freezer', heightCm: 200, levels: 5 },
  ],
  checkouts: 6,
  entranceX: 3.6,
  landmarks: [{ id: 'lm-pant', name: 'Pant', x: 34, y: 21.4 }],
};

/** Europris Ås – bruksvarer, høye reoler og ingen kjøledisker. */
const EUROPRIS: PlanSpec = {
  storeId: 'st-europris-as',
  width: 34,
  depth: 26,
  departments: VARIETY_DEPARTMENTS,
  runY0: 5.5,
  runSections: 8,
  gondolaHeightCm: 200,
  gondolaLevels: 6,
  runs: [
    { x: 5.5, left: { dept: 'kjokken', aisle: 1 }, right: { dept: 'oppbevaring', aisle: 2 } },
    { x: 10.2, left: { dept: 'rengjoring', aisle: 2 }, right: { dept: 'personlig', aisle: 3 } },
    { x: 14.9, left: { dept: 'godteri', aisle: 3 }, right: { dept: 'dyr', aisle: 4 } },
    { x: 19.6, left: { dept: 'leker', aisle: 4 }, right: { dept: 'kontor', aisle: 5 } },
    { x: 24.3, left: { dept: 'elektro', aisle: 5 }, right: { dept: 'tekstil', aisle: 6 } },
    { x: 29, left: { dept: 'verktoy', aisle: 6 }, right: { dept: 'verktoy', aisle: 7 } },
  ],
  leftWall: { dept: 'interior', aisle: 1, type: 'wall', heightCm: 220, levels: 6 },
  backWall: [
    { dept: 'sesong', sections: 5, type: 'wall', heightCm: 220, levels: 5 },
    { dept: 'hage', sections: 5, type: 'wall', heightCm: 220, levels: 5 },
  ],
  checkouts: 3,
  entranceX: 3,
};

export const PLANS: Record<string, StorePlan> = {
  [REMA.storeId]: buildPlan(REMA),
  [EXTRA.storeId]: buildPlan(EXTRA),
  [EUROPRIS.storeId]: buildPlan(EUROPRIS),
};
