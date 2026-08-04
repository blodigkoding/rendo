import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Bunnark i iOS-stil: tre høyder man kan dra mellom. Kartet er alltid synlig
 * over arket, og man kan dra det ned for å se mer av butikken.
 */

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_FRACTION: Record<SheetSnap, number> = {
  peek: 0.27,
  half: 0.56,
  full: 0.9,
};

const ORDER: SheetSnap[] = ['peek', 'half', 'full'];

interface Props {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Alltid synlig topp – fungerer som dratak. */
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  label: string;
}

export function BottomSheet({ snap, onSnapChange, header, children, footer, label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  useEffect(() => {
    const parent = hostRef.current?.parentElement;
    if (!parent) return;
    // Trekk fra plassen den flytende fanelinja tar.
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.height - 84));
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const heightFor = useCallback(
    (which: SheetSnap) => Math.round(available * SNAP_FRACTION[which]),
    [available],
  );

  const drag = useRef({ active: false, startY: 0, startH: 0, lastY: 0, lastT: 0, velocity: 0 });

  const onPointerDown = (event: React.PointerEvent) => {
    if (available === 0) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      startY: event.clientY,
      startH: heightFor(snap),
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
    };
    setDragHeight(heightFor(snap));
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.velocity = (drag.current.lastY - event.clientY) / dt; // + = drar oppover
    drag.current.lastY = event.clientY;
    drag.current.lastT = now;

    const raw = drag.current.startH + (drag.current.startY - event.clientY);
    const min = heightFor('peek') - 40;
    const max = heightFor('full') + 40;
    setDragHeight(Math.min(max, Math.max(min, raw)));
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    const released = dragHeight ?? heightFor(snap);
    drag.current.active = false;
    setDragHeight(null);

    // Et raskt kast flytter ett hakk; ellers går vi til nærmeste høyde.
    const velocity = drag.current.velocity;
    if (Math.abs(velocity) > 0.5) {
      const index = ORDER.indexOf(snap);
      const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, index + (velocity > 0 ? 1 : -1)))];
      onSnapChange(next);
      return;
    }

    let closest = ORDER[0];
    for (const candidate of ORDER) {
      if (Math.abs(heightFor(candidate) - released) < Math.abs(heightFor(closest) - released)) {
        closest = candidate;
      }
    }
    onSnapChange(closest);
  };

  const height = dragHeight ?? heightFor(snap);

  return (
    <section
      ref={hostRef}
      className="sheet"
      style={{ height, transition: dragHeight === null ? undefined : 'none' }}
      aria-label={label}
    >
      <div
        className="sheet__grab"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="sheet__grip" />
        {header}
      </div>
      <div className="sheet__body">{children}</div>
      {footer && <div className="sheet__footer">{footer}</div>}
    </section>
  );
}

/** Høyden arket dekker akkurat nå – kartet bruker den til innramming. */
export function sheetHeight(available: number, snap: SheetSnap): number {
  return Math.round(available * SNAP_FRACTION[snap]);
}
