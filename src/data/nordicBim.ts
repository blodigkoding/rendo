import type { RetailDataSource } from './source';

/**
 * Adapter mot Nordic BIM Retail Solution.
 *
 * Retail Solution består av Smart BIM Objects i Archicad, Retail Web Viewer
 * (butikkdatabase med kart og status) og en planogram-modul med datostyrt
 * produktplassering. Kilden vår trenger tre ting derfra:
 *
 *   1. Butikkregister              → `Store`
 *   2. Plan/geometri per butikk    → `StorePlan` (reoler, kasser, innganger)
 *   3. Planogram per butikk        → `Product.placement`
 *
 * Det finnes ingen offentlig dokumentert API i dag. Når vi får tilgang
 * (REST-endepunkt, eller eksport av IFC/glTF + planogram som JSON), er det bare
 * `toStore` / `toStorePlan` / `toProduct` under som må skrives – resten av
 * appen er allerede uavhengig av kilden.
 */

export interface NordicBimConfig {
  baseUrl: string;
  apiKey: string;
  /** Kundens/kjedens id i Retail Web Viewer. */
  tenantId: string;
}

export function createNordicBimSource(config: NordicBimConfig): RetailDataSource {
  const notImplemented = (method: string) => async (): Promise<never> => {
    throw new Error(
      `Nordic BIM-adapteren er ikke koblet opp ennå (${method}). ` +
        `Konfigurert mot ${config.baseUrl} for tenant ${config.tenantId}.`,
    );
  };

  return {
    name: 'nordic-bim',
    searchStores: notImplemented('searchStores'),
    getStore: notImplemented('getStore'),
    getStorePlan: notImplemented('getStorePlan'),
    searchProducts: notImplemented('searchProducts'),
    getProduct: notImplemented('getProduct'),
    getProductsInFixture: notImplemented('getProductsInFixture'),
  };
}
