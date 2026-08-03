/**
 * Lettvekts søk med norsk-vennlig normalisering. Ingen avhengigheter – ved
 * ekte datamengder byttes dette mot søk på server-siden.
 */

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    // fjerner kombinerende aksenttegn (é → e)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Et felt det søkes i, med hvor mye et treff der teller. */
export interface SearchField {
  value: string;
  weight: number;
}

/**
 * Skår et treff. Høyere er bedre, 0 betyr ingen treff. Alle søkeordene må gi
 * treff i minst ett felt.
 */
export function scoreMatch(query: string, fields: SearchField[]): number {
  const q = normalize(query);
  if (!q) return 0;
  const terms = q.split(' ');

  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const field of fields) {
      const value = normalize(field.value);
      if (!value) continue;
      let score = 0;

      if (value === term) score = 100;
      else if (value.startsWith(term)) score = 70;
      else if (value.split(' ').some((word) => word === term)) score = 90;
      else if (value.split(' ').some((word) => word.startsWith(term))) score = 55;
      else if (value.includes(term)) score = 30;

      best = Math.max(best, score * field.weight);
    }
    if (best === 0) return 0;
    total += best;
  }

  return total / terms.length;
}
