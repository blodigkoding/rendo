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

/**
 * Biltema deler varehuset i åtte forretningsområder, og det er de samme åtte
 * skiltene som henger i taket i butikken.
 */
export const AUTO_DEPARTMENTS: Department[] = [
  { id: 'bilmc', name: 'Bil & MC' },
  { id: 'bilpleie', name: 'Bilpleie' },
  { id: 'verktoy', name: 'Verktøy' },
  { id: 'bygg', name: 'Bygg' },
  { id: 'bat', name: 'Båt' },
  { id: 'fritid', name: 'Fritid' },
  { id: 'hjem', name: 'Hjem' },
  { id: 'kontor', name: 'Kontor & multimedia' },
];

/**
 * Europris er en bruksvarebutikk. Etter ombyggingen til shop-in-shop har tre av
 * avdelingene fått egne navn i butikken – «Fikse selv», «Lekeplassen» og
 * «Ren glede» – og det er de navnene som står på skiltene.
 */
export const VARIETY_DEPARTMENTS: Department[] = [
  { id: 'kjokken', name: 'Kjøkken' },
  { id: 'interior', name: 'Interiør' },
  { id: 'oppbevaring', name: 'Oppbevaring' },
  { id: 'rengjoring', name: 'Ren glede' },
  { id: 'personlig', name: 'Personlig pleie' },
  { id: 'godteri', name: 'Snacks & drikke' },
  { id: 'dyr', name: 'Dyr' },
  { id: 'hage', name: 'Hage & uteliv' },
  { id: 'sesong', name: 'Sesong' },
  { id: 'leker', name: 'Lekeplassen' },
  { id: 'kontor', name: 'Kontor & hobby' },
  { id: 'elektro', name: 'Elektro & lys' },
  { id: 'tekstil', name: 'Tekstil' },
  { id: 'verktoy', name: 'Fikse selv' },
];

