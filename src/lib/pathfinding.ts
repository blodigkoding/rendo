import type { Rect, StorePlan, Vec2 } from '../data/types';

/**
 * Ruting gjennom butikken.
 *
 * Planen rasteriseres til et rutenett der reoler, kasser og en sone langs
 * veggene er blokkert. A* finner korteste vei, og resultatet strammes opp med
 * «string pulling» slik at ruten blir få, lange linjer i stedet for trappetrinn.
 */

const CELL = 0.25;
/** Klaring rundt innredning, omtrent en halv skulderbredde. */
const CLEARANCE = 0.3;
/** Avstand vi holder fra ytterveggene. */
const WALL_MARGIN = 0.35;

export interface NavGrid {
  cell: number;
  cols: number;
  rows: number;
  blocked: Uint8Array;
}

function inflate(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, w: r.w + by * 2, d: r.d + by * 2 };
}

function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.d;
}

export function buildNavGrid(plan: StorePlan): NavGrid {
  const cols = Math.ceil(plan.width / CELL);
  const rows = Math.ceil(plan.depth / CELL);
  const blocked = new Uint8Array(cols * rows);

  const obstacles: Rect[] = [
    ...plan.fixtures.map((f) => inflate(f, CLEARANCE)),
    ...plan.checkouts.map((c) => inflate(c, CLEARANCE)),
  ];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * CELL;
      const y = (j + 0.5) * CELL;
      const outside =
        x < WALL_MARGIN || y < WALL_MARGIN || x > plan.width - WALL_MARGIN || y > plan.depth - WALL_MARGIN;
      const hit = outside || obstacles.some((r) => inRect(r, x, y));
      if (hit) blocked[j * cols + i] = 1;
    }
  }

  return { cell: CELL, cols, rows, blocked };
}

const toCell = (grid: NavGrid, p: Vec2) => ({
  i: Math.min(grid.cols - 1, Math.max(0, Math.floor(p.x / grid.cell))),
  j: Math.min(grid.rows - 1, Math.max(0, Math.floor(p.y / grid.cell))),
});

const toWorld = (grid: NavGrid, index: number): Vec2 => ({
  x: ((index % grid.cols) + 0.5) * grid.cell,
  y: (Math.floor(index / grid.cols) + 0.5) * grid.cell,
});

export function isWalkable(grid: NavGrid, p: Vec2): boolean {
  const { i, j } = toCell(grid, p);
  return grid.blocked[j * grid.cols + i] === 0;
}

/** Nærmeste frie rute – brukes når brukeren treffer en hylle med fingeren. */
function nearestFree(grid: NavGrid, index: number): number | null {
  if (grid.blocked[index] === 0) return index;
  const seen = new Set<number>([index]);
  let frontier = [index];
  for (let step = 0; step < 40 && frontier.length; step++) {
    const next: number[] = [];
    for (const current of frontier) {
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
        const n = nj * grid.cols + ni;
        if (seen.has(n)) continue;
        seen.add(n);
        if (grid.blocked[n] === 0) return n;
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

/** Binærheap – A* på ~17 000 ruter går fint uten noe tyngre. */
class MinHeap {
  private items: number[] = [];
  private keys: number[] = [];

  push(item: number, key: number) {
    this.items.push(item);
    this.keys.push(key);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= this.keys[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const lastItem = this.items.pop()!;
    const lastKey = this.keys.pop()!;
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.keys[0] = lastKey;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.keys.length && this.keys[l] < this.keys[smallest]) smallest = l;
        if (r < this.keys.length && this.keys[r] < this.keys[smallest]) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  get size() {
    return this.items.length;
  }

  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
  }
}

const SQRT2 = Math.SQRT2;

function astar(grid: NavGrid, startIndex: number, goalIndex: number): number[] | null {
  const total = grid.cols * grid.rows;
  const gScore = new Float32Array(total).fill(Infinity);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const open = new MinHeap();

  const gx = goalIndex % grid.cols;
  const gy = Math.floor(goalIndex / grid.cols);
  const heuristic = (index: number) => {
    const dx = Math.abs((index % grid.cols) - gx);
    const dy = Math.abs(Math.floor(index / grid.cols) - gy);
    return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy);
  };

  gScore[startIndex] = 0;
  open.push(startIndex, heuristic(startIndex));

  while (open.size > 0) {
    const current = open.pop()!;
    if (current === goalIndex) {
      const path: number[] = [];
      for (let node = current; node !== -1; node = cameFrom[node]) path.push(node);
      return path.reverse();
    }
    if (closed[current]) continue;
    closed[current] = 1;

    const ci = current % grid.cols;
    const cj = Math.floor(current / grid.cols);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ni = ci + dx;
        const nj = cj + dy;
        if (ni < 0 || nj < 0 || ni >= grid.cols || nj >= grid.rows) continue;
        const neighbour = nj * grid.cols + ni;
        if (grid.blocked[neighbour]) continue;
        // Ikke skjær hjørner diagonalt.
        if (dx !== 0 && dy !== 0) {
          if (grid.blocked[cj * grid.cols + ni] || grid.blocked[nj * grid.cols + ci]) continue;
        }
        const step = dx !== 0 && dy !== 0 ? SQRT2 : 1;
        const tentative = gScore[current] + step;
        if (tentative < gScore[neighbour]) {
          gScore[neighbour] = tentative;
          cameFrom[neighbour] = current;
          open.push(neighbour, tentative + heuristic(neighbour));
        }
      }
    }
  }

  return null;
}

/** Fri sikt mellom to punkter? Sjekker langs linja med halv rutestørrelse. */
export function hasLineOfSight(grid: NavGrid, a: Vec2, b: Vec2): boolean {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.ceil(dist / (grid.cell * 0.5));
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 0 : s / steps;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const { i, j } = toCell(grid, p);
    if (grid.blocked[j * grid.cols + i]) return false;
  }
  return true;
}

function smooth(grid: NavGrid, points: Vec2[]): Vec2[] {
  if (points.length <= 2) return points;
  const result: Vec2[] = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let furthest = anchor + 1;
    for (let candidate = points.length - 1; candidate > anchor + 1; candidate--) {
      if (hasLineOfSight(grid, points[anchor], points[candidate])) {
        furthest = candidate;
        break;
      }
    }
    result.push(points[furthest]);
    anchor = furthest;
  }
  return result;
}

export interface RouteResult {
  points: Vec2[];
  /** Faktisk startpunkt (kan være flyttet ut av en hylle). */
  start: Vec2;
  goal: Vec2;
}

export function findRoute(grid: NavGrid, from: Vec2, to: Vec2): RouteResult | null {
  const startCell = toCell(grid, from);
  const goalCell = toCell(grid, to);
  const startIndex = nearestFree(grid, startCell.j * grid.cols + startCell.i);
  const goalIndex = nearestFree(grid, goalCell.j * grid.cols + goalCell.i);
  if (startIndex === null || goalIndex === null) return null;

  const cells = astar(grid, startIndex, goalIndex);
  if (!cells) return null;

  const raw = cells.map((index) => toWorld(grid, index));
  const start = isWalkable(grid, from) ? from : toWorld(grid, startIndex);
  const goal = isWalkable(grid, to) ? to : toWorld(grid, goalIndex);

  // Erstatt første/siste rutepunkt med de faktiske punktene når det er fri sikt.
  if (hasLineOfSight(grid, start, raw[0])) raw[0] = start;
  const last = raw.length - 1;
  if (hasLineOfSight(grid, goal, raw[last])) raw[last] = goal;

  return { points: smooth(grid, raw), start, goal };
}
