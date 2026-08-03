import { useCallback, useEffect, useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { HomePage } from './components/HomePage';
import { StorePage } from './components/StorePage';

/** Enkel hash-basert ruting: «#/» og «#/butikk/<id>». */
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

export function App() {
  const [path, navigate] = useHashRoute();
  const storeMatch = /^\/butikk\/([^/]+)$/.exec(path);

  return (
    <DeviceFrame>
      {storeMatch ? (
        <StorePage key={storeMatch[1]} storeId={storeMatch[1]} onBack={() => navigate('/')} />
      ) : (
        <HomePage onOpenStore={(storeId) => navigate(`/butikk/${storeId}`)} />
      )}
    </DeviceFrame>
  );
}
