import type { Fixture, Product, StorePlan } from '../types';
import { imageFor } from '../productImages';

/** En vare slik den står i en katalog, før den plasseres i en butikk. */
export interface CatalogItem {
  name: string;
  brand: string;
  price: number;
  unit: string;
  dept: string;
  keywords?: string[];
}

/**
 * Sorterer en katalog inn i en annen kjedes avdelinger. To butikker kan selge
 * mye av det samme og likevel dele det opp helt ulikt: Europris har fjorten
 * avdelinger, Clas Ohlson fem. Varer som ikke hører hjemme i den nye butikken
 * utelates.
 */
export function remapCatalog(
  catalog: CatalogItem[],
  departments: Record<string, string | null>,
): CatalogItem[] {
  const map = new Map(Object.entries(departments));
  const out: CatalogItem[] = [];
  for (const item of catalog) {
    const dept = map.get(item.dept);
    if (dept) out.push({ ...item, dept });
  }
  return out;
}

/** Deterministisk hash – gir samme hylleplassering mellom økter. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function shelfHeightCm(fixture: Fixture, level: number): number {
  const bottom = 20;
  const spacing = (fixture.heightCm - bottom) / fixture.levels;
  return Math.round((bottom + (level - 1) * spacing) / 5) * 5;
}

export interface AssortmentOptions {
  /** Prisnivå i forhold til katalogen – lavpris ligger under 1. */
  priceFactor: number;
}

/**
 * Plasserer en katalog i en butikkplan: hver vare får en reolseksjon i sin egen
 * avdeling, et hyllenivå og en posisjon i seksjonen.
 */
export function buildAssortment(
  plan: StorePlan,
  catalog: CatalogItem[],
  options: AssortmentOptions,
): Product[] {
  const byDept = new Map<string, Fixture[]>();
  for (const fixture of plan.fixtures) {
    const list = byDept.get(fixture.departmentId) ?? [];
    list.push(fixture);
    byDept.set(fixture.departmentId, list);
  }

  const counters = new Map<string, number>();
  const products: Product[] = [];

  catalog.forEach((item, index) => {
    const fixtures = byDept.get(item.dept);
    if (!fixtures || fixtures.length === 0) return;

    const n = counters.get(item.dept) ?? 0;
    counters.set(item.dept, n + 1);

    const fixture = fixtures[(n * 3) % fixtures.length];
    const seed = hash(`${plan.storeId}:${item.name}`);
    // Vekt mot midten av reolen – slik varer faktisk plasseres.
    const levelBias = [2, 3, 3, 4, 2, 4, 1, 5];
    const level = Math.min(fixture.levels, levelBias[seed % levelBias.length]);
    const ean = `70${String(3800000000 + (seed % 199999999)).slice(0, 11)}`;
    const price = Math.round(item.price * options.priceFactor * 10) / 10;

    products.push({
      id: `${plan.storeId}-pr-${String(index + 1).padStart(3, '0')}`,
      name: item.name,
      brand: item.brand,
      ean,
      price,
      unit: item.unit,
      departmentId: item.dept,
      stock: 4 + (seed % 40),
      keywords: item.keywords ?? [],
      imageUrl: imageFor(ean, item.name),
      placement: {
        fixtureId: fixture.id,
        level,
        heightCm: shelfHeightCm(fixture, level),
        facings: 2 + (seed % 4),
        offsetCm: 10 + (seed % 5) * 35,
      },
    });
  });

  return products;
}
