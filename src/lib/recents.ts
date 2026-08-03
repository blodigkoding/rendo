/** Siste søk, lagret lokalt slik at man slipper å skrive det samme hver gang. */

const KEY = 'rendo:recent-searches';
const MAX = 6;

export function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecent(term: string): string[] {
  const value = term.trim();
  if (!value) return readRecents();
  const next = [value, ...readRecents().filter((v) => v.toLowerCase() !== value.toLowerCase())].slice(
    0,
    MAX,
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Privat modus e.l. – da lever vi uten historikk.
  }
  return next;
}
