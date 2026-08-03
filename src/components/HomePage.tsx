import { useEffect, useState } from 'react';
import { dataSource } from '../data';
import type { Chain, Store } from '../data/types';
import { SearchField } from './SearchField';
import { Wordmark } from './Wordmark';
import { ChevronRight } from './icons';

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
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="store-row">
                <span className="store-row__badge skeleton" />
                <span className="store-row__main">
                  <span className="skeleton skeleton--line" />
                  <span className="skeleton skeleton--line skeleton--short" />
                </span>
              </div>
            ))}
          </>
        ) : stores.length === 0 ? (
          <div className="empty">Ingen butikker matcher «{query}».</div>
        ) : (
          <div className="fade-in">
            {stores.map((store) => {
              const chain = chains.get(store.chainId);
              return (
                <button
                  key={store.id}
                  className="store-row"
                  onClick={() => store.hasMap && onOpenStore(store.id)}
                  disabled={!store.hasMap}
                  type="button"
                >
                  <span
                    className="store-row__badge"
                    style={chain ? { borderColor: `${chain.accent}33` } : undefined}
                  >
                    {chain ? <Wordmark chain={chain} /> : null}
                  </span>
                  <span className="store-row__main">
                    <span className="store-row__name">{store.name}</span>
                    <span className="store-row__sub">
                      {store.address} · {store.openingHours}
                    </span>
                  </span>
                  <span className="store-row__right">
                    <span className="mono">{store.distanceKm.toFixed(1).replace('.', ',')} km</span>
                    <ChevronRight />
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
