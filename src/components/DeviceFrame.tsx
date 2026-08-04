import { useEffect, useState, type ReactNode } from 'react';

/**
 * rendo er en iPhone-app. På en telefon fyller den skjermen; på alt annet vises
 * den i en iPhone 17 mot sort bakgrunn, i riktig størrelse (402 × 874 punkter,
 * 6,3").
 */

const SCREEN_W = 402;
const SCREEN_H = 874;

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

/**
 * Slår av nettleserens egen knipezoom. Uten dette zoomer Safari hele siden –
 * inkludert den sorte bakgrunnen – i stedet for at kartet zoomer.
 */
function useNoBrowserZoom() {
  useEffect(() => {
    const stop = (event: Event) => event.preventDefault();

    // Safari på iOS/macOS: egne gesture-hendelser for knip.
    document.addEventListener('gesturestart', stop, { passive: false });
    document.addEventListener('gesturechange', stop, { passive: false });
    document.addEventListener('gestureend', stop, { passive: false });

    // Flerfingerberøring skal aldri gi sidezoom.
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    // Ctrl/⌘ + hjul er nettleserzoom på desktop.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };
    document.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', stop);
      document.removeEventListener('gesturechange', stop);
      document.removeEventListener('gestureend', stop);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('wheel', onWheel);
    };
  }, []);
}

/**
 * Skal appen fylle skjermen?
 *
 * På en ekte telefon gir det ingen mening å tegne en telefon rundt appen – da
 * er rammen bare svarte kanter som stjeler plass. Vi fyller skjermen når appen
 * er installert på hjemskjermen, og når vi faktisk står på en telefon: en
 * berøringsskjerm der korteste side er under 550 punkter. Et smalt vindu på en
 * PC har fin peker og får rammen som før.
 */
function isPhone() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true) {
    return true;
  }
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return window.matchMedia('(pointer: coarse)').matches && shortSide <= 550;
}

export function DeviceFrame({ children }: { children: ReactNode }) {
  const [bare, setBare] = useState(isPhone);

  // Rotasjon og skjermbytte kan endre svaret.
  useEffect(() => {
    const update = () => setBare(isPhone());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  const [scale, setScale] = useState(1);

  useNoBrowserZoom();

  /**
   * `100%` og `100vh` måler layout-viewporten, som på mobil er høyere enn det
   * man faktisk ser under adresselinja. Da havner bunnen av telefonen utenfor
   * skjermen. Vi måler den synlige viewporten i stedet.
   */
  useEffect(() => {
    if (bare) return;
    const view = window.visualViewport;

    const update = () => {
      const width = view?.width ?? window.innerWidth;
      const height = view?.height ?? window.innerHeight;
      // Litt luft rundt, men aldri så mye at telefonen ikke får plass.
      const margin = Math.min(40, height * 0.05);
      const fit = Math.min((height - margin) / SCREEN_H, (width - margin) / SCREEN_W, 1);
      setScale(Math.max(0.3, fit));
    };

    update();
    view?.addEventListener('resize', update);
    view?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      view?.removeEventListener('resize', update);
      view?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [bare]);

  if (bare) {
    return (
      <div className="device device--bare">
        <div className="device__app">{children}</div>
      </div>
    );
  }

  return (
    <div className="stage">
      {/*
        Ytterboksen har den skalerte størrelsen. Uten den ville nettleseren
        forsøkt å sentrere en boks på 874 piksler i en skjerm som er lavere, og
        da klippes bunnen bort i stedet for å sentreres.
      */}
      <div
        className="stage__fit"
        style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}
      >
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
    </div>
  );
}
