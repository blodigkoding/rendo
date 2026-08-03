import type { Fixture, Vec2 } from '../data/types';
import { distance, formatMeters } from './geometry';

export interface DirectionStep {
  id: string;
  text: string;
  /** Punktet steget gjelder fra – brukes til å markere svingen i kartet. */
  at: Vec2;
  meters: number;
  turn: 'start' | 'straight' | 'left' | 'right' | 'sharp-left' | 'sharp-right' | 'arrive';
}

function classifyTurn(prev: Vec2, corner: Vec2, next: Vec2): DirectionStep['turn'] {
  const ax = corner.x - prev.x;
  const ay = corner.y - prev.y;
  const bx = next.x - corner.x;
  const by = next.y - corner.y;
  const cross = ax * by - ay * bx; // > 0 = høyresving i y-ned-koordinater
  const dot = ax * bx + ay * by;
  const angle = Math.atan2(cross, dot);
  const deg = (angle * 180) / Math.PI;

  if (Math.abs(deg) < 25) return 'straight';
  if (deg > 0) return deg > 115 ? 'sharp-right' : 'right';
  return deg < -115 ? 'sharp-left' : 'left';
}

const TURN_TEXT: Record<DirectionStep['turn'], string> = {
  start: 'Gå',
  straight: 'Fortsett rett fram',
  left: 'Ta til venstre',
  right: 'Ta til høyre',
  'sharp-left': 'Snu til venstre',
  'sharp-right': 'Snu til høyre',
  arrive: 'Framme',
};

/** Gjør en rutepolylinje om til korte instruksjoner. */
export function buildDirections(points: Vec2[], fixture: Fixture, aisleLabel: string): DirectionStep[] {
  if (points.length < 2) return [];
  const steps: DirectionStep[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const meters = distance(from, to);
    if (meters < 0.4 && i !== 0) continue;

    const turn: DirectionStep['turn'] =
      i === 0 ? 'start' : classifyTurn(points[i - 1], from, to);

    steps.push({
      id: `step-${i}`,
      at: from,
      meters,
      turn,
      text:
        i === 0
          ? `Gå ${formatMeters(meters)} rett fram`
          : `${TURN_TEXT[turn]} og gå ${formatMeters(meters)}`,
    });
  }

  steps.push({
    id: 'step-arrive',
    at: points[points.length - 1],
    meters: 0,
    turn: 'arrive',
    text: `Framme i ${aisleLabel} – seksjon ${fixture.code}`,
  });

  return steps;
}
