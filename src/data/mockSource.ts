import type { RetailDataSource } from './source';
import type { Chain, Product } from './types';
import { CHAINS, CHAIN_BY_ID } from './mock/chains';
import { PLANS } from './mock/plans';
import { DEMO_STORES, PRODUCTS_BY_STORE } from './mock/stores';
import { scoreMatch, type SearchField } from '../lib/search';

/** Liten kunstig forsinkelse, så UI-et må håndtere lasting som mot ekte API. */
const delay = <T,>(value: T, ms = 80): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Butikk-id-en kommer fra adressefeltet. Slår vi den rett opp i et objekt, kan
 * «__proto__» og «constructor» gi treff som ikke er butikker – derfor Map.
 */
const PRODUCTS = new Map(Object.entries(PRODUCTS_BY_STORE));
const PLAN_BY_ID = new Map(Object.entries(PLANS));

const productsIn = (storeId: string) => PRODUCTS.get(storeId) ?? [];

function searchFields(storeId: string, product: Product): SearchField[] {
  const plan = PLAN_BY_ID.get(storeId);
  const fixture = plan?.fixtures.find((f) => f.id === product.placement.fixtureId);
  const department = plan?.departments.find((d) => d.id === product.departmentId);
  return [
    { value: product.name, weight: 1 },
    { value: product.keywords.join(' '), weight: 0.95 },
    { value: product.brand, weight: 0.7 },
    { value: department?.name ?? '', weight: 0.55 },
    { value: product.ean, weight: 0.9 },
    { value: fixture?.code ?? '', weight: 0.9 },
  ];
}

export const mockSource: RetailDataSource = {
  name: 'mock',

  async listChains(): Promise<Chain[]> {
    return delay(CHAINS, 10);
  },

  async searchStores(query) {
    if (!query.trim()) {
      return delay([...DEMO_STORES].sort((a, b) => a.distanceKm - b.distanceKm));
    }
    const scored = DEMO_STORES.map((store) => ({
      store,
      score: scoreMatch(query, [
        { value: store.name, weight: 1 },
        { value: store.chain, weight: 0.95 },
        { value: store.city, weight: 0.9 },
        { value: store.address, weight: 0.7 },
        { value: store.postalCode, weight: 0.8 },
      ]),
    }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.store.distanceKm - b.store.distanceKm)
      .map((row) => row.store);
    return delay(scored);
  },

  async getStore(storeId) {
    return delay(DEMO_STORES.find((s) => s.id === storeId) ?? null, 30);
  },

  async getChain(chainId) {
    return delay(CHAIN_BY_ID.get(chainId) ?? null, 10);
  },

  async getStorePlan(storeId) {
    return delay(PLAN_BY_ID.get(storeId) ?? null, 110);
  },

  async searchProducts(storeId, query, limit = 20) {
    const q = query.trim();
    if (!q) return delay([]);
    const scored = productsIn(storeId)
      .map((product) => ({ product, score: scoreMatch(q, searchFields(storeId, product)) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'no'))
      .slice(0, limit)
      .map((row) => row.product);
    return delay(scored, 50);
  },

  async getProduct(storeId, productId) {
    return delay(productsIn(storeId).find((p) => p.id === productId) ?? null, 20);
  },

  async getProductsInFixture(storeId, fixtureId) {
    return delay(
      productsIn(storeId).filter((p) => p.placement.fixtureId === fixtureId),
      20,
    );
  },

  async getProductsInDepartment(storeId, departmentId) {
    return delay(
      productsIn(storeId)
        .filter((p) => p.departmentId === departmentId)
        .sort((a, b) => a.name.localeCompare(b.name, 'no')),
      50,
    );
  },
};
