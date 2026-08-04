import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture, StorePlan, Vec2 } from '../data/types';
import { FACING_VECTOR, rectCenter } from '../lib/geometry';
import { toPathData } from '../lib/polygon';
import { MinusIcon, PlusIcon } from './icons';

/** En vare kartet skal peke ut. Handlelista gir flere om gangen. */
export interface MapTarget {
  id: string;
  fixture: Fixture;
  /** Punktet på reolfronten der varen står. */
  marker: Vec2;
  departmentId: string;
  /** Hyllens høyde over gulv. */
  heightCm: number;
  /** Nummer i handleruten, hvis det er flere stopp. */
  stop?: number;
  /** Allerede plukket. */
  done?: boolean;
}

/** Piksler i kartflaten som er dekket av søkefelt og panel. */
export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
}

export interface MapViewProps {
  plan: StorePlan;
  targets: MapTarget[];
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
    // Avdelingsnavnet står oppå selve reolen, én etikett per avdeling per gang,
    // slik at avdelinger som går over flere ganger merkes der de faktisk står.
    const departments = new Map<string, Vec2[]>();
    const facings = new Map<string, Fixture['facing']>();

    for (const fixture of plan.fixtures) {
      const n = FACING_VECTOR[fixture.facing];
      const c = rectCenter(fixture);
      const access = { x: c.x + n.x * (fixture.w / 2 + 1), y: c.y + n.y * (fixture.d / 2 + 1) };
      aisles.set(fixture.aisle, [...(aisles.get(fixture.aisle) ?? []), access]);
      const key = `${fixture.departmentId}|${fixture.aisle}`;
      departments.set(key, [...(departments.get(key) ?? []), c]);
      facings.set(key, fixture.facing);
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
      // De to sidene av samme gondolrad forskyves langs raden, ellers legger
      // navnene seg oppå hverandre.
      const facing = facings.get(key);
      const near = facing === 'west' || facing === 'north' ? 0.25 : 0.75;
      return {
        key,
        id,
        name: plan.departments.find((d) => d.id === id)?.name ?? id,
        x: vertical ? s.cx : s.minX + (s.maxX - s.minX) * near,
        y: vertical ? s.minY + (s.maxY - s.minY) * near : s.cy,
        vertical,
      };
    });

    return { aisleLabels, deptLabels };
  }, [plan]);
}

