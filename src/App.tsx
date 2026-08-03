import { useCallback, useEffect, useState } from 'react';
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

  if (storeMatch) {
    return (
      <div className="app">
        <StorePage storeId={storeMatch[1]} onBack={() => navigate('/')} />
      </div>
    );
  }

  return (
    <div className="app">
      <HomePage onOpenStore={(storeId) => navigate(`/butikk/${storeId}`)} />
    </div>
  );
}
