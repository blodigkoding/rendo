/**
 * Kjedelogoer.
 *
 * Vi kan ikke hente kjedenes varemerker selv. Legges det filer i
 * `src/assets/logoer/` med kjede-id som filnavn, plukkes de opp herfra.
 * Uten fil tegner appen et navnetrekk i stedet – se `ChainLogo`.
 */
const FILES = import.meta.glob('../assets/logoer/*.{svg,png,webp,jpg,jpeg,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const BY_ID = new Map<string, string>();
for (const [path, url] of Object.entries(FILES)) {
  const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
  BY_ID.set(name.toLowerCase(), url);
}

export function logoFor(chainId: string): string | undefined {
  return BY_ID.get(chainId.toLowerCase());
}
