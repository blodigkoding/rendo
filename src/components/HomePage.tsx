import { useEffect, useState } from 'react';
import { dataSource } from '../data';
import type { Store } from '../data/types';
import { SearchField } from './SearchField';
import { ChevronRight } from './icons';

interface Props {
  onOpenStore: (storeId: string) => void;
}

export function HomePage({ onOpenStore }: Props) {
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      dataSource.searchStores(query).then((result) => {
        if (!active) return;
        setStores(result);
        setLoading(false);
      });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="home">
      <div className="home__inner">
        <header className="home__brand">
          <h1 className="home__logo">rendo</h1>
          <p className="home__tagline">Finn varen i butikken – ikke bare i butikken.</p>
        </header>

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Søk etter butikk eller sted"
          autoFocus
          aria-label="Søk etter butikk"
        />

        <div className="home__label meta">{query ? 'Treff' : 'Butikker i nærheten'}</div>

        {loading && stores.length === 0 ? (
          <div className="empty">Laster …</div>
        ) : stores.length === 0 ? (
          <div className="empty">Ingen butikker matcher «{query}».</div>
        ) : (
          <div className="store-list fade-in">
            {stores.map((store) => (
              <button
                key={store.id}
                className="store-row"
                onClick={() => store.hasMap && onOpenStore(store.id)}
                disabled={!store.hasMap}
                type="button"
              >
                <span className="store-row__main">
                  <span className="store-row__name">{store.name}</span>
                  <span className="store-row__sub">
                    {store.address}, {store.postalCode} {store.city} · {store.openingHours}
                  </span>
                </span>
                <span className="store-row__right">
                  <span className="mono">{store.distanceKm.toFixed(1).replace('.', ',')} km</span>
                  {store.hasMap ? (
                    <ChevronRight />
                  ) : (
                    <span className="tag tag--muted">Kart kommer</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
