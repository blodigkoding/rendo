import type { Rect, Vec2 } from '../types';
import { rectInsidePolygon } from '../../lib/polygon';

/**
 * Butikkformer.
 *
 * Ekte butikklokaler er sjelden rektangler: hjørner er skåret av, det står et
 * teknisk rom i veien, og fasaden springer ut mot inngangen. Her bygges en slik
 * form ved å skjære hjørner og sette innhugg langs veggene – men bare der det
 * er plass, så ingen reol havner utenfor veggen.
 */

/** Liten deterministisk generator, så samme butikk får samme form hver gang. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

type Side = 'top' | 'right' | 'bottom' | 'left';

interface Notch {
  side: Side;
  /** Avstand fra hjørnet der veggen begynner. */
  at: number;
  length: number;
  depth: number;
}

interface Corners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

function build(width: number, depth: number, corners: Corners, notches: Notch[]): Vec2[] {
  const points: Vec2[] = [];
  const on = (side: Side) => notches.filter((n) => n.side === side).sort((a, b) => a.at - b.at);

  // Toppvegg, venstre mot høyre.
  points.push({ x: corners.topLeft, y: 0 });
  for (const notch of on('top')) {
    points.push({ x: notch.at, y: 0 });
    points.push({ x: notch.at, y: notch.depth });
    points.push({ x: notch.at + notch.length, y: notch.depth });
    points.push({ x: notch.at + notch.length, y: 0 });
  }
  points.push({ x: width - corners.topRight, y: 0 });

  // Høyre vegg, oppe mot nede.
  points.push({ x: width, y: corners.topRight });
  for (const notch of on('right')) {
    points.push({ x: width, y: notch.at });
    points.push({ x: width - notch.depth, y: notch.at });
    points.push({ x: width - notch.depth, y: notch.at + notch.length });
    points.push({ x: width, y: notch.at + notch.length });
  }
  points.push({ x: width, y: depth - corners.bottomRight });

  // Bunnvegg, høyre mot venstre.
  points.push({ x: width - corners.bottomRight, y: depth });
  for (const notch of on('bottom').reverse()) {
    points.push({ x: notch.at + notch.length, y: depth });
    points.push({ x: notch.at + notch.length, y: depth - notch.depth });
    points.push({ x: notch.at, y: depth - notch.depth });
    points.push({ x: notch.at, y: depth });
  }
  points.push({ x: corners.bottomLeft, y: depth });

  // Venstre vegg, nede mot oppe.
  points.push({ x: 0, y: depth - corners.bottomLeft });
  for (const notch of on('left').reverse()) {
    points.push({ x: 0, y: notch.at + notch.length });
    points.push({ x: notch.depth, y: notch.at + notch.length });
    points.push({ x: notch.depth, y: notch.at });
    points.push({ x: 0, y: notch.at });
  }
  points.push({ x: 0, y: corners.topLeft });

  return points;
}

export interface OutlineInput {
  seed: string;
  width: number;
  depth: number;
  /** Alt som må bli liggende innenfor veggen. */
  keepInside: Rect[];
}

export function buildOutline({ seed, width, depth, keepInside }: OutlineInput): Vec2[] {
  const random = rng(seed);
  const pick = (min: number, max: number) => min + random() * (max - min);

  const valid = (candidate: Vec2[]) =>
    keepInside.every((rect) => rectInsidePolygon(candidate, rect, 0.25));

  // Start med generøse hjørner og trekk dem inn til alt får plass.
  let corners: Corners = {
    topLeft: pick(2.5, 5.5),
    topRight: pick(2.5, 5.5),
    bottomRight: pick(2.5, 6),
    bottomLeft: pick(2, 4.5),
  };
  for (let attempt = 0; attempt < 12 && !valid(build(width, depth, corners, [])); attempt++) {
    corners = {
      topLeft: corners.topLeft * 0.75,
      topRight: corners.topRight * 0.75,
      bottomRight: corners.bottomRight * 0.75,
      bottomLeft: corners.bottomLeft * 0.75,
    };
  }
  if (!valid(build(width, depth, corners, []))) {
    corners = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
  }

  // Prøv å sette inn noen innhugg der de ikke er i veien.
  const sides: Side[] = ['top', 'right', 'bottom', 'left'];
  const notches: Notch[] = [];
  const target = 3 + Math.floor(random() * 2);

  for (let attempt = 0; attempt < 80 && notches.length < target; attempt++) {
    const side = sides[Math.floor(random() * sides.length)];
    const along = side === 'top' || side === 'bottom' ? width : depth;
    const length = pick(2, 5);
    const at = pick(1.5, Math.max(2, along - length - 1.5));
    const candidate: Notch = { side, at, length, depth: pick(1.2, 3) };
    if (notches.some((n) => n.side === side && Math.abs(n.at - at) < n.length + length)) continue;
    const next = [...notches, candidate];
    if (valid(build(width, depth, corners, next))) notches.push(candidate);
  }

  return build(width, depth, corners, notches);
}