/** Clas Ohlson sorterer utvalget i fem kategorier, ikke i mange små avdelinger. */
export const HARDWARE_DEPARTMENTS: Department[] = [
  { id: 'jernvare', name: 'Jernvare' },
  { id: 'elektro', name: 'Elektro' },
  { id: 'multimedia', name: 'Multimedia' },
  { id: 'hjem', name: 'Hjem' },
  { id: 'fritid', name: 'Fritid' },
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

/**
 * REMA 1000 Ås – lavpris på rundt 1000 m². Sju rader, 2,5 m ganger, frukt og
 * grønt først i varestrømmen og ferskvare langs bakveggen. Drikke går rett fra
 * pall langs høyre vegg.
 */
const REMA: PlanSpec = {
  storeId: 'st-rema-as',
  width: 34,
  depth: 29,
  departments: GROCERY_DEPARTMENTS,
  runY0: 4.5,
  runSections: 15,
  runs: runsAt(3.6, 2.5, [
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
  freezers: { dept: 'frys', aisle: 8, units: 5, x: 28.6, y: 5 },
  pallets: { dept: 'drikke', aisle: 8, units: 4, x: 28.4, y: 16 },
  checkouts: 4,
  entranceX: 3,
};

/**
 * Coop Extra Ås – lavpris med fullsortiment, rundt 1400 m². Åtte rader,
 * bredere ganger enn Rema, eget bakeri og pantemaskin ved inngangen.
 */
const EXTRA: PlanSpec = {
  storeId: 'st-extra-as',
  width: 42,
  depth: 34,
  departments: GROCERY_DEPARTMENTS,
  runY0: 5,
  runSections: 19,
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
  freezers: { dept: 'frys', aisle: 9, units: 6, x: 35.4, y: 6 },
  pallets: { dept: 'drikke', aisle: 9, units: 6, x: 35.2, y: 19 },
  checkouts: 6,
  entranceX: 3.6,
  landmarks: [{ id: 'lm-pant', name: 'Pant', x: 38, y: 30 }],
};

/**
 * Europris Ås – bruksvarehus på rundt 1150 m². Ingen kjøl, høye reoler, og
 * avdelingene er bygget som shop-in-shop etter ombyggingen.
 */
const EUROPRIS: PlanSpec = {
  storeId: 'st-europris-as',
  width: 38,
  depth: 30,
  departments: VARIETY_DEPARTMENTS,
  runY0: 5,
  runSections: 17,
  gondolaHeightCm: 200,
  gondolaLevels: 6,
  runs: runsAt(4.6, 2.5, [
    ['kjokken', 'oppbevaring'],
    ['oppbevaring', 'rengjoring'],
    ['rengjoring', 'personlig'],
    ['godteri', 'dyr'],
    ['leker', 'kontor'],
    ['elektro', 'tekstil'],
    ['tekstil', 'verktoy'],
    ['verktoy', 'hage'],
    ['hage', 'sesong'],
  ]),
  leftWall: { dept: 'interior', aisle: 1, type: 'wall', heightCm: 220, levels: 6 },
  rightWall: { dept: 'sesong', aisle: 10, type: 'wall', heightCm: 220, levels: 6 },
  backWall: [
    { dept: 'sesong', sections: 5, type: 'wall', heightCm: 220, levels: 5 },
    { dept: 'hage', sections: 5, type: 'wall', heightCm: 220, levels: 5 },
  ],
  checkouts: 3,
  entranceX: 3,
};

/**
 * Biltema Vestby – varehus med 3000 m² salgsflate og rundt 19 000 varer fordelt
 * på kjedens åtte forretningsområder. Reolene er 1,35 m brede varehusseksjoner,
 * gangene 3 m, og hele flaten er selvbetjening.
 */
const BILTEMA: PlanSpec = {
  storeId: 'st-biltema-vestby',
  width: 62,
  depth: 48,
  departments: AUTO_DEPARTMENTS,
  runY0: 6,
  runSections: 20,
  sectionLength: 1.35,
  gondolaHeightCm: 220,
  gondolaLevels: 6,
  runs: runsAt(5.5, 3, [
    ['bilpleie', 'bilmc'],
    ['bilmc', 'bilmc'],
    ['verktoy', 'verktoy'],
    ['verktoy', 'bygg'],
    ['bygg', 'bygg'],
    ['kontor', 'kontor'],
    ['hjem', 'hjem'],
    ['fritid', 'fritid'],
    ['fritid', 'bat'],
    ['bat', 'bat'],
    ['hjem', 'fritid'],
    ['bygg', 'verktoy'],
  ]),
  leftWall: { dept: 'bilmc', aisle: 1, type: 'wall', heightCm: 240, levels: 6 },
  rightWall: { dept: 'bygg', aisle: 14, type: 'wall', heightCm: 240, levels: 6 },
  backWall: [
    { dept: 'bygg', sections: 6, type: 'wall', heightCm: 240, levels: 5 },
    { dept: 'bat', sections: 6, type: 'wall', heightCm: 240, levels: 5 },
  ],
  pallets: { dept: 'bygg', aisle: 13, units: 8, x: 55, y: 10 },
  checkouts: 6,
  pickup: true,
  entranceX: 5,
};

/**
 * Clas Ohlson Ski – kjøpesenterbutikk på rundt 850 m². Lokalet er dypt og
 * smalt slik senterlokaler er, gangene er 2 m, og utvalget er sortert i
 * kjedens fem kategorier.
 */
const CLAS_OHLSON: PlanSpec = {
  storeId: 'st-clas-ohlson-ski',
  width: 26,
  depth: 33,
  departments: HARDWARE_DEPARTMENTS,
  runY0: 4.5,
  runSections: 20,
  gondolaHeightCm: 190,
  gondolaLevels: 6,
  runs: runsAt(3.6, 2, [
    ['hjem', 'hjem'],
    ['hjem', 'elektro'],
    ['elektro', 'multimedia'],
    ['multimedia', 'jernvare'],
    ['jernvare', 'jernvare'],
    ['jernvare', 'fritid'],
  ]),
  leftWall: { dept: 'hjem', aisle: 1, type: 'wall', heightCm: 210, levels: 6 },
  rightWall: { dept: 'fritid', aisle: 8, type: 'wall', heightCm: 210, levels: 6 },
  backWall: [
    { dept: 'elektro', sections: 4, type: 'wall', heightCm: 210, levels: 5 },
    { dept: 'multimedia', sections: 3, type: 'wall', heightCm: 210, levels: 5 },
  ],
  checkouts: 2,
  entranceX: 3,
};

/**
 * JYSK Vinterbro – Store Concept 3.0 på rundt 950 m². Konseptet har tre
 * møblerte utstillingsrom fremst – soverom, kjøkkenkrok og spisestue – og
 * reolene bak. Vareutleveringen er et lager med luke ved siden av kassene.
 */
const JYSK: PlanSpec = {
  storeId: 'st-jysk-vinterbro',
  width: 34,
  depth: 28,
  departments: HOME_DEPARTMENTS,
  runY0: 4.5,
  runSections: 12,
  gondolaHeightCm: 190,
  gondolaLevels: 5,
  runs: runsAt(4.6, 2.8, [
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
  showrooms: [
    { name: 'Soverom', dept: 'senger' },
    { name: 'Kjøkkenkrok', dept: 'mobler' },
    { name: 'Spisestue', dept: 'mobler' },
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
