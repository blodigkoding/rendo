import type { Product } from '../data/types';

/**
 * Produktbilder.
 *
 * Vi har ingen fotokilde, så bildene tegnes: emballasjen varen faktisk kommer i,
 * med etikett og lokk i en farge som følger avdelingen. Det gir gjenkjennelige
 * bilder i lista uten nett, og byttes ut i det øyeblikket ekte foto legges i
 * `src/assets/produkter/` – se `ProductImage`.
 */

export type PackageShape =
  | 'bottle'
  | 'carton'
  | 'can'
  | 'jar'
  | 'bag'
  | 'box'
  | 'tube'
  | 'tub'
  | 'produce'
  | 'bread'
  | 'tray'
  | 'cheese'
  | 'eggs'
  | 'roll'
  | 'tool'
  | 'textile'
  | 'furniture';

/** Ord som avgjør emballasjen, sjekket i rekkefølge. */
const RULES: Array<[PackageShape, RegExp]> = [
  ['eggs', /\begg\b/i],
  ['roll', /toalettpapir|tørkerull|gardin|slange|kabel|tau/i],
  ['tube', /tannkrem|silikon|fugemasse/i],
  ['cheese', /brunost|jarlsberg|\bost\b/i],
  ['bread', /brød|loff|rundstykker|baguette/i],
  ['tray', /filet|kjøttdeig|koteletter|bacon|reker|laks|kylling/i],
  ['carton', /melk|juice|fløte|most|barnegrøt|kopipapir/i],
  ['can', /hakkede tomater|tomatpuré|kokosmelk|tunfisk|energidrikk|mais|maling|bunnstoff/i],
  ['jar', /syltetøy|majones|peanøttsmør|honning|leverpostei|kaviar|olivenolje|ketchup/i],
  ['bottle', /farris|cola|solo|shampoo|dusjsåpe|oppvasksåpe|vaskemiddel|deodorant|olje|frostvæske|såpe/i],
  ['tub', /yoghurt|iskrem|smør|kesam|jord|kull/i],
  ['tool', /hammer|skrutrekker|nøkkel|drill|sag|sliper|tang|målebånd|saks|rive|pumpe|multimeter|lykt|lampe/i],
  ['textile', /håndkle|sengesett|laken|pute|dyne|teppe|sokker|klut|matte|vest|sovepose|pledd/i],
  ['furniture', /bord|stol|sofa|seng|skap|kommode|hylle|reol|madrass|parasoll|benk/i],
  ['bag', /potetgull|saltstenger|popcorn|seigmenn|ris\b|mel\b|sukker|kaffe|bleier|fôr|kattesand|frites|bær|erter|gulrot|poteter|skruer|plugg|batterier/i],
  [
    'box',
    /cornflakes|havregryn|pizza|fiskepinner|spaghetti|penne|\bte\b|plaster|søppelsekker|lefser|sjokolade|croissant|kanelboller|våtservietter|folie|sett|kasse|spill|klosser/i,
  ],
];

const DEPARTMENT_FALLBACK: Record<string, PackageShape> = {
  frukt: 'produce',
  bakeri: 'bread',
  meieri: 'carton',
  kjott: 'tray',
  frys: 'box',
  drikke: 'bottle',
  torrvarer: 'bag',
  hermetikk: 'can',
  frokost: 'box',
  snacks: 'bag',
  husholdning: 'bottle',
  hygiene: 'bottle',
  baby: 'bag',
  dyr: 'bag',
  kjokken: 'box',
  interior: 'furniture',
  oppbevaring: 'box',
  rengjoring: 'bottle',
  personlig: 'bottle',
  godteri: 'bag',
  hage: 'tool',
  sesong: 'box',
  leker: 'box',
  kontor: 'box',
  elektro: 'tool',
  tekstil: 'textile',
  verktoy: 'tool',
  bilpleie: 'bottle',
  bildeler: 'box',
  elverktoy: 'tool',
  bygg: 'bag',
  fritid: 'box',
  bat: 'textile',
  sykkel: 'tool',
  senger: 'furniture',
  madrasser: 'furniture',
  sengetoy: 'textile',
  dyner: 'textile',
  mobler: 'furniture',
  bad: 'textile',
  gardiner: 'roll',
  tepper: 'textile',
  belysning: 'tool',
  utemobler: 'furniture',
  barnerom: 'furniture',
};

