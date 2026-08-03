import type { RetailDataSource } from './source';
import type { Product, Store, StorePlan } from './types';
import { DEMO_PLAN, DEPARTMENT_NAME } from './mock/plan';
import { DEMO_PRODUCTS } from './mock/products';
import { DEMO_STORES } from './mock/stores';
import { scoreMatch } from '../lib/search';

/** Liten kunstig forsinkelse, så UI-et må håndtere lasting som mot ekte API. */
const delay = <T,>(value: T, ms = 90): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const fixtureById = new Map(DEMO_PLAN.fixtures.map((f) => [f.id, f]));

function productFields(product: Product): string[] {
  const fixture = fixtureById.get(product.placement.fixtureId);
  return [
    product.name,
    product.brand,
    DEPARTMENT_NAME.get(product.departmentId) ?? '',
    product.keywords.join(' '),
    product.ean,
    fixture?.code ?? '',
  ];
}

export const mockSource: RetailDataSource = {
  name: 'mock',

  async searchStores(query) {
    if (!query.trim()) {
      return delay([...DEMO_STORES].sort((a, b) => a.distanceKm - b.distanceKm));
    }
    const scored = DEMO_STORES.map((store) => ({
      store,
      score: scoreMatch(query, [store.name, store.city, store.address, store.chain, store.postalCode]),
    }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.store.distanceKm - b.store.distanceKm)
      .map((row) => row.store);
    return delay(scored);
  },

  async getStore(storeId) {
    return delay(DEMO_STORES.find((s) => s.id === storeId) ?? null, 40);
  },

  async getStorePlan(storeId): Promise<StorePlan | null> {
    return delay(DEMO_PLAN.storeId === storeId ? DEMO_PLAN : null, 140);
  },

  async searchProducts(storeId, query, limit = 12) {
    if (DEMO_PLAN.storeId !== storeId) return delay([]);
    const q = query.trim();
    if (!q) return delay([]);
    const scored = DEMO_PRODUCTS.map((product) => ({
      product,
      score: scoreMatch(q, productFields(product)),
    }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'no'))
      .slice(0, limit)
      .map((row) => row.product);
    return delay(scored, 60);
  },

  async getProduct(storeId, productId) {
    if (DEMO_PLAN.storeId !== storeId) return delay(null);
    return delay(DEMO_PRODUCTS.find((p) => p.id === productId) ?? null, 30);
  },

  async getProductsInFixture(storeId, fixtureId) {
    if (DEMO_PLAN.storeId !== storeId) return delay([]);
    return delay(
      DEMO_PRODUCTS.filter((p) => p.placement.fixtureId === fixtureId),
      30,
    );
  },
};

export type { Store };
