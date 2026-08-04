import type { Product, Store } from '../types';
import { buildAssortment } from './catalog';
import { GROCERY_CATALOG } from './catalogGrocery';
import { AUTO_CATALOG } from './catalogAuto';
import { HOME_CATALOG } from './catalogHome';
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
    id: 'st-clas-ohlson-ski',
    name: 'Clas Ohlson Ski',
    chainId: 'clas-ohlson',
    chain: 'Clas Ohlson',
    address: 'Ski storsenter, Jernbaneveien 6',
    postalCode: '1400',
    city: 'Ski',
    openingHours: '10–20 (10–18)',
    distanceKm: 8.4,
    hasMap: true,
    areaM2: 520,
  },
  {
    id: 'st-jysk-vinterbro',
    name: 'JYSK Vinterbro',
    chainId: 'jysk',
    chain: 'JYSK',
    address: 'Vinterbrosenteret, Nordreveien 4',
    postalCode: '1407',
    city: 'Vinterbro',
    openingHours: '10–20 (10–18)',
    distanceKm: 6.8,
    hasMap: true,
    areaM2: 1008,
    services: ['Vareutlevering', 'Klikk og hent'],
  },
  {
    id: 'st-biltema-vestby',
    name: 'Biltema Vestby',
    chainId: 'biltema',
    chain: 'Biltema',
    address: 'Verpetveien 40',
    postalCode: '1540',
    city: 'Vestby',
    openingHours: '08–20 (09–18)',
    distanceKm: 12.6,
    hasMap: true,
    areaM2: 1408,
    services: ['Vareutlevering'],
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
  'st-clas-ohlson-ski': buildAssortment(PLANS['st-clas-ohlson-ski'], VARIETY_CATALOG, {
    priceFactor: 1.35,
  }),
  'st-biltema-vestby': buildAssortment(PLANS['st-biltema-vestby'], AUTO_CATALOG, {
    priceFactor: 1,
  }),
  'st-jysk-vinterbro': buildAssortment(PLANS['st-jysk-vinterbro'], HOME_CATALOG, {
    priceFactor: 1,
  }),
};
