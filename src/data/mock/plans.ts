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


/**
 * Radene legges ut med fast avstand: raden er 1,25 m dyp, og gangen mellom er
 * 2,2–2,6 m i dagligvare og opp mot 3 m i varehus. Da blir kartet like tett som
 * butikken faktisk er.
 */
function runsAt(startX: number, aisle: number, sides: Array<[string, string]>) {
  return sides.map(([left, right], i) => ({
    x: startX + i * (1.25 + aisle),
    left: { dept: left, aisle: i + 1 },
    right: { dept: right, aisle: i + 2 },
  }));
}

/** REMA 1000 Ås – lavprisbutikk med sju rader og 2,3 m ganger. */
const REMA: PlanSpec = {
  storeId: 'st-rema-as',
  width: 30,
  depth: 24,
  departments: GROCERY_DEPARTMENTS,
  runY0: 4.2,
  runSections: 12,
  runs: runsAt(3.6, 2.3, [
    ['bakeri', 'torrvarer'],
    ['torrvarer', 'hermetikk'],
    ['hermetikk', 'frokost'],
    ['frokost', 'snacks'],
    ['snacks', 'husholdning'],
    ['husholdning', 'hygiene'],
    ['baby', 'dyr'],
  ]),
  leftWall: { dept: 'meieri', aisle: 1, type: 'cooler', heightCm: 200, levels: 6 },
  rightWall: { dept: 'drikke', aisle: 8, type: 'wall', heightCm: 200, levels: 6 },
  backWall: [
    { dept: 'kjott', sections: 6, type: 'cooler', heightCm: 200, levels: 4 },
    { dept: 'meieri', sections: 4, type: 'cooler', heightCm: 200, levels: 5 },
  ],
  produce: { dept: 'frukt', aisle: 1, tables: 6 },
  freezers: { dept: 'frys', aisle: 8, units: 3, x: 25.6, y: 5 },
  checkouts: 4,
  entranceX: 3,
};

/** Coop Extra Ås – større supermarked med fullt vareutvalg. */
const EXTRA: PlanSpec = {
  storeId: 'st-extra-as',
  width: 38,
  depth: 28,
  departments: GROCERY_DEPARTMENTS,
  runY0: 5,
  runSections: 15,
  runs: runsAt(4.6, 2.6, [
    ['bakeri', 'torrvarer'],
    ['torrvarer', 'torrvarer'],
    ['hermetikk', 'frokost'],
    ['frokost', 'snacks'],
    ['snacks', 'torrvarer'],
    ['husholdning', 'hygiene'],
    ['baby', 'dyr'],
    ['dyr', 'drikke'],
  ]),
  leftWall: { dept: 'meieri', aisle: 1, type: 'cooler', heightCm: 200, levels: 6 },
  rightWall: { dept: 'drikke', aisle: 9, type: 'wall', heightCm: 200, levels: 6 },
  backWall: [
    { dept: 'kjott', sections: 7, type: 'cooler', heightCm: 200, levels: 4 },
    { dept: 'meieri', sections: 5, type: 'cooler', heightCm: 200, levels: 5 },
  ],
  produce: { dept: 'frukt', aisle: 1, tables: 8 },
  freezers: { dept: 'frys', aisle: 9, units: 4, x: 33, y: 6 },
  checkouts: 6,
  entranceX: 3.6,
  landmarks: [{ id: 'lm-pant', name: 'Pant', x: 34, y: 25 }],
};

/** Europris Ås – bruksvarer, høye reoler og ingen kjøledisker. */
const EUROPRIS: PlanSpec = {
  storeId: 'st-europris-as',
  width: 34,
  depth: 26,
  departments: VARIETY_DEPARTMENTS,
  runY0: 5,
  runSections: 14,
  gondolaHeightCm: 200,
  gondolaLevels: 6,
  runs: runsAt(4.6, 2.5, [
    ['kjokken', 'oppbevaring'],
    ['rengjoring', 'personlig'],
    ['godteri', 'dyr'],
    ['leker', 'kontor'],
    ['elektro', 'tekstil'],
    ['verktoy', 'verktoy'],
  ]),
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
  runY0: 5.5,
  runSections: 18,
  gondolaHeightCm: 220,
  gondolaLevels: 6,
  runs: runsAt(5, 3, [
    ['bilpleie', 'bildeler'],
    ['verktoy', 'verktoy'],
    ['elverktoy', 'bygg'],
    ['elektro', 'fritid'],
    ['sykkel', 'bat'],
    ['bat', 'hage'],
  ]),
  leftWall: { dept: 'bildeler', aisle: 1, type: 'wall', heightCm: 240, levels: 6 },
  rightWall: { dept: 'hage', aisle: 8, type: 'wall', heightCm: 240, levels: 6 },
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
  runY0: 4,
  runSections: 11,
  gondolaHeightCm: 190,
  gondolaLevels: 6,
  runs: runsAt(4.2, 2.2, [
    ['kjokken', 'oppbevaring'],
    ['elektro', 'kontor'],
    ['verktoy', 'rengjoring'],
    ['personlig', 'leker'],
    ['leker', 'tekstil'],
  ]),
  leftWall: { dept: 'interior', aisle: 1, type: 'wall', heightCm: 210, levels: 6 },
  rightWall: { dept: 'tekstil', aisle: 7, type: 'wall', heightCm: 210, levels: 6 },
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
  runY0: 5,
  runSections: 15,
  gondolaHeightCm: 190,
  gondolaLevels: 5,
  runs: runsAt(5, 2.8, [
    ['sengetoy', 'dyner'],
    ['bad', 'gardiner'],
    ['tepper', 'belysning'],
    ['oppbevaring', 'barnerom'],
    ['mobler', 'utemobler'],
  ]),
  leftWall: { dept: 'madrasser', aisle: 1, type: 'wall', heightCm: 220, levels: 5 },
  rightWall: { dept: 'utemobler', aisle: 7, type: 'wall', heightCm: 220, levels: 5 },
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
