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
  /** Mørk detalj – skrift, rute, valgt vare. */
  ink: '#2f3a34',
  inkSoft: '#5c665e',
} as const;
