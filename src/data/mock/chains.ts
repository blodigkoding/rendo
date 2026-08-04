import type { Chain } from '../types';

/**
 * Kjedene i demoen. Navnetrekkene er satt i tekst, ikke ekte logofiler – de
 * byttes mot kjedenes egne logoer når vi har lov til å bruke dem.
 */
export const CHAINS: Chain[] = [
  {
    id: 'rema',
    name: 'REMA 1000',
    accent: '#0d3b8f',
    onAccent: '#ffffff',
    wordmark: { text: 'REMA 1000', letterSpacing: '0.02em', weight: 700 },
  },
  {
    id: 'extra',
    name: 'Coop Extra',
    accent: '#d8232a',
    onAccent: '#ffffff',
    wordmark: { text: 'EXTRA', letterSpacing: '-0.03em', weight: 800, italic: true },
  },
  {
    id: 'europris',
    name: 'Europris',
    accent: '#e2001a',
    onAccent: '#ffffff',
    wordmark: { text: 'EUROPRIS', letterSpacing: '0.01em', weight: 800 },
  },
  {
    id: 'biltema',
    name: 'Biltema',
    accent: '#0a3d7c',
    onAccent: '#ffffff',
    wordmark: { text: 'BILTEMA', letterSpacing: '0.02em', weight: 800 },
  },
  {
    id: 'clas-ohlson',
    name: 'Clas Ohlson',
    accent: '#0f4c8a',
    onAccent: '#ffffff',
    wordmark: { text: 'Clas Ohlson', letterSpacing: '-0.01em', weight: 700 },
  },
];

export const CHAIN_BY_ID = new Map(CHAINS.map((c) => [c.id, c]));
