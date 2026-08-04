import { useMemo } from 'react';
import type { StorePlan, Vec2 } from '../data/types';
import { MAP_PALETTE as C } from '../lib/palette';

/**
 * Butikken som liten isometrisk tegning.
 *
 * Samme modell som i 3D, men tegnet rett i SVG fra planen – da kan hver butikk
 * vise seg selv i lista uten at vi starter fem 3D-scener på forsiden.
 */

const COS30 = Math.cos(Math.PI / 6);

/** Isometrisk projeksjon: (x, høyde, z) → punkt i tegningen. */
function project(x: number, height: number, z: number) {
  return { u: (x - z) * COS30, v: (x + z) * 0.5 - height };
}

const polygon = (points: Array<{ u: number; v: number }>) =>
  points.map((p) => `${p.u.toFixed(2)},${p.v.toFixed(2)}`).join(' ');

interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  top: string;
  side: string;
  front: string;
}

export function StoreIsoArt({ plan, className }: { plan: StorePlan; className?: string }) {
  const drawing = useMemo(() => {
    const outline = plan.outline;
    const slab = 0.6;

    /**
     * Reolseksjonene slås sammen til hele rader. I et bilde på 96 piksler ser
     * man ikke skjøtene likevel, og det tar tegningen fra ~130 bokser til ~20.
     */
    const runs = new Map<string, { x: number; z: number; x2: number; z2: number; h: number }>();
    for (const f of plan.fixtures) {
      const key = `${f.departmentId}|${f.aisle}`;
      const run = runs.get(key);
      if (!run) {
        runs.set(key, { x: f.x, z: f.y, x2: f.x + f.w, z2: f.y + f.d, h: f.heightCm / 100 });
        continue;
      }
      run.x = Math.min(run.x, f.x);
      run.z = Math.min(run.z, f.y);
      run.x2 = Math.max(run.x2, f.x + f.w);
      run.z2 = Math.max(run.z2, f.y + f.d);
      run.h = Math.max(run.h, f.heightCm / 100);
    }

    const boxes: Box[] = [
      ...[...runs.values()].map((r) => ({
        x: r.x,
        z: r.z,
        w: r.x2 - r.x,
        d: r.z2 - r.z,
        h: r.h,
        top: C.wood,
        side: C.shelf,
        front: '#dcd8d0',
      })),
      ...plan.checkouts.map((c) => ({
        x: c.x,
        z: c.y,
        w: c.w,
        d: c.d,
        h: 0.95,
        top: C.wood,
        side: C.shelf,
        front: '#dcd8d0',
      })),
      // Lukkede rom har tak – de vises som en lukket boks.
      ...plan.rooms.map((r) => ({
        x: r.x,
        z: r.y,
        w: r.w,
        d: r.d,
        h: r.heightCm / 100,
        top: C.shelf,
        side: C.floorEdge,
        front: '#d5d1c8',
      })),
    ];

    // Bakerst først: lavere (x + z) ligger lengst unna.
    boxes.sort((a, b) => a.x + a.z - (b.x + b.z));

    const top = outline.map((p: Vec2) => project(p.x, 0, p.y));
    const bottom = outline.map((p: Vec2) => project(p.x, -slab, p.y));

    const all = [...top, ...bottom];
    for (const box of boxes) {
      all.push(project(box.x, box.h, box.z), project(box.x + box.w, box.h, box.z + box.d));
    }
    const minU = Math.min(...all.map((p) => p.u));
    const maxU = Math.max(...all.map((p) => p.u));
    const minV = Math.min(...all.map((p) => p.v));
    const maxV = Math.max(...all.map((p) => p.v));

    return { boxes, top, bottom, minU, maxU, minV, maxV };
  }, [plan]);

  const pad = 1.2;
  const viewBox = [
    drawing.minU - pad,
    drawing.minV - pad,
    drawing.maxU - drawing.minU + pad * 2,
    drawing.maxV - drawing.minV + pad * 2,
  ].join(' ');

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
    >
      {/* gulvplatens kant */}
      <polygon points={polygon(drawing.bottom)} fill={C.floorEdge} />
      <polygon points={polygon(drawing.top)} fill={C.floor} />

      {drawing.boxes.map((box, index) => {
        const { x, z, w, d, h } = box;
        const topFace = [
          project(x, h, z),
          project(x + w, h, z),
          project(x + w, h, z + d),
          project(x, h, z + d),
        ];
        const frontFace = [
          project(x, h, z + d),
          project(x + w, h, z + d),
          project(x + w, 0, z + d),
          project(x, 0, z + d),
        ];
        const sideFace = [
          project(x + w, h, z),
          project(x + w, h, z + d),
          project(x + w, 0, z + d),
          project(x + w, 0, z),
        ];
        return (
          <g key={index}>
            <polygon points={polygon(frontFace)} fill={box.front} />
            <polygon points={polygon(sideFace)} fill={box.side} />
            <polygon points={polygon(topFace)} fill={box.top} />
          </g>
        );
      })}
    </svg>
  );
}
