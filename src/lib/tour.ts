import type { Vec2 } from '../data/types';
import { cellIndex, findRoute, snapToWalkable, type NavGrid, type RouteResult } from './pathfinding';

/**
 * Rute innom flere varer.
 *
 * Å finne den korteste runden gjennom n punkter er handelsreisendes problem, så
 * vi gjør som folk gjør: start med nærmeste vare, og bytt om på rekkefølgen så
 * lenge det korter ned turen (2-opt). Med en handleliste på ti–tjue varer er det
 * raskt, og resultatet er i praksis optimalt.
 */

/** Avstand i ruter fra ett punkt til alle andre. Bredde-først, siden alle steg koster likt. */
function distanceField(grid: NavGrid, from: Vec2): Float32Array {
  const total = grid.cols * grid.rows;
  const dist = new Float32Array(total).fill(Infinity);
  const start = cellIndex(grid, from);
  if (grid.blocked[start]) return dist;

  dist[start] = 0;
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;

  while (head < tail) {
    const current = queue[head++];
    const ci = current % grid.cols;
    const cj = Math.floor(current / grid.cols);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ni = ci + dx;
      const nj = cj + dy;
      if (ni < 0 || nj < 0 || ni >= grid.cols || nj >= grid.rows) continue;
      const next = nj * grid.cols + ni;
      if (grid.blocked[next] || dist[next] !== Infinity) continue;
      dist[next] = dist[current] + 1;
      queue[tail++] = next;
    }
  }

  return dist;
}

export interface TourStop<T> {
  /** Punktet i gangen der varen plukkes. */
  point: Vec2;
  value: T;
}

export interface TourLeg<T> {
  route: RouteResult;
  stop: TourStop<T>;
}

export interface Tour<T> {
  /** Én delrute per stopp, i den rekkefølgen man bør gå. */
  legs: Array<TourLeg<T>>;
  /** Hele ruten som én sammenhengende strek. */
  points: Vec2[];
  /** Stoppene i valgt rekkefølge. */
  order: Array<TourStop<T>>;
}

export function planTour<T>(grid: NavGrid, start: Vec2, stops: Array<TourStop<T>>): Tour<T> | null {
  if (stops.length === 0) return null;

  const snappedStart = snapToWalkable(grid, start);
  if (!snappedStart) return null;

  const points = stops.map((stop) => snapToWalkable(grid, stop.point) ?? stop.point);
  const nodes = [snappedStart, ...points];
  const fields = nodes.map((node) => distanceField(grid, node));

  const cost = (a: number, b: number) => {
    const value = fields[a][cellIndex(grid, nodes[b])];
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER / 4;
  };

  // Nærmeste nabo fra startpunktet.
  const remaining = stops.map((_, i) => i + 1);
  const order: number[] = [];
  let current = 0;
  while (remaining.length > 0) {
    let bestAt = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (cost(current, remaining[i]) < cost(current, remaining[bestAt])) bestAt = i;
    }
    current = remaining[bestAt];
    order.push(current);
    remaining.splice(bestAt, 1);
  }

  // 2-opt: snu delstrekk så lenge det korter ned turen.
  const tourCost = (candidate: number[]) => {
    let total = cost(0, candidate[0]);
    for (let i = 1; i < candidate.length; i++) total += cost(candidate[i - 1], candidate[i]);
    return total;
  };

  let best = tourCost(order);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 40) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const candidate = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        const value = tourCost(candidate);
        if (value < best - 1e-6) {
          order.splice(0, order.length, ...candidate);
          best = value;
          improved = true;
        }
      }
    }
  }

  // Faktiske ruter mellom stoppene.
  const legs: Array<TourLeg<T>> = [];
  const line: Vec2[] = [];
  let from = snappedStart;

  for (const index of order) {
    const stop = stops[index - 1];
    const route = findRoute(grid, from, points[index - 1]);
    if (!route) return null;
    legs.push({ route, stop });
    line.push(...(line.length ? route.points.slice(1) : route.points));
    from = route.points[route.points.length - 1];
  }

  return { legs, points: line, order: order.map((index) => stops[index - 1]) };
}
