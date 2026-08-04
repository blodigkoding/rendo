import { useMemo } from 'react';
import type { Chain, Store } from '../data/types';
import { MAP_PALETTE as C } from '../lib/palette';

/**
 * Butikken som liten isometrisk tegning.
 *
 * Dette er ikke plantegningen – det er bygget sett skrått ovenfra, i samme
 * hvite modellstil som kartet. Formen varierer per butikk: bredde, dybde,
 * høyde, tak, vindusrekke og om det står et sidebygg eller en luftesjakt på
 * taket. Alt er utledet av butikkens id, så samme butikk ser lik ut hver gang.
 */

const COS30 = Math.cos(Math.PI / 6);

/** Isometrisk projeksjon: (x, høyde, z) → punkt i tegningen. */
function project(x: number, height: number, z: number) {
  return { u: (x - z) * COS30, v: (x + z) * 0.5 - height };
}

const polygon = (points: Array<{ u: number; v: number }>) =>
  points.map((p) => `${p.u.toFixed(2)},${p.v.toFixed(2)}`).join(' ');

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  y?: number;
  h: number;
  top: string;
  left: string;
  right: string;
}

/** Tegner en boks med topp og to synlige sider. */
function BoxShape({ box }: { box: Box }) {
  const { x, z, w, d, h } = box;
  const y0 = box.y ?? 0;
  const y1 = y0 + h;

  const top = [
    project(x, y1, z),
    project(x + w, y1, z),
    project(x + w, y1, z + d),
    project(x, y1, z + d),
  ];
  const front = [
    project(x, y1, z + d),
    project(x + w, y1, z + d),
    project(x + w, y0, z + d),
    project(x, y0, z + d),
  ];
  const side = [
    project(x + w, y1, z),
    project(x + w, y1, z + d),
    project(x + w, y0, z + d),
    project(x + w, y0, z),
  ];

  return (
    <g>
      <polygon points={polygon(front)} fill={box.left} />
      <polygon points={polygon(side)} fill={box.right} />
      <polygon points={polygon(top)} fill={box.top} />
    </g>
  );
}

interface Props {
  store: Store;
  chain?: Chain | null;
  className?: string;
}

export function StoreIsoArt({ store, chain, className }: Props) {
  const drawing = useMemo(() => {
    const seed = hash(store.id);
    const pick = (n: number, at: number) => Math.floor(seed / 7 ** at) % n;

    // Grunnflaten varierer med butikkens faktiske størrelse.
    const area = store.areaM2 ?? 800;
    const w = 7 + Math.min(5, area / 260) + pick(3, 1);
    const d = 6 + Math.min(4, area / 320) + pick(3, 2);
    const h = 3.4 + pick(3, 3) * 0.7;

    const wall = '#eceae5';
    const wallShade = '#ddd9d1';
    const roof = '#f6f4f0';

    const boxes: Box[] = [
      // tomta
      { x: -1.4, z: -1.4, w: w + 2.8, d: d + 2.8, h: 0.35, top: C.backdrop, left: '#e2e0da', right: '#d8d5ce' },
      // hovedbygget
      { x: 0, z: 0, w, d, y: 0.35, h, top: roof, left: wall, right: wallShade },
      // gesims
      { x: -0.25, z: -0.25, w: w + 0.5, d: d + 0.5, y: 0.35 + h, h: 0.35, top: '#efece7', left: '#e4e1da', right: '#d9d5cd' },
    ];

    // Halvparten av butikkene har et sidebygg – lager eller varemottak.
    if (pick(2, 4) === 0) {
      const sw = 2.6 + pick(2, 5);
      boxes.push({
        x: w,
        z: d * 0.15,
        w: sw,
        d: d * 0.55,
        y: 0.35,
        h: h * 0.62,
        top: roof,
        left: wall,
        right: wallShade,
      });
    }

    // Teknisk på taket.
    const units = 1 + pick(3, 6);
    for (let i = 0; i < units; i++) {
      boxes.push({
        x: 1 + i * 2.2,
        z: 1.2 + pick(2, 7 + i) * 1.6,
        w: 1.4,
        d: 1.2,
        y: 0.35 + h + 0.35,
        h: 0.5,
        top: '#e8e5df',
        left: '#dcd8d1',
        right: '#d1cdc5',
      });
    }

    // Inngangspartiet: baldakin og dør på framsiden.
    const doorX = 0.9 + pick(3, 11) * 0.8;
    boxes.push({
      x: doorX - 0.4,
      z: d,
      w: 3.4,
      d: 1.4,
      y: 0.35 + h * 0.62,
      h: 0.22,
      top: C.wood,
      left: C.woodShade,
      right: C.woodShade,
    });

    // Bakerst først, så nærmeste tegnes oppå.
    const sorted = [...boxes].sort((a, b) => a.x + a.z - (b.x + b.z));

    // Vindusrekke og dør legges på framveggen etterpå.
    const glass: Array<{ points: string }> = [];
    const windows = 2 + pick(3, 12);
    const bandY0 = 0.35 + h * 0.28;
    const bandY1 = 0.35 + h * 0.72;
    for (let i = 0; i < windows; i++) {
      const gx = 0.7 + i * ((w - 1.4) / windows);
      const gw = (w - 1.4) / windows - 0.5;
      if (gw <= 0.2) break;
      glass.push({
        points: polygon([
          project(gx, bandY1, d),
          project(gx + gw, bandY1, d),
          project(gx + gw, bandY0, d),
          project(gx, bandY0, d),
        ]),
      });
    }

    const door = polygon([
      project(doorX, 0.35 + h * 0.6, d),
      project(doorX + 2.6, 0.35 + h * 0.6, d),
      project(doorX + 2.6, 0.35, d),
      project(doorX, 0.35, d),
    ]);

    // Skiltet over inngangen får kjedens farge.
    const sign = polygon([
      project(doorX - 0.2, 0.35 + h * 0.86, d),
      project(doorX + 3, 0.35 + h * 0.86, d),
      project(doorX + 3, 0.35 + h * 0.74, d),
      project(doorX - 0.2, 0.35 + h * 0.74, d),
    ]);

    const all = sorted.flatMap((box) => [
      project(box.x, (box.y ?? 0) + box.h, box.z),
      project(box.x + box.w, (box.y ?? 0) + box.h, box.z + box.d),
      project(box.x + box.w, 0, box.z + box.d),
      project(box.x, 0, box.z),
    ]);
    const minU = Math.min(...all.map((p) => p.u));
    const maxU = Math.max(...all.map((p) => p.u));
    const minV = Math.min(...all.map((p) => p.v));
    const maxV = Math.max(...all.map((p) => p.v));

    return { boxes: sorted, glass, door, sign, minU, maxU, minV, maxV };
  }, [store]);

  const pad = 0.8;
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
      {drawing.boxes.map((box, index) => (
        <BoxShape key={index} box={box} />
      ))}
      {drawing.glass.map((pane, index) => (
        <polygon key={index} points={pane.points} fill="#cfd8da" opacity="0.85" />
      ))}
      <polygon points={drawing.door} fill="#c2ccce" />
      <polygon points={drawing.sign} fill={chain?.accent ?? C.ink} opacity="0.9" />
    </svg>
  );
}