export function packageShape(product: Product): PackageShape {
  const haystack = `${product.name} ${product.keywords.join(' ')}`;
  for (const [shape, pattern] of RULES) {
    if (pattern.test(haystack)) return shape;
  }
  return DEPARTMENT_FALLBACK[product.departmentId] ?? 'box';
}

/** Dempede etikettfarger – de skal kle det hvite uttrykket, ikke rope. */
const LABEL_COLORS = [
  '#c9a97b',
  '#9fb0a2',
  '#a7b5c6',
  '#c3a49b',
  '#b6b295',
  '#a9a3b4',
  '#cdb493',
  '#9db0ad',
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Hver form har en silhuett som fylles, og noen detaljstreker oppå.
 * `label` er båndet på emballasjen, `cap` er lokket eller korken.
 */
interface ShapeSpec {
  body: string;
  details?: string;
  label?: { y: number; h: number };
  cap?: string;
}

const SHAPES: Record<PackageShape, ShapeSpec> = {
  bottle: {
    body: 'M13 4h6v3.4c0 1.4 3 3 3 6.2V27a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1V13.6c0-3.2 3-4.8 3-6.2V4z',
    cap: 'M12.6 3h6.8v3h-6.8z',
    label: { y: 15, h: 7 },
  },
  carton: {
    body: 'M8 12h16v15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V12z',
    cap: 'M8 12l3.5-7h9L24 12z',
    details: 'M11.5 5l4.5 7 4.5-7',
    label: { y: 16, h: 7 },
  },
  can: {
    body: 'M9 8.5h14V26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V8.5z',
    cap: 'M9 8.5a7 2.6 0 0 1 14 0 7 2.6 0 0 1-14 0z',
    label: { y: 13, h: 9 },
  },
  jar: {
    body: 'M9.5 8h13v18a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V8z',
    cap: 'M11 3.5h10V8H11z',
    label: { y: 14, h: 8 },
  },
  bag: {
    body: 'M9 10c2-1.5 4-3 7-3s5 1.5 7 3v16a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V10z',
    details: 'M12 4.5l4 2.5 4-2.5',
    label: { y: 15, h: 7 },
  },
  box: {
    body: 'M8.5 6h15v22h-15z',
    cap: 'M8.5 6h15v5h-15z',
    label: { y: 15, h: 8 },
  },
  tube: {
    body: 'M12 7h8l2 15.5c.2 3-1.6 5.5-6 5.5s-6.2-2.5-6-5.5L12 7z',
    cap: 'M13 3.5h6V7h-6z',
    label: { y: 13, h: 6 },
  },
  tub: {
    body: 'M7.5 9h17l-1.8 17a2 2 0 0 1-2 2h-9.4a2 2 0 0 1-2-2L7.5 9z',
    cap: 'M7.5 9a8.5 2.6 0 0 1 17 0 8.5 2.6 0 0 1-17 0z',
    label: { y: 15, h: 7 },
  },
  produce: {
    body: 'M16 9c3-3 8-2.5 9 1.5.8 3.4-1.4 8.5-4 12-1.6 2.2-3.3 3-5 3s-3.4-.8-5-3c-2.6-3.5-4.8-8.6-4-12C8 6.5 13 6 16 9z',
    details: 'M16 9V4.5M16 6.5c2-1.5 4-1.5 5.5-2-.3 2-1.7 3.3-3.5 3.7',
  },
  bread: {
    body: 'M5.5 14c0-3.6 4.7-6.5 10.5-6.5S26.5 10.4 26.5 14v10a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2V14z',
    details: 'M10 8.5V26M16 7.6V26M22 8.5V26',
  },
  tray: {
    body: 'M5.5 11h21l-1.6 14a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L5.5 11z',
    cap: 'M5.5 11l2.2-4.4a2 2 0 0 1 1.8-1.1h13a2 2 0 0 1 1.8 1.1L26.5 11z',
    details: 'M11 17.5c1.6-1.6 3.4-1.6 5 0s3.4 1.6 5 0',
  },
  cheese: {
    body: 'M4.5 22.5 25 7.5c1.6-1.2 3 .3 2.4 1.9l-6 15.2a2 2 0 0 1-1.9 1.3H5.6c-1.6 0-2.3-1.7-1.1-2.4z',
    details: 'M12.5 19.5a1.6 1.6 0 1 0 0-.01M19 16.5a1.2 1.2 0 1 0 0-.01',
  },
  eggs: {
    body: 'M4.5 18h23v6a2 2 0 0 1-2 2h-19a2 2 0 0 1-2-2v-6z',
    details: 'M4.5 18c0-3 2.2-5 4.6-5s4.6 2 4.6 5M13.7 18c0-3 2.2-5 4.6-5s4.6 2 4.6 5M22.9 18c0-3 2-5 4.6-5',
  },
  roll: {
    body: 'M8 8.5h13v19H8z',
    cap: 'M21 18a3.5 9.5 0 0 1 0 .01 3.5 9.5 0 0 1 0-.01z',
    details: 'M8 8.5a3.5 9.5 0 0 0 0 19M21 8.5a3.5 9.5 0 0 1 0 19',
  },
  tool: {
    body: 'M6 21.5l9.5-9.5-1.4-1.4a5.2 5.2 0 0 1 6.6-6.4l-3 3 2.8 2.8 3-3a5.2 5.2 0 0 1-6.4 6.6l-1.4-1.4L6.2 21.9a1.7 1.7 0 0 1-2.4-2.4z',
    details: 'M8 24l-2.4-2.4',
  },
  textile: {
    body: 'M5 9.5c3.5-2.5 7-3.5 11-3.5s7.5 1 11 3.5v13c0 2-1.4 3.5-3.4 3.5H8.4C6.4 26 5 24.5 5 22.5v-13z',
    details: 'M5 14.5c3.5-2 7-2.6 11-2.6s7.5.6 11 2.6M5 19.5c3.5-2 7-2.6 11-2.6s7.5.6 11 2.6',
  },
  furniture: {
    body: 'M5 12h22v8H5z',
    cap: 'M5 10.5h22V13H5z',
    details: 'M7.5 20v6M24.5 20v6',
  },
};

interface Props {
  product: Product;
  size?: number;
}

export function ProductArt({ product, size = 34 }: Props) {
  const shape = packageShape(product);
  const spec = SHAPES[shape];
  const seed = hash(product.departmentId + product.brand);
  const label = LABEL_COLORS[seed % LABEL_COLORS.length];
  const clipId = `art-${product.id}`;

  return (
    <svg
      className="art"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={`Illustrasjon av ${product.name}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={spec.body} />
        </clipPath>
      </defs>

      {/* selve emballasjen */}
      <path d={spec.body} fill="#f4f1eb" />

      <g clipPath={`url(#${clipId})`}>
        {/* skyggeside, så formen får volum */}
        <rect x="20" y="0" width="12" height="32" fill="#000" opacity="0.05" />
        {spec.label && (
          <>
            <rect x="0" y={spec.label.y} width="32" height={spec.label.h} fill={label} />
            {/* Merkenavnet på etiketten – det er det som gjør en pakke gjenkjennelig. */}
            <text
              x="16"
              y={spec.label.y + spec.label.h / 2 + 0.9}
              textAnchor="middle"
              fill="#fff"
              fontSize={spec.label.h > 7 ? 3 : 2.4}
              fontWeight="700"
              letterSpacing="0.1"
              opacity="0.9"
            >
              {product.brand.slice(0, 9)}
            </text>
            <rect
              x="6"
              y={spec.label.y + spec.label.h - 1.9}
              width="20"
              height="0.8"
              fill="#fff"
              opacity="0.5"
            />
          </>
        )}
        {spec.cap && <path d={spec.cap} fill={label} opacity="0.85" />}
      </g>

      <g fill="none" stroke="#2f3a34" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round">
        <path d={spec.body} />
        {spec.cap && <path d={spec.cap} />}
        {spec.details && <path d={spec.details} />}
      </g>
    </svg>
  );
}
