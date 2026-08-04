import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture, StorePlan, Vec2 } from '../data/types';
import { FACING_VECTOR, rectCenter } from '../lib/geometry';
import { toPathData } from '../lib/polygon';
import type { Fix } from '../lib/positioning';
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
  /** Hvor kunden er akkurat nå, når veibeskrivelsen spilles av. */
  fix?: Fix | null;
  picking: boolean;
  /** Avdelingsnavn i kartet – skrus av og på i profilen. */
  showLabels?: boolean;
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

export function Map2D({
  plan,
  targets,
  route,
  origin,
  fix,
  picking,
  showLabels = true,
  insets,
  onPick,
}: MapViewProps) {
  const targetFixtures = useMemo(() => new Set(targets.map((t) => t.fixture.id)), [targets]);
  const targetDepartments = useMemo(() => new Set(targets.map((t) => t.departmentId)), [targets]);
  const hasTargets = targets.length > 0;
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 20 });
  const { aisleLabels, deptLabels } = useAnnotations(plan);

  /** Har brukeren flyttet eller zoomet kartet selv? */
  const moved = useRef(false);

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

  // Zoom til ruten når den finnes, ellers til de valgte varene. Har brukeren
  // flyttet kartet selv, lar vi det stå – ingenting er mer irriterende enn et
  // kart som hopper tilbake.
  const routeKey = route ? `${route.length}:${route[0]?.x},${route[0]?.y}` : '';
  const targetKey = targets.map((t) => t.id).join(',');
  const lastFitKey = useRef('');
  useEffect(() => {
    if (size.w === 0) return;
    const key = `${routeKey}|${targetKey}`;
    if (key !== lastFitKey.current) {
      lastFitKey.current = key;
      moved.current = false;
    } else if (moved.current) {
      return;
    }
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
      moved.current = true;
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
        moved.current = true;
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
      moved.current = true;
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
    moved.current = true;
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

  /**
   * Innredningen henger bare sammen med planen og hva som er valgt – ikke med
   * panorering og zoom. Uten dette bygges fire hundre SVG-noder på nytt for
   * hvert bilde man drar kartet.
   */
  const staticLayers = useMemo(
    () => (
      <>
          {/* kasser */}
        {plan.checkouts.map((counter) => (
          <g key={counter.id}>
            <rect
              className="plan__checkout"
              x={counter.x}
              y={counter.y}
              width={counter.w}
              height={counter.d}
              rx={0.12}
            />
            <line
              className="plan__belt"
              x1={counter.x + 0.2}
              y1={counter.y + counter.d / 2}
              x2={counter.x + counter.w - 0.5}
              y2={counter.y + counter.d / 2}
            />
          </g>
        ))}

        {/* lukkede rom, som lageret bak vareutleveringen */}
        {plan.rooms.map((room) => {
          const vertical = room.opening.side === 'west' || room.opening.side === 'east';
          const wallX = room.opening.side === 'west' ? room.x : room.x + room.w;
          const wallY = room.opening.side === 'north' ? room.y : room.y + room.d;
          const from = room.opening.at;
          const to = room.opening.at + room.opening.width;
          return (
            <g key={room.id}>
              <rect
                className="plan__room"
                x={room.x}
                y={room.y}
                width={room.w}
                height={room.d}
              />
              <line
                className="plan__opening"
                x1={vertical ? wallX : room.x + from}
                y1={vertical ? room.y + from : wallY}
                x2={vertical ? wallX : room.x + to}
                y2={vertical ? room.y + to : wallY}
              />
            </g>
          );
        })}

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

        {/* inngang og servicepunkter */}
        {plan.entrances.map((entrance) => (
          <g key={entrance.id}>
            <path
              className="plan__door"
              d={`M${entrance.position.x - 1.5} ${entrance.position.y + 0.9} L${entrance.position.x + 1.5} ${entrance.position.y + 0.9} M${entrance.position.x} ${entrance.position.y + 0.7} L${entrance.position.x} ${entrance.position.y - 0.5} M${entrance.position.x - 0.5} ${entrance.position.y - 0.05} L${entrance.position.x} ${entrance.position.y - 0.55} L${entrance.position.x + 0.5} ${entrance.position.y - 0.05}`}
            />
          </g>
        ))}

      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, targetKey, hasTargets],
  );
  const scaleMeters = 40 / transform.k;

  /**
   * Etikettene tegnes i skjermplanet, ikke i kartet. Da har skriften alltid
   * samme størrelse og flyter ikke når man zoomer. Er man zoomet langt ut, er
   * det ikke plass til navnene – da vises de ikke.
   */
  const showDeptLabels = showLabels && transform.k >= 9;
  const showAisleLabels = showLabels && transform.k >= 11;

  /** Etiketter som ville lagt seg oppå hverandre, dropper vi. */
  const placedLabels = useMemo(() => {
    if (!showDeptLabels) return [];
    const taken: Array<{ x: number; y: number }> = [];
    return deptLabels.filter((label) => {
      const x = label.x * transform.k + transform.x;
      const y = label.y * transform.k + transform.y;
      // Loddrette navn er smale og høye, vannrette motsatt.
      const near = taken.some((p) =>
        label.vertical
          ? Math.abs(p.x - x) < 26 && Math.abs(p.y - y) < 96
          : Math.abs(p.x - x) < 110 && Math.abs(p.y - y) < 22,
      );
      if (near) return false;
      taken.push({ x, y });
      return true;
    });
  }, [deptLabels, showDeptLabels, transform]);

  return (
    <div
      ref={hostRef}
      className={`map map--plan${picking ? ' map--picking' : ''}`}
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
          <filter id="plan-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={0.4} />
          </filter>
        </defs>

        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {/* Myk slagskygge, så gulvplaten løfter seg fra bakgrunnen. */}
          <path
            className="plan__shadow"
            d={outlinePath}
            transform="translate(0.55 0.75)"
            filter="url(#plan-blur)"
          />
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

          {staticLayers}

          {/* rute */}
          {routePath && (
            <g>
              <path className="plan__route-halo" d={routePath} />
              <path className="plan__route" d={routePath} />
              <path className="plan__route-dash" d={routePath} />
            </g>
          )}

          {/* der man er nå, mens man går */}
          {fix && (
            <g>
              <circle className="plan__origin-ring" cx={fix.point.x} cy={fix.point.y} r={0.7} />
              <circle className="plan__origin-dot" cx={fix.point.x} cy={fix.point.y} r={0.32} />
              <path
                className="plan__heading"
                d={`M${fix.point.x + Math.cos(fix.heading) * 1.5} ${fix.point.y + Math.sin(fix.heading) * 1.5} L${fix.point.x + Math.cos(fix.heading + 2.5) * 0.55} ${fix.point.y + Math.sin(fix.heading + 2.5) * 0.55} L${fix.point.x + Math.cos(fix.heading - 2.5) * 0.55} ${fix.point.y + Math.sin(fix.heading - 2.5) * 0.55} Z`}
              />
            </g>
          )}

          {/* startpunkt */}
          {!fix && origin && (
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

      <div className="map__labels" aria-hidden="true">
        {placedLabels.map((label) => (
            <div
              key={label.key}
              className={`scene__tag${hasTargets && !targetDepartments.has(label.id) ? ' scene__tag--muted' : ''}`}
              style={{
                transform: `translate(${label.x * transform.k + transform.x}px, ${label.y * transform.k + transform.y}px) translate(-50%, -50%)${label.vertical ? ' rotate(-90deg)' : ''}`,
              }}
          >
            {label.name}
          </div>
        ))}
        {showAisleLabels &&
          aisleLabels.map((label) => (
            <div
              key={label.name}
              className="scene__tag scene__tag--soft"
              style={{
                transform: `translate(${label.x * transform.k + transform.x}px, ${label.y * transform.k + transform.y}px) translate(-50%, -50%)`,
              }}
            >
              {label.name}
            </div>
          ))}
        {plan.entrances.map((entrance) => (
          <div
            key={entrance.id}
            className="scene__tag scene__tag--soft"
            style={{
              transform: `translate(${entrance.position.x * transform.k + transform.x}px, ${(entrance.position.y - 1.4) * transform.k + transform.y}px) translate(-50%, -50%)`,
            }}
          >
            {entrance.name}
          </div>
        ))}
        {plan.checkouts.slice(0, 1).map((counter) => (
          <div
            key={counter.id}
            className="scene__tag scene__tag--soft"
            style={{
              transform: `translate(${(counter.x + counter.w / 2) * transform.k + transform.x}px, ${(counter.y + counter.d + 0.9) * transform.k + transform.y}px) translate(-50%, -50%)`,
            }}
          >
            Kasser
          </div>
        ))}
        {plan.rooms.map((room) => (
          <div
            key={room.id}
            className="scene__tag scene__tag--soft"
            style={{
              transform: `translate(${(room.x + room.w / 2) * transform.k + transform.x}px, ${(room.y + room.d / 2) * transform.k + transform.y}px) translate(-50%, -50%)`,
            }}
          >
            {room.name}
          </div>
        ))}
        {plan.landmarks
          .filter((landmark) => landmark.id !== 'lm-kasser')
          .map((landmark) => (
          <div
            key={landmark.id}
            className="scene__tag scene__tag--soft"
            style={{
              transform: `translate(${landmark.position.x * transform.k + transform.x}px, ${landmark.position.y * transform.k + transform.y}px) translate(-50%, -50%)`,
            }}
          >
              {landmark.name}
            </div>
          ))}
      </div>

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
