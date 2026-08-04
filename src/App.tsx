import { useCallback, useEffect, useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { HomePage } from './components/HomePage';
import { StorePage } from './components/StorePage';

/** Ruting: «#/butikker» er butikkvelgeren, «#/butikk/<id>» er en butikk. */
function useHashRoute(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: string) => {
    window.location.hash = next;
  }, []);

  return [path, navigate];
}

const LAST_STORE = 'rendo:last-store';

export function App() {
  const [path, navigate] = useHashRoute();
  const storeMatch = /^\/butikk\/([^/]+)$/.exec(path);

  // rendo åpner der du var sist – man handler som regel i samme butikk.
  useEffect(() => {
    if (storeMatch) {
      try {
        localStorage.setItem(LAST_STORE, storeMatch[1]);
      } catch {
        // Privat modus – da starter vi i butikkvelgeren hver gang.
      }
      return;
    }
    if (path === '/') {
      let last: string | null = null;
      try {
        last = localStorage.getItem(LAST_STORE);
      } catch {
        last = null;
      }
      navigate(last ? `/butikk/${last}` : '/butikker');
    }
  }, [path, storeMatch, navigate]);

  return (
    <DeviceFrame>
      {storeMatch ? (
        <StorePage
          key={storeMatch[1]}
          storeId={storeMatch[1]}
          onSwitchStore={() => navigate('/butikker')}
        />
      ) : (
        <HomePage onOpenStore={(storeId) => navigate(`/butikk/${storeId}`)} />
      )}
    </DeviceFrame>
  );
}
