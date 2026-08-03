import { useEffect, useState, type ReactNode } from 'react';

/**
 * rendo er en iPhone-app. På en telefon fyller den skjermen; på alt annet vises
 * den i en iPhone 17 mot sort bakgrunn, i riktig størrelse (402 × 874 punkter,
 * 6,3").
 */

const SCREEN_W = 402;
const SCREEN_H = 874;
/** Under denne bredden er vi på en ekte telefon – da droppes rammen. */
const BARE_BREAKPOINT = 520;

function StatusBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="statusbar" aria-hidden="true">
      <span className="statusbar__time">{time}</span>
      <span className="statusbar__island" />
      <span className="statusbar__icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8.5" width="3" height="3.5" rx="0.8" />
          <rect x="4.6" y="6" width="3" height="6" rx="0.8" />
          <rect x="9.2" y="3.2" width="3" height="8.8" rx="0.8" />
          <rect x="13.8" y="0" width="3" height="12" rx="0.8" opacity="0.35" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M1 4.2a10 10 0 0 1 14 0" strokeLinecap="round" />
          <path d="M3.6 7a6.4 6.4 0 0 1 8.8 0" strokeLinecap="round" />
          <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
          <rect x="2.2" y="2.2" width="14" height="7.6" rx="1.8" fill="currentColor" />
          <path d="M23.4 4.2v3.6a2 2 0 0 0 0-3.6z" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

export function DeviceFrame({ children }: { children: ReactNode }) {
  const [bare, setBare] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= BARE_BREAKPOINT,
  );
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setBare(window.innerWidth <= BARE_BREAKPOINT);
      const fit = Math.min(
        (window.innerHeight - 56) / SCREEN_H,
        (window.innerWidth - 56) / SCREEN_W,
        1,
      );
      setScale(Math.max(0.4, fit));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (bare) {
    return (
      <div className="device device--bare">
        <div className="device__app">{children}</div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div
        className="device"
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transform: `scale(${scale})`,
        }}
      >
        <StatusBar />
        <div className="device__app">{children}</div>
        <div className="device__home" aria-hidden="true" />
      </div>
    </div>
  );
}
