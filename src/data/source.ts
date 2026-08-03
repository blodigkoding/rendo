import type { Product, Store, StorePlan } from './types';

/**
 * Datagrensesnittet appen snakker med. UI-et kjenner bare dette – ikke hvor
 * dataene faktisk kommer fra.
 *
 * I dag er implementasjonen `mockSource`. En Nordic BIM-adapter (se
 * `nordicBim.ts`) kan plugges inn uten at noe i UI-et endres, så lenge den
 * oversetter fra deres modell til typene i `types.ts`.
 */
export interface RetailDataSource {
  readonly name: string;
  searchStores(query: string): Promise<Store[]>;
  getStore(storeId: string): Promise<Store | null>;
  getStorePlan(storeId: string): Promise<StorePlan | null>;
  searchProducts(storeId: string, query: string, limit?: number): Promise<Product[]>;
  getProduct(storeId: string, productId: string): Promise<Product | null>;
  /** Alle produkter som står i en gitt reolseksjon. */
  getProductsInFixture(storeId: string, fixtureId: string): Promise<Product[]>;
}
