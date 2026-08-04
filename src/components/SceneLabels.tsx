import { useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Etiketter i 3D, tegnet i skjermplanet.
 *
 * Ligger teksten i selve modellen, skalerer den med zoomen og «flyter» når
 * kameraet beveger seg. Her tegnes den som vanlige HTML-elementer utenfor
 * scenen, mens en liten komponent inne i scenen bare flytter dem dit de skal
 * hvert bilde. Skriften har dermed alltid samme størrelse. Etiketter som ville
 * lagt seg oppå hverandre skjules – den nærmest kameraet vinner.
 */

export interface SceneLabel {
  key: string;
  text: string;
  /** Posisjon i modellen. */
  position: [number, number, number];
  muted?: boolean;
  className?: string;
}

export type LabelNodes = RefObject<Map<string, HTMLDivElement>>;

interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}

const overlaps = (a: Box, b: Box) => !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b);

/** Tegner etikettene. Ligger utenfor Canvas, i vanlig DOM. */
export function LabelLayer({ labels, nodes }: { labels: SceneLabel[]; nodes: LabelNodes }) {
  return (
    <div className="map__labels" aria-hidden="true">
      {labels.map((label) => (
        <div
          key={label.key}
          ref={(element) => {
            if (element) nodes.current.set(label.key, element);
            else nodes.current.delete(label.key);
          }}
          className={`scene__tag${label.muted ? ' scene__tag--muted' : ''}${
            label.className ? ` ${label.className}` : ''
          }`}
          style={{ opacity: 0 }}
        >
          {label.text}
        </div>
      ))}
    </div>
  );
}

/** Plasserer etikettene. Ligger inne i Canvas og kjenner kameraet. */
export function LabelProjector({
  labels,
  nodes,
  minZoom = 7,
}: {
  labels: SceneLabel[];
  nodes: LabelNodes;
  /** Under denne zoomen er butikken for liten til å merkes. */
  minZoom?: number;
}) {
  const { camera, size } = useThree();
  const point = useRef(new THREE.Vector3());

  useFrame(() => {
    const zoom = (camera as THREE.OrthographicCamera).zoom ?? 1;
    const visible = zoom >= minZoom;

    const placed: Array<{ key: string; depth: number; box: Box; x: number; y: number }> = [];

    for (const label of labels) {
      const element = nodes.current.get(label.key);
      if (!element) continue;
      point.current.set(...label.position).project(camera);
      const x = (point.current.x * 0.5 + 0.5) * size.width;
      const y = (-point.current.y * 0.5 + 0.5) * size.height;
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      placed.push({
        key: label.key,
        depth: point.current.z,
        box: { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 },
        x,
        y,
      });
    }

    // Nærmest kamera først, så den vinner plassen ved kollisjon.
    placed.sort((a, b) => a.depth - b.depth);

    const taken: Box[] = [];
    const shown = new Set<string>();
    for (const entry of placed) {
      const offScreen =
        entry.box.r < -40 ||
        entry.box.l > size.width + 40 ||
        entry.box.b < -40 ||
        entry.box.t > size.height + 40;
      if (offScreen || taken.some((box) => overlaps(entry.box, box))) continue;
      taken.push(entry.box);
      shown.add(entry.key);
    }

    for (const entry of placed) {
      const element = nodes.current.get(entry.key);
      if (!element) continue;
      element.style.transform = `translate(${Math.round(entry.x)}px, ${Math.round(entry.y)}px) translate(-50%, -50%)`;
      element.style.opacity = visible && shown.has(entry.key) ? '1' : '0';
    }
  });

  return null;
}
