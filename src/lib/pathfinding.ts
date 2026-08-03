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

/** Bevegelse følger gangene: bare rett fram, aldri på skrå. */
const DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Hver sving koster like mye som å gå en meter ekstra. Det gir ruter med få,
 * lange strekk – slik man faktisk går i en butikk – i stedet for trappetrinn.
 */
const TURN_COST = 4;

/**
 * A* der tilstanden er (rute, retning inn i ruta). Retningen er en del av
 * tilstanden fordi svingekostnaden avhenger av hvordan man kom dit.
 */
function astar(grid: NavGrid, startIndex: number, goalIndex: number): number[] | null {
  const total = grid.cols * grid.rows;
  const states = total * DIRECTIONS.length;
  const gScore = new Float32Array(states).fill(Infinity);
  const cameFrom = new Int32Array(states).fill(-1);
  const closed = new Uint8Array(states);
  const open = new MinHeap();

  const gx = goalIndex % grid.cols;
  const gy = Math.floor(goalIndex / grid.cols);
  const heuristic = (cell: number) =>
    Math.abs((cell % grid.cols) - gx) + Math.abs(Math.floor(cell / grid.cols) - gy);

  for (let d = 0; d < DIRECTIONS.length; d++) {
    const state = startIndex * DIRECTIONS.length + d;
    gScore[state] = 0;
    open.push(state, heuristic(startIndex));
  }

  while (open.size > 0) {
    const current = open.pop()!;
    if (closed[current]) continue;
    closed[current] = 1;

    const cell = Math.floor(current / DIRECTIONS.length);
    const dir = current % DIRECTIONS.length;

    if (cell === goalIndex) {
      const path: number[] = [];
      for (let node = current; node !== -1; node = cameFrom[node]) {
        const nodeCell = Math.floor(node / DIRECTIONS.length);
        if (path[path.length - 1] !== nodeCell) path.push(nodeCell);
      }
      return path.reverse();
    }

    const ci = cell % grid.cols;
    const cj = Math.floor(cell / grid.cols);

    for (let d = 0; d < DIRECTIONS.length; d++) {
      const [dx, dy] = DIRECTIONS[d];
      const ni = ci + dx;
      const nj = cj + dy;
      if (ni < 0 || nj < 0 || ni >= grid.cols || nj >= grid.rows) continue;
      const neighbour = nj * grid.cols + ni;
      if (grid.blocked[neighbour]) continue;

      const state = neighbour * DIRECTIONS.length + d;
      const tentative = gScore[current] + 1 + (d === dir ? 0 : TURN_COST);
      if (tentative < gScore[state]) {
        gScore[state] = tentative;
        cameFrom[state] = current;
        open.push(state, tentative + heuristic(neighbour));
      }
    }
  }

  return null;
}

/** Slår sammen rutepunkter som ligger på samme rette strekk. */
function mergeCollinear(points: Vec2[]): Vec2[] {
  if (points.length <= 2) return points;
  const result: Vec2[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const previous = result[result.length - 1];
    const next = points[i + 1];
    const sameRow = Math.abs(previous.y - points[i].y) < 1e-6 && Math.abs(points[i].y - next.y) < 1e-6;
    const sameCol = Math.abs(previous.x - points[i].x) < 1e-6 && Math.abs(points[i].x - next.x) < 1e-6;
    if (!sameRow && !sameCol) result.push(points[i]);
  }
  result.push(points[points.length - 1]);
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

  const points = mergeCollinear(cells.map((index) => toWorld(grid, index)));

  return {
    points,
    start: points[0],
    goal: points[points.length - 1],
  };
}
