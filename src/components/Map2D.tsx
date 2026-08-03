import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture, StorePlan, Vec2 } from '../data/types';
import { FACING_VECTOR, rectCenter } from '../lib/geometry';
import { MinusIcon, PlusIcon } from './icons';

/** Den valgte varens plassering, slik kartene trenger den. */
export interface MapTarget {
  fixture: Fixture;
  /** Punktet på reolfronten der varen står. */
  marker: Vec2;
  departmentId: string;
  /** Hyllens høyde over gulv. */
  heightCm: number;
}

/** Piksler i kartflaten som er dekket av søkefelt og panel. */
export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
}

export interface MapViewProps {
  plan: StorePlan;
  target: MapTarget | null;
  route: Vec2[] | null;
  origin: Vec2 | null;
  picking: boolean;
  insets: MapInsets;
  onPick: (point: Vec2) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 6;
const MAX_K = 90;

/** Etiketter for ganger og avdelinger, utledet av seksjonene i planen. */
function useAnnotations(plan: StorePlan) {
  return useMemo(() => {
    const aisles = new Map<string, Vec2[]>();
    // Avdelingsnavnet plasseres i gangen foran hyllene, ikke oppå dem – ellers
    // kolliderer navnene på de to sidene av samme gondolrad. Én etikett per
    // avdeling per gang, slik at avdelinger som går over flere ganger merkes
    // der de faktisk står.
    const departments = new Map<string, Vec2[]>();

    for (const fixture of plan.fixtures) {
      const n = FACING_VECTOR[fixture.facing];
      const c = rectCenter(fixture);
      const access = { x: c.x + n.x * (fixture.w / 2 + 1), y: c.y + n.y * (fixture.d / 2 + 1) };
      aisles.set(fixture.aisle, [...(aisles.get(fixture.aisle) ?? []), access]);
      const key = `${fixture.departmentId}|${fixture.aisle}`;
      departments.set(key, [
        ...(departments.get(key) ?? []),
        { x: c.x + n.x * (fixture.w / 2 + 0.85), y: c.y + n.y * (fixture.d / 2 + 0.85) },
      ]);
    }

    const spread = (points: Vec2[]) => {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
        cx: xs.reduce((a, b) => a + b, 0) / xs.length,
        cy: ys.reduce((a, b) => a + b, 0) / ys.length,
      };
    };

    const aisleLabels = [...aisles.entries()].map(([name, points]) => {
      const s = spread(points);
      const vertical = s.maxY - s.minY > s.maxX - s.minX;
      return {
        name,
        x: s.cx,
        y: vertical ? s.minY - 1.2 : s.cy,
        vertical,
      };
    });

    const deptLabels = [...departments.entries()].map(([key, points]) => {
      const s = spread(points);
      const vertical = s.maxY - s.minY > s.maxX - s.minX;
      const id = key.split('|')[0];
      return {
        key,
        id,
        name: plan.departments.find((d) => d.id === id)?.name ?? id,
        x: s.cx,
        y: s.cy,
        vertical,
      };
    });

    return { aisleLabels, deptLabels };
  }, [plan]);
}

