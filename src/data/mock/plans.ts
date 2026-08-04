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

/** Bil, verktøy og fritid – Biltema. */
export const AUTO_DEPARTMENTS: Department[] = [
  { id: 'bilpleie', name: 'Bilpleie' },
  { id: 'bildeler', name: 'Bildeler' },
  { id: 'verktoy', name: 'Verktøy' },
  { id: 'elverktoy', name: 'Elverktøy' },
  { id: 'bygg', name: 'Bygg' },
  { id: 'elektro', name: 'Elektro' },
  { id: 'fritid', name: 'Fritid' },
  { id: 'bat', name: 'Båt' },
  { id: 'hage', name: 'Hage' },
  { id: 'sykkel', name: 'Sykkel' },
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

/** Møbler og innredning – JYSK. */
export const HOME_DEPARTMENTS: Department[] = [
  { id: 'senger', name: 'Senger' },
  { id: 'madrasser', name: 'Madrasser' },
  { id: 'sengetoy', name: 'Sengetøy' },
  { id: 'dyner', name: 'Dyner & puter' },
  { id: 'mobler', name: 'Møbler' },
  { id: 'oppbevaring', name: 'Oppbevaring' },
  { id: 'bad', name: 'Bad' },
  { id: 'gardiner', name: 'Gardiner' },
  { id: 'tepper', name: 'Tepper' },
  { id: 'belysning', name: 'Belysning' },
  { id: 'utemobler', name: 'Utemøbler' },
  { id: 'barnerom', name: 'Barnerom' },
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

/** Biltema Vestby – stort varehus, høye reoler, brede ganger. */
const BILTEMA: PlanSpec = {
  storeId: 'st-biltema-vestby',
  width: 44,
  depth: 32,
  departments: AUTO_DEPARTMENTS,
  runY0: 6,
  runSections: 10,
  gondolaHeightCm: 220,
  gondolaLevels: 6,
  runs: [
    { x: 7, left: { dept: 'bilpleie', aisle: 1 }, right: { dept: 'bildeler', aisle: 2 } },
    { x: 13, left: { dept: 'verktoy', aisle: 2 }, right: { dept: 'verktoy', aisle: 3 } },
    { x: 19, left: { dept: 'elverktoy', aisle: 3 }, right: { dept: 'bygg', aisle: 4 } },
    { x: 25, left: { dept: 'elektro', aisle: 4 }, right: { dept: 'fritid', aisle: 5 } },
    { x: 31, left: { dept: 'sykkel', aisle: 5 }, right: { dept: 'bat', aisle: 6 } },
  ],
  leftWall: { dept: 'bildeler', aisle: 1, type: 'wall', heightCm: 240, levels: 6 },
  rightWall: { dept: 'hage', aisle: 6, type: 'wall', heightCm: 240, levels: 6 },
  backWall: [
    { dept: 'bygg', sections: 6, type: 'wall', heightCm: 240, levels: 5 },
    { dept: 'hage', sections: 6, type: 'wall', heightCm: 240, levels: 5 },
  ],
  checkouts: 5,
  entranceX: 4,
};

/** Clas Ohlson Ski – mindre butikk i kjøpesenter. */
const CLAS_OHLSON: PlanSpec = {
  storeId: 'st-clas-ohlson-ski',
  width: 26,
  depth: 20,
  departments: VARIETY_DEPARTMENTS,
  runY0: 4.5,
  runSections: 6,
  sectionLength: 1.8,
  gondolaHeightCm: 190,
  gondolaLevels: 6,
  runs: [
    { x: 5, left: { dept: 'kjokken', aisle: 1 }, right: { dept: 'oppbevaring', aisle: 2 } },
    { x: 9.4, left: { dept: 'elektro', aisle: 2 }, right: { dept: 'kontor', aisle: 3 } },
    { x: 13.8, left: { dept: 'verktoy', aisle: 3 }, right: { dept: 'rengjoring', aisle: 4 } },
    { x: 18.2, left: { dept: 'personlig', aisle: 4 }, right: { dept: 'leker', aisle: 5 } },
  ],
  leftWall: { dept: 'interior', aisle: 1, type: 'wall', heightCm: 210, levels: 6 },
  rightWall: { dept: 'tekstil', aisle: 5, type: 'wall', heightCm: 210, levels: 6 },
  backWall: [
    { dept: 'elektro', sections: 4, type: 'wall', heightCm: 210, levels: 5 },
    { dept: 'sesong', sections: 3, type: 'wall', heightCm: 210, levels: 5 },
  ],
  checkouts: 2,
  entranceX: 3,
};

/**
 * JYSK Vinterbro – møbelbutikk med utstilling i midten og vareutlevering
 * ved siden av kassene.
 */
const JYSK: PlanSpec = {
  storeId: 'st-jysk-vinterbro',
  width: 36,
  depth: 28,
  departments: HOME_DEPARTMENTS,
  runY0: 5.5,
  runSections: 8,
  sectionLength: 2.2,
  gondolaHeightCm: 190,
  gondolaLevels: 5,
  runs: [
    { x: 6, left: { dept: 'sengetoy', aisle: 1 }, right: { dept: 'dyner', aisle: 2 } },
    { x: 11.5, left: { dept: 'bad', aisle: 2 }, right: { dept: 'gardiner', aisle: 3 } },
    { x: 17, left: { dept: 'tepper', aisle: 3 }, right: { dept: 'belysning', aisle: 4 } },
    { x: 22.5, left: { dept: 'oppbevaring', aisle: 4 }, right: { dept: 'barnerom', aisle: 5 } },
    { x: 28, left: { dept: 'mobler', aisle: 5 }, right: { dept: 'utemobler', aisle: 6 } },
  ],
  leftWall: { dept: 'madrasser', aisle: 1, type: 'wall', heightCm: 220, levels: 5 },
  rightWall: { dept: 'utemobler', aisle: 6, type: 'wall', heightCm: 220, levels: 5 },
  backWall: [
    { dept: 'senger', sections: 6, type: 'wall', heightCm: 220, levels: 4 },
    { dept: 'madrasser', sections: 5, type: 'wall', heightCm: 220, levels: 4 },
  ],
  checkouts: 3,
  pickup: true,
  entranceX: 3.5,
};

export const PLANS: Record<string, StorePlan> = {
  [REMA.storeId]: buildPlan(REMA),
  [EXTRA.storeId]: buildPlan(EXTRA),
  [EUROPRIS.storeId]: buildPlan(EUROPRIS),
  [BILTEMA.storeId]: buildPlan(BILTEMA),
  [CLAS_OHLSON.storeId]: buildPlan(CLAS_OHLSON),
  [JYSK.storeId]: buildPlan(JYSK),
};