export function Map2D({ plan, targets, route, origin, picking, insets, onPick }: MapViewProps) {
  const targetFixtures = useMemo(() => new Set(targets.map((t) => t.fixture.id)), [targets]);
  const targetDepartments = useMemo(() => new Set(targets.map((t) => t.departmentId)), [targets]);
  const hasTargets = targets.length > 0;
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 20 });
  const { aisleLabels, deptLabels } = useAnnotations(plan);

  // Peker-tilstand for panorering, pinch, treghet og dobbelttrykk.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    moved: 0,
    pinchDist: 0,
    pinchX: 0,
    pinchY: 0,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  });

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

  const transformRef = useRef(transform);
  transformRef.current = transform;

  /**
   * iPhone-rammen kan være skalert ned. Peker-koordinater kommer i skjermpiksler,
   * så de må deles på skaleringen før de blir kartkoordinater.
   */
  const frameScale = useCallback(() => {
    const host = hostRef.current;
    if (!host || host.clientWidth === 0) return 1;
    return host.getBoundingClientRect().width / host.clientWidth;
  }, []);

  // Myk overgang mellom to utsnitt – kartet skal aldri hoppe.
  const animation = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (animation.current !== null) {
      cancelAnimationFrame(animation.current);
      animation.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (to: Transform) => {
      stopAnimation();
      const from = transformRef.current;
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (distance < 1 && Math.abs(Math.log(to.k / from.k)) < 0.01) {
        setTransform(to);
        return;
      }
      const duration = 460;
      const started = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - started) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        setTransform({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          // Zoom interpoleres logaritmisk, ellers føles den ujevn.
          k: Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e),
        });
        animation.current = p < 1 ? requestAnimationFrame(step) : null;
      };
      animation.current = requestAnimationFrame(step);
    },
    [stopAnimation],
  );

  useEffect(() => stopAnimation, [stopAnimation]);

  /** Sentrerer et område i den delen av kartet som faktisk er synlig. */
  const fitTo = useCallback(
    (
      box: { x: number; y: number; w: number; d: number },
      padding = 40,
      maxK = MAX_K,
      immediate = false,
    ) => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const { top, right, bottom } = insetsRef.current;
      const availableW = Math.max(120, w - right - padding * 2);
      const availableH = Math.max(120, h - top - bottom - padding * 2);
      const k = Math.max(MIN_K, Math.min(Math.min(availableW / box.w, availableH / box.d), maxK));
      const centreX = (w - right) / 2;
      const centreY = top + (h - top - bottom) / 2;
      const next = {
        k,
        x: centreX - (box.x + box.w / 2) * k,
        y: centreY - (box.y + box.d / 2) * k,
      };
      if (immediate) {
        stopAnimation();
        setTransform(next);
      } else {
        animateTo(next);
      }
    },
    [animateTo, stopAnimation],
  );

  // Første tilpasning: hele planen.
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || size.w === 0) return;
    fitted.current = true;
    fitTo({ x: 0, y: 0, w: plan.width, d: plan.depth }, 20, 40, true);
  }, [size.w, plan, fitTo]);

  // Zoom til ruten når den finnes, ellers til de valgte varene.
  const routeKey = route ? `${route.length}:${route[0]?.x},${route[0]?.y}` : '';
  const targetKey = targets.map((t) => t.id).join(',');
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
    } else if (targets.length === 1) {
      const { marker } = targets[0];
      fitTo({ x: marker.x - 6, y: marker.y - 6, w: 12, d: 12 }, 34, 34);
    } else if (targets.length > 1) {
      const xs = targets.map((t) => t.marker.x);
      const ys = targets.map((t) => t.marker.y);
      fitTo(
        {
          x: Math.min(...xs) - 2.5,
          y: Math.min(...ys) - 2.5,
          w: Math.max(3, Math.max(...xs) - Math.min(...xs) + 5),
          d: Math.max(3, Math.max(...ys) - Math.min(...ys) + 5),
        },
        34,
        30,
      );
    }
  }, [routeKey, targetKey, size.w, insets.right, insets.bottom, fitTo]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Skjermkoordinat → punkt i kartflaten, uavhengig av rammens skalering. */
  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const scale = frameScale();
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    },
    [frameScale],
  );

  const toWorld = useCallback(
    (clientX: number, clientY: number): Vec2 => {
      const local = toLocal(clientX, clientY);
      return {
        x: (local.x - transform.x) / transform.k,
        y: (local.y - transform.y) / transform.k,
      };
    },
    [toLocal, transform],
  );

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      stopAnimation();
      setTransform((t) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
        const scale = k / t.k;
        return { k, x: cx - (cx - t.x) * scale, y: cy - (cy - t.y) * scale };
      });
    },
    [stopAnimation],
  );

  /** Panorering med treghet – slipper man mens fingeren er i bevegelse, glir kartet ut. */
  const glide = useCallback(
    (vx: number, vy: number) => {
      stopAnimation();
      let velocityX = vx;
      let velocityY = vy;
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(32, now - last);
        last = now;
        velocityX *= Math.pow(0.94, dt / 16);
        velocityY *= Math.pow(0.94, dt / 16);
        setTransform((t) => ({ ...t, x: t.x + velocityX * dt, y: t.y + velocityY * dt }));
        if (Math.hypot(velocityX, velocityY) > 0.015) {
          animation.current = requestAnimationFrame(step);
        } else {
          animation.current = null;
        }
      };
      animation.current = requestAnimationFrame(step);
    },
    [stopAnimation],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    stopAnimation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture.current.moved = 0;
    gesture.current.velocityX = 0;
    gesture.current.velocityY = 0;
    gesture.current.lastTime = performance.now();

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.pinchX = (a.x + b.x) / 2;
      gesture.current.pinchY = (a.y + b.y) / 2;
      gesture.current.moved = 99; // to fingre er aldri et trykk
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    const scale = frameScale();

    // To fingre: zoom om midtpunktet, og flytt kartet med midtpunktet.
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;

      if (gesture.current.pinchDist > 0) {
        const local = toLocal(midX, midY);
        const panX = (midX - gesture.current.pinchX) / scale;
        const panY = (midY - gesture.current.pinchY) / scale;
        setTransform((t) => {
          const k = Math.min(MAX_K, Math.max(MIN_K, (t.k * dist) / gesture.current.pinchDist));
          const factor = k / t.k;
          return {
            k,
            x: local.x - (local.x - t.x) * factor + panX,
            y: local.y - (local.y - t.y) * factor + panY,
          };
        });
      }

      gesture.current.pinchDist = dist;
      gesture.current.pinchX = midX;
      gesture.current.pinchY = midY;
      return;
    }

    const dx = (next.x - previous.x) / scale;
    const dy = (next.y - previous.y) / scale;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    if (gesture.current.moved > 4) {
      const now = performance.now();
      const dt = Math.max(1, now - gesture.current.lastTime);
      gesture.current.velocityX = dx / dt;
      gesture.current.velocityY = dy / dt;
      gesture.current.lastTime = now;
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const wasSingle = pointers.current.size === 1;
    const wasTap = gesture.current.moved <= 4 && wasSingle;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current.pinchDist = 0;

    if (wasTap) {
      const now = performance.now();
      const isDoubleTap =
        !picking &&
        now - gesture.current.lastTapTime < 300 &&
        Math.hypot(event.clientX - gesture.current.lastTapX, event.clientY - gesture.current.lastTapY) < 30;

      gesture.current.lastTapTime = now;
      gesture.current.lastTapX = event.clientX;
      gesture.current.lastTapY = event.clientY;

      if (picking) {
        onPick(toWorld(event.clientX, event.clientY));
      } else if (isDoubleTap) {
        // Dobbelttrykk zoomer inn mot punktet, som i Kart.
        const local = toLocal(event.clientX, event.clientY);
        const t = transformRef.current;
        const k = Math.min(MAX_K, t.k * 2);
        const factor = k / t.k;
        animateTo({ k, x: local.x - (local.x - t.x) * factor, y: local.y - (local.y - t.y) * factor });
      }
      return;
    }

    if (wasSingle && Math.hypot(gesture.current.velocityX, gesture.current.velocityY) > 0.25) {
      glide(gesture.current.velocityX, gesture.current.velocityY);
    }
  };

  const onWheel = (event: React.WheelEvent) => {
    const local = toLocal(event.clientX, event.clientY);
    zoomAt(Math.exp(-event.deltaY * 0.0016), local.x, local.y);
  };

  /** Knappezoom mot midten av det synlige kartet, animert. */
  const zoomStep = (factor: number) => {
    const { w, h } = sizeRef.current;
    const cx = (w - insets.right) / 2;
    const cy = insets.top + (h - insets.top - insets.bottom) / 2;
    const t = transformRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
    const scale = k / t.k;
    animateTo({ k, x: cx - (cx - t.x) * scale, y: cy - (cy - t.y) * scale });
  };

  const routePath = route && route.length > 1 ? route.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') : null;
  const outlinePath = toPathData(plan.outline);
  const scaleMeters = 40 / transform.k;

  /**
   * Skriften i planen måles i meter, så uten dette vokser den med zoomen. Her
   * holdes den på samme skjermstørrelse, men aldri større enn reolen den står
   * på – og zoomer man helt ut, forsvinner den i stedet for å bli grøt.
   */
  const textSize = (px: number, maxMeters: number) => Math.min(maxMeters, px / transform.k);
  const deptFont = textSize(13, 0.95);
  const showDeptLabels = deptFont * transform.k >= 7.5;
  const aisleFont = textSize(12, 0.85);
  const showAisleLabels = aisleFont * transform.k >= 7;
  const smallFont = textSize(10.5, 0.7);
  const deptText = {
    fontSize: deptFont,
    strokeWidth: Math.min(0.26, textSize(3.4, 0.26)),
  };

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
        <defs>
          <clipPath id="plan-floor" clipPathUnits="userSpaceOnUse">
            <path d={outlinePath} />
          </clipPath>
        </defs>

        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          <path className="plan__floor" d={outlinePath} />

          {/* rutenett, 2 m */}
          <g className="plan__grid" clipPath="url(#plan-floor)">
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
            const isTarget = targetFixtures.has(fixture.id);
            const inDept = targetDepartments.has(fixture.departmentId);
            const className = isTarget
              ? 'plan__fixture plan__fixture--target'
              : inDept
                ? 'plan__fixture plan__fixture--dept'
                : hasTargets
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

          {/* avdelingsnavn – står oppå reolen de gjelder */}
          {showDeptLabels &&
            deptLabels.map((label) => (
            <text
              key={label.key}
              className={`plan__dept${targetFixtures.size && targetDepartments.has(label.id) ? ' plan__dept--active' : ''}`}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={label.vertical ? `rotate(-90 ${label.x} ${label.y})` : undefined}
              opacity={hasTargets && !targetDepartments.has(label.id) ? 0.35 : 1}
              style={deptText}
              >
                {label.name}
              </text>
            ))}

          {/* gangnummer */}
          {showAisleLabels &&
            aisleLabels.map((label) => (
            <text
              key={label.name}
              className="plan__label plan__label--aisle"
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
                style={{ fontSize: aisleFont }}
              >
                {label.name}
              </text>
            ))}

          {/* inngang og servicepunkter */}
          {plan.entrances.map((entrance) => (
            <g key={entrance.id}>
              <path
                className="plan__door"
                d={`M${entrance.position.x - 1.5} ${entrance.position.y + 0.9} L${entrance.position.x + 1.5} ${entrance.position.y + 0.9} M${entrance.position.x} ${entrance.position.y + 0.7} L${entrance.position.x} ${entrance.position.y - 0.5} M${entrance.position.x - 0.5} ${entrance.position.y - 0.05} L${entrance.position.x} ${entrance.position.y - 0.55} L${entrance.position.x + 0.5} ${entrance.position.y - 0.05}`}
              />
              <text
                className="plan__label"
                x={entrance.position.x}
                y={entrance.position.y - 1.15}
                textAnchor="middle"
                style={{ fontSize: smallFont }}
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
              style={{ fontSize: smallFont }}
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

          {/* varenes plassering */}
          {targets.map((item) => (
            <g key={item.id} className={item.done ? 'plan__target plan__target--done' : 'plan__target'}>
              <circle cx={item.marker.x} cy={item.marker.y} r={0.92} fill="#fff" />
              <circle
                className="plan__pin"
                cx={item.marker.x}
                cy={item.marker.y}
                r={item.stop ? 0.72 : 0.34}
              />
              {item.stop && (
                <text
                  className="plan__pin-label"
                  x={item.marker.x}
                  y={item.marker.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {item.stop}
                </text>
              )}
              <circle
                className="plan__pin-ring"
                cx={item.marker.x}
                cy={item.marker.y}
                r={item.stop ? 1.05 : 0.78}
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="map__zoom" style={{ right: 12 + insets.right, bottom: 16 + insets.bottom }}>
        <button type="button" aria-label="Zoom inn" onClick={() => zoomStep(1.6)}>
          <PlusIcon />
        </button>
        <button type="button" aria-label="Zoom ut" onClick={() => zoomStep(1 / 1.6)}>
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
