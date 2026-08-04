/**
 * Fargene i kartet og modellen.
 *
 * Butikken tegnes som en hvit modell på en salviegrønn flate, med varme
 * treaksenter og myke skygger – samme uttrykk i planen som i 3D, slik at det er
 * den samme butikken man ser fra to sider.
 */
export const MAP_PALETTE = {
  /** Bakgrunnen rundt butikken. */
  sage: '#aebaa8',
  sageShade: '#9dab97',
  /** Selve gulvplaten. */
  floor: '#f7f5f1',
  floorEdge: '#e6e3dc',
  /** Innredning. */
  shelf: '#e5e2da',
  shelfDim: '#eeece6',
  shelfDept: '#e0e3db',
  shelfLine: '#cbc8c0',
  /** Tre: benkeplater, hyllekanter, disker. */
  wood: '#c9a97b',
  woodShade: '#ab8a5d',
  /** Mørk detalj – skrift, rute, valgt vare. */
  ink: '#2f3a34',
  inkSoft: '#5c665e',
} as const;