export function Map2D({ plan, target, route, origin, picking, insets, onPick }: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 20 });
  const { aisleLabels, deptLabels } = useAnnotations(plan);

  // Peker-tilstand for panorering og pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, startX: 0, startY: 0, pinchDist: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { w: entry.contentRect.width, h: entry.contentRect.height };
      sizeRef.current = next;
      setSize(next);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const insetsRef = useRef(insets);
  insetsRef.current = insets;

  /** Sentrerer et område i den delen av kartet som faktisk er synlig. */
  const fitTo = useCallback(
    (box: { x: number; y: number; w: number; d: number }, padding = 40, maxK = MAX_K) => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const { top, right, bottom } = insetsRef.current;
      const availableW = Math.max(120, w - right - padding * 2);
      const availableH = Math.max(120, h - top - bottom - padding * 2);
      const k = Math.max(MIN_K, Math.min(Math.min(availableW / box.w, availableH / box.d), maxK));
      const centreX = (w - right) / 2;
      const centreY = top + (h - top - bottom) / 2;
      setTransform({
        k,
        x: centreX - (box.x + box.w / 2) * k,
        y: centreY - (box.y + box.d / 2) * k,
      });
    },
    [],
  );

  // Første tilpasning: hele planen.
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || size.w === 0) return;
    fitted.current = true;
    fitTo({ x: 0, y: 0, w: plan.width, d: plan.depth }, 28, 40);
  }, [size.w, plan, fitTo]);

  // Zoom til ruten når den finnes, ellers til valgt vare.
  const routeKey = route ? `${route.length}:${route[0]?.x},${route[0]?.y}` : '';
  useEffect(() => {
    if (size.w === 0) return;
    if (route && route.length > 1) {
      const xs = route.map((p) => p.x);
      const ys = route.map((p) => p.y);
      fitTo(
        {
          x: Math.min(...xs) - 2,
          y: Math.min(...ys) - 2,
          w: Math.max(2, Math.max(...xs) - Math.min(...xs) + 4),
          d: Math.max(2, Math.max(...ys) - Math.min(...ys) + 4),
        },
        44,
        34,
      );
    } else if (target) {
      fitTo({ x: target.marker.x - 6, y: target.marker.y - 6, w: 12, d: 12 }, 40, 34);
    }
  }, [routeKey, target?.fixture.id, size.w, insets.right, insets.bottom, fitTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const toWorld = useCallback(
    (clientX: number, clientY: number): Vec2 => {
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - transform.x) / transform.k,
        y: (clientY - rect.top - transform.y) / transform.k,
      };
    },
    [transform],
  );

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setTransform((t) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
      const scale = k / t.k;
      return { k, x: cx - (cx - t.x) * scale, y: cy - (cy - t.y) * scale };
    });
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture.current.moved = 0;
    gesture.current.startX = event.clientX;
    gesture.current.startY = event.clientY;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (gesture.current.pinchDist > 0) {
        const rect = svgRef.current!.getBoundingClientRect();
        zoomAt(dist / gesture.current.pinchDist, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
      gesture.current.pinchDist = dist;
      gesture.current.moved = 99;
      return;
    }

    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    if (gesture.current.moved > 4) {
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const wasTap = gesture.current.moved <= 4 && pointers.current.size === 1;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current.pinchDist = 0;
    if (wasTap && picking) onPick(toWorld(event.clientX, event.clientY));
  };

  const onWheel = (event: React.WheelEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    zoomAt(Math.exp(-event.deltaY * 0.0016), event.clientX - rect.left, event.clientY - rect.top);
  };

  const routePath = route && route.length > 1 ? route.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') : null;
  const scaleMeters = 40 / transform.k;

  return (
    <div
      ref={hostRef}
      className={`map${picking ? ' map--picking' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <svg ref={svgRef} className="map__canvas" role="img" aria-label={`Plantegning for butikken`}>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          <rect className="plan__floor" x={0} y={0} width={plan.width} height={plan.depth} />

          {/* rutenett, 2 m */}
          <g className="plan__grid">
            {Array.from({ length: Math.floor(plan.width / 2) }, (_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 2} y1={0} x2={(i + 1) * 2} y2={plan.depth} />
            ))}
            {Array.from({ length: Math.floor(plan.depth / 2) }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * 2} x2={plan.width} y2={(i + 1) * 2} />
            ))}
          </g>

          {/* kasser */}
          {plan.checkouts.map((checkout) => (
            <rect
              key={checkout.id}
              className="plan__checkout"
              x={checkout.x}
              y={checkout.y}
              width={checkout.w}
              height={checkout.d}
            />
          ))}

          {/* reolseksjoner */}
          {plan.fixtures.map((fixture) => {
            const isTarget = target?.fixture.id === fixture.id;
            const inDept = target && fixture.departmentId === target.departmentId;
            const className = isTarget
              ? 'plan__fixture plan__fixture--target'
              : inDept
                ? 'plan__fixture plan__fixture--dept'
                : target
                  ? 'plan__fixture plan__fixture--dim'
                  : 'plan__fixture';

            const n = FACING_VECTOR[fixture.facing];
            const front =
              n.x !== 0
                ? {
                    x1: n.x > 0 ? fixture.x + fixture.w : fixture.x,
                    y1: fixture.y,
                    x2: n.x > 0 ? fixture.x + fixture.w : fixture.x,
                    y2: fixture.y + fixture.d,
                  }
                : {
                    x1: fixture.x,
                    y1: n.y > 0 ? fixture.y + fixture.d : fixture.y,
                    x2: fixture.x + fixture.w,
                    y2: n.y > 0 ? fixture.y + fixture.d : fixture.y,
                  };

            return (
              <g key={fixture.id}>
                <rect
                  className={className}
                  x={fixture.x}
                  y={fixture.y}
                  width={fixture.w}
                  height={fixture.d}
                />
                <line
                  className={isTarget ? 'plan__front plan__front--target' : 'plan__front'}
                  {...front}
                />
              </g>
            );
          })}

          {/* avdelingsnavn */}
          {deptLabels.map((label) => (
            <text
              key={label.key}
              className="plan__label"
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={label.vertical ? `rotate(-90 ${label.x} ${label.y})` : undefined}
              opacity={target && target.departmentId !== label.id ? 0.35 : 1}
            >
              {label.name}
            </text>
          ))}

          {/* gangnummer */}
          {aisleLabels.map((label) => (
            <text
              key={label.name}
              className="plan__label plan__label--aisle"
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label.name}
            </text>
          ))}

          {/* inngang og servicepunkter */}
          {plan.entrances.map((entrance) => (
            <g key={entrance.id}>
              <line
                x1={entrance.position.x - 1.6}
                y1={plan.depth}
                x2={entrance.position.x + 1.6}
                y2={plan.depth}
                stroke="#fff"
                strokeWidth={0.16}
              />
              <text
                className="plan__label"
                x={entrance.position.x}
                y={entrance.position.y + 0.5}
                textAnchor="middle"
              >
                {entrance.name}
              </text>
            </g>
          ))}
          {plan.landmarks.map((landmark) => (
            <text
              key={landmark.id}
              className="plan__label"
              x={landmark.position.x}
              y={landmark.position.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {landmark.name}
            </text>
          ))}

          {/* rute */}
          {routePath && (
            <g>
              <path className="plan__route-halo" d={routePath} />
              <path className="plan__route" d={routePath} />
              <path className="plan__route-dash" d={routePath} />
            </g>
          )}

          {/* startpunkt */}
          {origin && (
            <g>
              <circle className="plan__origin-ring" cx={origin.x} cy={origin.y} r={0.62} />
              <circle className="plan__origin-dot" cx={origin.x} cy={origin.y} r={0.26} />
            </g>
          )}

          {/* varens plassering */}
          {target && (
            <g>
              <circle cx={target.marker.x} cy={target.marker.y} r={0.5} fill="#fff" />
              <circle className="plan__pin" cx={target.marker.x} cy={target.marker.y} r={0.3} />
              <circle
                cx={target.marker.x}
                cy={target.marker.y}
                r={0.75}
                fill="none"
                stroke="#0b0b0c"
                strokeWidth={0.05}
                opacity={0.5}
              />
            </g>
          )}
        </g>
      </svg>

      <div className="map__zoom" style={{ right: 12 + insets.right, bottom: 20 + insets.bottom }}>
        <button
          type="button"
          aria-label="Zoom inn"
          onClick={() => zoomAt(1.35, size.w / 2, size.h / 2)}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          aria-label="Zoom ut"
          onClick={() => zoomAt(1 / 1.35, size.w / 2, size.h / 2)}
        >
          <MinusIcon />
        </button>
      </div>

      <div className="map__legend" style={{ bottom: 20 + insets.bottom }}>
        <span className="map__scale" />
        <span>{scaleMeters < 10 ? scaleMeters.toFixed(1).replace('.', ',') : Math.round(scaleMeters)} m</span>
      </div>
    </div>
  );
}
