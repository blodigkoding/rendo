import { useEffect, useState } from 'react';
import { dataSource } from '../data';
import type { Chain, Store } from '../data/types';
import { ChainLogo } from './ChainLogo';
import { SearchField } from './SearchField';
import { StoreIsoArt } from './StoreIsoArt';

interface Props {
  onOpenStore: (storeId: string) => void;
}

export function HomePage({ onOpenStore }: Props) {
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [chains, setChains] = useState<Map<string, Chain>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataSource.listChains().then((list) => setChains(new Map(list.map((c) => [c.id, c]))));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      dataSource.searchStores(query).then((result) => {
        if (!active) return;
        setStores(result);
        setLoading(false);
      });
    }, 110);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="home">
      <header className="home__brand">
        <h1 className="home__logo">rendo</h1>
        <p className="home__tagline">Finn varen i butikken – ikke bare butikken.</p>
      </header>

      <div className="home__search">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Søk etter butikk eller sted"
          aria-label="Søk etter butikk"
        />
      </div>

      <div className="home__list">
        <div className="home__label meta">{query ? 'Treff' : 'Butikker i nærheten'}</div>

        {loading && stores.length === 0 ? (
          <div className="store-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="store-card">
                <span className="store-card__art skeleton" />
                <span className="skeleton skeleton--line" />
                <span className="skeleton skeleton--line skeleton--short" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="empty">Ingen butikker matcher «{query}».</div>
        ) : (
          <div className="store-grid fade-in">
            {stores.map((store) => {
              const chain = chains.get(store.chainId);
              return (
                <button
                  key={store.id}
                  className="store-card"
                  onClick={() => store.hasMap && onOpenStore(store.id)}
                  disabled={!store.hasMap}
                  type="button"
                >
                  <span className="store-card__art">
                    <StoreIsoArt store={store} chain={chain} className="store-card__iso" />
                  </span>
                  <span className="store-card__chain">
                    {chain ? <ChainLogo chain={chain} size={14} /> : store.chain}
                  </span>
                  <span className="store-card__name">{store.name}</span>
                  <span className="store-card__meta">
                    {store.distanceKm.toFixed(1).replace('.', ',')} km · {store.openingHours}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
