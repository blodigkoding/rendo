/**
 * Fargene i kartet og modellen.
 *
 * Butikken tegnes som en hvit modell på en salviegrønn flate, med varme
 * treaksenter og myke skygger – samme uttrykk i planen som i 3D, slik at det er
 * den samme butikken man ser fra to sider.
 */
export const MAP_PALETTE = {
  /** Flaten rundt butikken – lys og nøytral, ikke farget. */
  backdrop: '#f1f0ec',
  /** Salviegrønn brukes bare som detalj: inngang, planter, aksenter. */
  sage: '#8fa389',
  sageSoft: '#c3cebe',
  /** Selve gulvplaten. */
  floor: '#ffffff',
  floorEdge: '#e4e1d9',
  /** Innredning. */
  shelf: '#e5e2da',
  shelfDim: '#eeece6',
  shelfDept: '#e0e3db',
  shelfLine: '#cbc8c0',
  /** Kjøl og frys: kjølige, metalliske toner så de skiller seg fra tørrvarer. */
  cold: '#dde5e7',
  coldDim: '#eaeff0',
  coldDept: '#d3e0e2',
  coldEdge: '#c8d3d5',
  coldTrim: '#aebdc1',
  /** Tre: benkeplater, hyllekanter, disker. */
  wood: '#c9a97b',
  woodShade: '#ab8a5d',
  /**
   * Skiltfarger over avdelingene. Dempede, men tydelig forskjellige – det er de
   * som gjør at man ser hvor en avdeling slutter og den neste begynner.
   */
  signs: [
    '#4a6b8a',
    '#7d9a6d',
    '#b08050',
    '#9a6b7d',
    '#6d8a8a',
    '#8a7a5a',
    '#7a7a95',
    '#a0705c',
    '#5f8577',
    '#94825f',
  ],
  /** Mørk detalj – skrift, rute, valgt vare. */
  ink: '#2f3a34',
  inkSoft: '#5c665e',
} as const;
