import type { Vec2 } from '../data/types';
import { distance } from './geometry';

/**
 * Hvor kunden er i butikken.
 *
 * I dag har vi ingen innendørs posisjonering, så veibeskrivelsen spilles av med
 * en simulert gange langs ruten. Når det settes opp faste punkter i butikken –
 * bluetooth-fyr, UWB eller wifi-triangulering – er det bare å bytte inn en
 * annen `PositionSource`. Resten av appen kjenner bare dette grensesnittet.
 */

export interface Fix {
  /** Posisjon i butikkens koordinater. */
  point: Vec2;
  /** Retning man går i, radianer, samme system som kartet. */
  heading: number;
  /** Hvor langt man har gått langs ruten, i meter. */
  travelled: number;
  /** Anslått nøyaktighet i meter. Simulert kilde later som den er perfekt. */
  accuracy: number;
}

export interface PositionSource {
  readonly name: string;
  /** Kaller tilbake så lenge man er abonnert. Returnerer en oppsigelse. */
  subscribe(onFix: (fix: Fix) => void): () => void;
}

/** Punktet et gitt antall meter ut i en polylinje, med retningen der. */
export function pointAlong(points: Vec2[], travelled: number): Fix {
  let left = Math.max(0, travelled);
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const length = distance(from, to);
    if (left <= length || i === points.length - 1) {
      const t = length === 0 ? 0 : Math.min(1, left / length);
      return {
        point: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t },
        heading: Math.atan2(to.y - from.y, to.x - from.x),
        travelled,
        accuracy: 0,
      };
    }
    left -= length;
  }
  const last = points[points.length - 1] ?? { x: 0, y: 0 };
  return { point: last, heading: 0, travelled, accuracy: 0 };
}

/**
 * Simulert gange langs ruten. Står her til ekte posisjonering finnes, og er
 * også nyttig for å demonstrere veibeskrivelsen uten å være i butikken.
 */
export function createWalkSimulator(points: Vec2[], speed = 1.1): PositionSource {
  return {
    name: 'simulert',
    subscribe(onFix) {
      let travelled = 0;
      let last = performance.now();
      let frame = 0;

      const step = (now: number) => {
        const delta = Math.min(0.25, (now - last) / 1000);
        last = now;
        travelled += delta * speed;
        onFix(pointAlong(points, travelled));
        frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frame);
    },
  };
}

/**
 * Plass til den ekte kilden. Butikkene får faste punkter innvendig, og appen
 * regner posisjon ut fra signalstyrken til dem den ser.
 */
export function createIndoorSource(): PositionSource {
  return {
    name: 'innendørs-gps',
    subscribe() {
      throw new Error(
        'Innendørs posisjonering er ikke satt opp ennå. Butikken må ha faste ' +
          'punkter registrert i planen før denne kilden kan brukes.',
      );
    },
  };
}
