import { useCallback, useEffect, useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { HomePage } from './components/HomePage';
import { StorePage } from './components/StorePage';
import { TabBar, type Tab } from './components/TabBar';

/**
 * Ruting: «#/butikker» er butikkvelgeren, «#/butikk/<id>/<fane>» er en butikk.
 * Fanelinja ligger her, over alt annet, så den er den samme uansett hvor man er.
 */
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
const STORE_TABS: Tab[] = ['plan', 'handleliste', 'profil'];

function readLastStore(): string | null {
  try {
    return localStorage.getItem(LAST_STORE);
  } catch {
    return null;
  }
}

export function App() {
  const [path, navigate] = useHashRoute();
  const [listCount, setListCount] = useState(0);

  const storeMatch = /^\/butikk\/([^/]+)(?:\/([^/]+))?$/.exec(path);
  const storeId = storeMatch?.[1] ?? null;
  const routeTab = storeMatch?.[2] as Tab | undefined;
  const tab: Tab = storeId ? (routeTab && STORE_TABS.includes(routeTab) ? routeTab : 'plan') : 'butikker';

  // rendo åpner der du var sist – man handler som regel i samme butikk.
  useEffect(() => {
    if (storeId) {
      try {
        localStorage.setItem(LAST_STORE, storeId);
      } catch {
        // Privat modus – da starter vi i butikkvelgeren hver gang.
      }
      return;
    }
    if (path === '/') {
      const last = readLastStore();
      navigate(last ? `/butikk/${last}` : '/butikker');
    }
  }, [path, storeId, navigate]);

  const goToTab = useCallback(
    (next: Tab) => {
      if (next === 'butikker') {
        navigate('/butikker');
        return;
      }
      const target = storeId ?? readLastStore();
      // Uten en valgt butikk er det ingenting å vise – da blir det butikkvelgeren.
      navigate(target ? `/butikk/${target}/${next}` : '/butikker');
    },
    [storeId, navigate],
  );

  return (
    <DeviceFrame>
      {storeId ? (
        <StorePage
          key={storeId}
          storeId={storeId}
          tab={tab}
          onTabChange={goToTab}
          onSwitchStore={() => navigate('/butikker')}
          onListCount={setListCount}
        />
      ) : (
        <HomePage onOpenStore={(id) => navigate(`/butikk/${id}/plan`)} />
      )}

      <TabBar active={tab} listCount={listCount} onSelect={goToTab} />
    </DeviceFrame>
  );
}
