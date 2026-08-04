/**
 * Domenemodell for rendo.
 *
 * Modellen er bevisst holdt uavhengig av hvor dataene kommer fra. I dag fylles
 * den av `mockSource`, men den er formet etter begrepene i et retail-BIM-oppsett
 * (Nordic BIM Retail Solution): butikk → plan → innredning (reoler/seksjoner) →
 * planogram (produktplassering).
 *
 * Alle mål er i meter, alle høyder i centimeter fra gulv.
 * Koordinatsystem: x mot høyre, y nedover (som i en plantegning sett ovenfra).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

/**
 * Kjeden butikken tilhører. Gir appen akkurat nok merkevare til at man kjenner
 * seg igjen – en aksentfarge og et navnetrekk – uten at resten av grensesnittet
 * forlater det hvite uttrykket.
 */
export interface Chain {
  id: string;
  name: string;
  /** Aksentfarge, brukt på navnetrekk, skillelinje og hovedknapp. */
  accent: string;
  /** Tekstfarge oppå aksentfargen. */
  onAccent: string;
  /** Hvordan navnetrekket settes. */
  wordmark: {
    text: string;
    letterSpacing: string;
    weight: number;
    italic?: boolean;
  };
}

export interface Store {
  id: string;
  name: string;
  chainId: string;
  chain: string;
  address: string;
  postalCode: string;
  city: string;
  openingHours: string;
  /** Luftlinje fra brukeren – i en ekte app fra posisjonstjeneste. */
  distanceKm: number;
  /** Om butikken har en publisert BIM-plan i rendo. */
  hasMap: boolean;
  areaM2?: number;
  /** Tjenester i butikken, f.eks. vareutlevering. */
  services?: string[];
}

export interface Department {
  id: string;
  name: string;
}

/** Hvilken retning varefronten på en reol peker – altså hvor kunden står. */
export type Facing = 'north' | 'south' | 'east' | 'west';

export type FixtureType =
  | 'gondola'
  | 'wall'
  | 'cooler'
  | 'freezer'
  | 'island'
  | 'checkout'
  | 'service';

/** En reolseksjon: den minste enheten et produkt plasseres i. */
export interface Fixture extends Rect {
  id: string;
  /** Seksjonskode slik den er merket fysisk i butikken, f.eks. «G3-04». */
  code: string;
  type: FixtureType;
  departmentId: string;
  /** Navn på gangen kunden står i når varen plukkes, f.eks. «Gang 3». */
  aisle: string;
  facing: Facing;
  /** Total høyde på reolen. */
  heightCm: number;
  /** Antall hyllenivåer, nummerert 1 (nederst) til `levels` (øverst). */
  levels: number;
}

/** Planogram-oppføring: hvor en vare står i en gitt reolseksjon. */
export interface Placement {
  fixtureId: string;
  /** 1 = nederste hylle. */
  level: number;
  /** Hyllens høyde over gulv. */
  heightCm: number;
  /** Antall fronter (bredde i planogrammet). */
  facings: number;
  /** Avstand fra seksjonens venstre kant, i cm. */
  offsetCm: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  ean: string;
  price: number;
  /** Prisenhet, f.eks. «stk», «kg», «l». */
  unit: string;
  departmentId: string;
  placement: Placement;
  stock: number;
  /** Ekstra søkeord (synonymer, kategori). */
  keywords: string[];
  /**
   * Produktfoto. Fylles av bildekilden når den finnes – legg filer i
   * `src/assets/produkter/` med EAN eller varenavn som filnavn. Uten bilde
   * tegner appen emballasjen som strek i stedet.
   */
  imageUrl?: string;
}

export interface Entrance {
  id: string;
  name: string;
  position: Vec2;
}

export interface Landmark {
  id: string;
  name: string;
  position: Vec2;
}

/** Disker foran i butikken: kasser, kundeservice og vareutlevering. */
export type CounterKind = 'checkout' | 'pickup' | 'service';

export interface Checkout extends Rect {
  id: string;
  name: string;
  kind: CounterKind;
}

export interface StorePlan {
  storeId: string;
  /**
   * Ytterveggen som en lukket polygon. Butikker er sjelden rektangulære – de
   * har avskårne hjørner, innhugg for tekniske rom og fremspring mot inngangen.
   */
  outline: Vec2[];
  /** Omsluttende mål, brukt til innramming av kartet. */
  width: number;
  depth: number;
  /** Vegghøyde, brukt i 3D. */
  wallHeightCm: number;
  departments: Department[];
  fixtures: Fixture[];
  checkouts: Checkout[];
  entrances: Entrance[];
  landmarks: Landmark[];
}
