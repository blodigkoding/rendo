import type { Product, Store } from '../types';
import { buildAssortment } from './catalog';
import { GROCERY_CATALOG } from './catalogGrocery';
import { VARIETY_CATALOG } from './catalogVariety';
import { PLANS } from './plans';

/**
 * Butikkene i demoen: tre butikker i Ås. Adressene er plassholdere til vi
 * henter butikkregisteret fra kjedene.
 */
export const DEMO_STORES: Store[] = [
  {
    id: 'st-rema-as',
    name: 'REMA 1000 Ås',
    chainId: 'rema',
    chain: 'REMA 1000',
    address: 'Brekkeveien 15',
    postalCode: '1430',
    city: 'Ås',
    openingHours: '07–23 (08–21)',
    distanceKm: 0.4,
    hasMap: true,
    areaM2: 720,
  },
  {
    id: 'st-extra-as',
    name: 'Coop Extra Ås',
    chainId: 'extra',
    chain: 'Coop Extra',
    address: 'Moerveien 12',
    postalCode: '1430',
    city: 'Ås',
    openingHours: '07–23 (09–21)',
    distanceKm: 0.9,
    hasMap: true,
    areaM2: 1064,
  },
  {
    id: 'st-europris-as',
    name: 'Europris Ås',
    chainId: 'europris',
    chain: 'Europris',
    address: 'Langbakken 9',
    postalCode: '1430',
    city: 'Ås',
    openingHours: '09–20 (10–18)',
    distanceKm: 1.6,
    hasMap: true,
    areaM2: 884,
  },
];

export const PRODUCTS_BY_STORE: Record<string, Product[]> = {
  'st-rema-as': buildAssortment(PLANS['st-rema-as'], GROCERY_CATALOG, { priceFactor: 0.94 }),
  'st-extra-as': buildAssortment(PLANS['st-extra-as'], GROCERY_CATALOG, { priceFactor: 1 }),
  'st-europris-as': buildAssortment(PLANS['st-europris-as'], VARIETY_CATALOG, { priceFactor: 1 }),
};
