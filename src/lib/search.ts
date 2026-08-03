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

/**
 * Skår et treff. Høyere er bedre, 0 betyr ingen treff.
 * Vekten faller for hvert felt bakover i lista.
 */
export function scoreMatch(query: string, fields: string[]): number {
  const q = normalize(query);
  if (!q) return 0;
  const terms = q.split(' ');

  let total = 0;
  for (const term of terms) {
    let best = 0;
    fields.forEach((field, fieldIndex) => {
      const value = normalize(field);
      if (!value) return;
      const weight = 1 / (fieldIndex + 1);
      let score = 0;

      if (value === term) score = 100;
      else if (value.startsWith(term)) score = 70;
      else if (value.split(' ').some((word) => word.startsWith(term))) score = 50;
      else if (value.includes(term)) score = 25;

      best = Math.max(best, score * weight);
    });
    if (best === 0) return 0; // alle ord må gi treff
    total += best;
  }

  return total / terms.length;
}
