import { useCallback, useEffect, useState } from 'react';

/** Innstillinger brukeren setter selv. Lagres lokalt, som resten. */
export interface Settings {
  /** Hvilken visning butikken åpner i. */
  defaultView: '2d' | '3d';
  /** Vis avdelingsnavn oppå reolene. */
  showLabels: boolean;
}

const KEY = 'rendo:settings';
const DEFAULTS: Settings = { defaultView: '3d', showLabels: true };

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULTS;
    const value = parsed as Partial<Settings>;
    return {
      defaultView: value.defaultView === '2d' ? '2d' : '3d',
      showLabels: value.showLabels !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings(): [Settings, (next: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(readSettings);

  useEffect(() => {
    const onStorage = () => setSettings(readSettings());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: Partial<Settings>) => {
    setSettings((current) => {
      const merged = { ...current, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {
        // Privat modus – innstillingen lever bare i denne økten.
      }
      return merged;
    });
  }, []);

  return [settings, update];
}
