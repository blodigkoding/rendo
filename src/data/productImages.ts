import { normalize } from '../lib/search';

/**
 * Produktfoto.
 *
 * Vi har ingen bildekilde ennå. Denne modulen leser alt som ligger i
 * `src/assets/produkter/` og kobler det til varene automatisk, slik at det er
 * nok å slippe filene inn i mappa:
 *
 *   src/assets/produkter/7039172012865.webp   ← filnavn = EAN
 *   src/assets/produkter/filterkaffe-500-g.jpg ← eller filnavn = varenavn
 *
 * Varer uten bilde tegnes som strekillustrasjon av emballasjen i stedet.
 * Når vi får et bilde-API i stedet for filer, er det bare `imageFor` som endres.
 */

const FILES = import.meta.glob('../assets/produkter/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const slug = (value: string) => normalize(value).replace(/\s+/g, '-');

const BY_KEY = new Map<string, string>();
for (const [path, url] of Object.entries(FILES)) {
  const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
  BY_KEY.set(slug(name), url);
}

export function imageFor(ean: string, name: string): string | undefined {
  return BY_KEY.get(slug(ean)) ?? BY_KEY.get(slug(name));
}

export const hasProductImages = BY_KEY.size > 0;
