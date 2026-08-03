import type { Product } from '../data/types';

/**
 * Produktbilder tegnet som strek: emballasjetypen varen faktisk kommer i.
 * Ingen fotografier – det holder stilen ren, virker uten nett, og gjør at
 * varen er lett å kjenne igjen i hylla.
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
  | 'roll';

/** Ord som avgjør emballasjen, sjekket i rekkefølge. */
const RULES: Array<[PackageShape, RegExp]> = [
  ['eggs', /\begg\b/i],
  ['roll', /toalettpapir|tørkerull/i],
  ['tube', /tannkrem/i],
  ['cheese', /brunost|jarlsberg|\bost\b/i],
  ['bread', /brød|loff|rundstykker|baguette/i],
  ['tray', /filet|kjøttdeig|koteletter|bacon|reker|laks|kylling/i],
  ['carton', /melk|juice|fløte|most|barnegrøt/i],
  ['can', /hakkede tomater|tomatpuré|kokosmelk|tunfisk|energidrikk|mais/i],
  ['jar', /syltetøy|majones|peanøttsmør|honning|leverpostei|kaviar|olivenolje|ketchup/i],
  ['bottle', /farris|cola|solo|shampoo|dusjsåpe|oppvasksåpe|vaskemiddel|deodorant|olje/i],
  ['tub', /yoghurt|iskrem|smør|kesam/i],
  ['bag', /potetgull|saltstenger|popcorn|seigmenn|ris\b|mel\b|sukker|kaffe|bleier|fôr|kattesand|frites|bær|erter|gulrot|poteter/i],
  ['box', /cornflakes|havregryn|pizza|fiskepinner|spaghetti|penne|\bte\b|plaster|søppelsekker|lefser|sjokolade|croissant|kanelboller|våtservietter|folie/i],
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
};

export function packageShape(product: Product): PackageShape {
  const haystack = `${product.name} ${product.keywords.join(' ')}`;
  for (const [shape, pattern] of RULES) {
    if (pattern.test(haystack)) return shape;
  }
  return DEPARTMENT_FALLBACK[product.departmentId] ?? 'box';
}

/** Alle figurene tegnes i et 32 × 32-rutenett med samme streketykkelse. */
const SHAPES: Record<PackageShape, React.ReactNode> = {
  bottle: (
    <>
      <path d="M13 4h6v3.4c0 1.4 3 3 3 6.2V27a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1V13.6c0-3.2 3-4.8 3-6.2V4z" />
      <path d="M10 17h12" />
    </>
  ),
  carton: (
    <>
      <path d="M8 12h16v15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V12z" />
      <path d="M8 12l3.5-7h9L24 12" />
      <path d="M11.5 5l4.5 7 4.5-7" />
    </>
  ),
  can: (
    <>
      <path d="M9 8.5h14V26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V8.5z" />
      <ellipse cx="16" cy="8.5" rx="7" ry="2.6" />
      <path d="M9 13h14M9 22h14" />
    </>
  ),
  jar: (
    <>
      <path d="M11 4h10v3H11z" />
      <path d="M9.5 8h13v18a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V8z" />
      <path d="M9.5 14h13" />
    </>
  ),
  bag: (
    <>
      <path d="M9 10c2-1.5 4-3 7-3s5 1.5 7 3v16a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V10z" />
      <path d="M12 4.5l4 2.5 4-2.5" />
      <path d="M9 16h14" />
    </>
  ),
  box: (
    <>
      <path d="M8.5 6h15v22h-15z" />
      <path d="M8.5 12h15" />
      <path d="M13 6v6M19 6v6" />
    </>
  ),
  tube: (
    <>
      <path d="M13 4h6v2.5h-6z" />
      <path d="M12 7h8l2 15.5c.2 3-1.6 5.5-6 5.5s-6.2-2.5-6-5.5L12 7z" />
      <path d="M12.6 12h6.8" />
    </>
  ),
  tub: (
    <>
      <path d="M7.5 9h17l-1.8 17a2 2 0 0 1-2 2h-9.4a2 2 0 0 1-2-2L7.5 9z" />
      <ellipse cx="16" cy="9" rx="8.5" ry="2.6" />
      <path d="M8.6 18h14.8" />
    </>
  ),
  produce: (
    <>
      <path d="M16 9c3-3 8-2.5 9 1.5.8 3.4-1.4 8.5-4 12-1.6 2.2-3.3 3-5 3s-3.4-.8-5-3c-2.6-3.5-4.8-8.6-4-12C8 6.5 13 6 16 9z" />
      <path d="M16 9V4.5" />
      <path d="M16 6.5c2-1.5 4-1.5 5.5-2-.3 2-1.7 3.3-3.5 3.7" />
    </>
  ),
  bread: (
    <>
      <path d="M5.5 14c0-3.6 4.7-6.5 10.5-6.5S26.5 10.4 26.5 14v10a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2V14z" />
      <path d="M10 8.5V26M16 7.6V26M22 8.5V26" />
    </>
  ),
  tray: (
    <>
      <path d="M5.5 11h21l-1.6 14a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L5.5 11z" />
      <path d="M5.5 11l2.2-4.4a2 2 0 0 1 1.8-1.1h13a2 2 0 0 1 1.8 1.1L26.5 11" />
      <path d="M11 16.5c1.6-1.6 3.4-1.6 5 0s3.4 1.6 5 0" />
    </>
  ),
  cheese: (
    <>
      <path d="M4.5 22.5 25 7.5c1.6-1.2 3 .3 2.4 1.9l-6 15.2a2 2 0 0 1-1.9 1.3H5.6c-1.6 0-2.3-1.7-1.1-2.4z" />
      <circle cx="12.5" cy="19.5" r="1.6" />
      <circle cx="19" cy="16.5" r="1.2" />
    </>
  ),
  eggs: (
    <>
      <path d="M4.5 18h23v6a2 2 0 0 1-2 2h-19a2 2 0 0 1-2-2v-6z" />
      <path d="M4.5 18c0-3 2.2-5 4.6-5s4.6 2 4.6 5M13.7 18c0-3 2.2-5 4.6-5s4.6 2 4.6 5" />
      <path d="M22.9 18c0-3 2-5 4.6-5" />
    </>
  ),
  roll: (
    <>
      <path d="M8 8.5h13v19H8z" />
      <ellipse cx="8" cy="18" rx="3.5" ry="9.5" />
      <ellipse cx="21" cy="18" rx="3.5" ry="9.5" />
      <ellipse cx="21" cy="18" rx="1.2" ry="3.4" />
    </>
  ),
};

interface Props {
  product: Product;
  size?: number;
}

export function ProductArt({ product, size = 34 }: Props) {
  const shape = packageShape(product);
  return (
    <svg
      className="art"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.15}
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label={`Illustrasjon av ${product.name}`}
    >
      {SHAPES[shape]}
    </svg>
  );
}
