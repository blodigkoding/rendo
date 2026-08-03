import { mockSource } from './mockSource';
import type { RetailDataSource } from './source';

/**
 * Aktiv datakilde. Bytt denne til `createNordicBimSource({...})` når vi har
 * tilgang til Retail Solution – ingenting annet i appen trenger å endres.
 */
export const dataSource: RetailDataSource = mockSource;

export type { RetailDataSource };
