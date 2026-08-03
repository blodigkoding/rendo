import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataSource } from '../data';
import type { Product, Store, StorePlan, Vec2 } from '../data/types';
import { buildDirections } from '../lib/directions';
import { fixtureAccessPoint, pathLength, productMarker } from '../lib/geometry';
import { buildNavGrid, findRoute, type RouteResult } from '../lib/pathfinding';
import { Map2D, type MapTarget } from './Map2D';
import { Map3D } from './Map3D';
import { ProductPanel } from './ProductPanel';
import { SearchField } from './SearchField';
import { BackIcon } from './icons';

interface Props {
  storeId: string;
  onBack: () => void;
}

type View = '2d' | '3d';

export function StorePage({ storeId, onBack }: Props) {
  const [store, setStore] = useState<Store | null>(null);
  const [plan, setPlan] = useState<StorePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>('2d');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [product, setProduct] = useState<Product | null>(null);
  const [picking, setPicking] = useState(false);
  const [origin, setOrigin] = useState<Vec2 | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([dataSource.getStore(storeId), dataSource.getStorePlan(storeId)]).then(
      ([storeResult, planResult]) => {
        if (!active) return;
        setStore(storeResult);
        setPlan(planResult);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      dataSource.searchProducts(storeId, query).then((found) => {
        if (!active) return;
        setResults(found);
        setActiveIndex(0);
      });
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, storeId]);

  // Klikk utenfor søket lukker trefflista.
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResultsOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  const grid = useMemo(() => (plan ? buildNavGrid(plan) : null), [plan]);

  const fixture = useMemo(() => {
    if (!plan || !product) return null;
    return plan.fixtures.find((f) => f.id === product.placement.fixtureId) ?? null;
  }, [plan, product]);

  const target: MapTarget | null = useMemo(() => {
    if (!fixture || !product) return null;
    return {
      fixture,
      marker: productMarker(fixture, product.placement.offsetCm),
      departmentId: product.departmentId,
      heightCm: product.placement.heightCm,
    };
  }, [fixture, product]);

  const steps = useMemo(() => {
    if (!route || !fixture) return [];
    return buildDirections(route.points, fixture, fixture.aisle);
  }, [route, fixture]);

  const routeMeters = route ? pathLength(route.points) : null;

  const clearRoute = useCallback(() => {
    setRoute(null);
    setOrigin(null);
    setPicking(false);
    setRouteError(null);
  }, []);

  const selectProduct = useCallback(
    (next: Product) => {
      setProduct(next);
      setResultsOpen(false);
      clearRoute();
    },
    [clearRoute],
  );

  const handlePick = useCallback(
    (point: Vec2) => {
      if (!grid || !fixture) return;
      const goal = fixtureAccessPoint(fixture);
      const found = findRoute(grid, point, goal);
      if (!found) {
        setRouteError('Fant ingen vei fra det punktet. Prøv å trykke i en gang.');
        return;
      }
      setOrigin(found.start);
      setRoute(found);
      setPicking(false);
      setRouteError(null);
    },
    [grid, fixture],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (picking) setPicking(false);
      else if (route) clearRoute();
      else if (product) setProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picking, route, product, clearRoute]);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectProduct(results[activeIndex]);
    }
  };

  const departmentName = (id: string) => plan?.departments.find((d) => d.id === id)?.name ?? id;
  const fixtureCode = (item: Product) =>
    plan?.fixtures.find((f) => f.id === item.placement.fixtureId)?.code ?? '';

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Laster butikk …</div>
      </div>
    );
  }

  if (!store || !plan) {
    return (
      <div className="app">
        <div className="loading">
          Fant ingen plantegning for denne butikken.{' '}
          <button className="btn btn--ghost btn--sm" onClick={onBack} style={{ marginLeft: 12 }} type="button">
            Tilbake
          </button>
        </div>
      </div>
    );
  }

  const MapView = view === '2d' ? Map2D : Map3D;

  return (
    <div className="store">
      <header className="store__header">
        <button className="icon-btn" onClick={onBack} aria-label="Tilbake til butikksøk" type="button">
          <BackIcon />
        </button>
        <div className="store__title">
          <h1>{store.name}</h1>
          <p>
            {store.address}, {store.city} · {store.openingHours}
          </p>
        </div>
        <div className="view-toggle" role="group" aria-label="Visning">
          <button data-active={view === '2d'} onClick={() => setView('2d')} type="button">
            2D
          </button>
          <button data-active={view === '3d'} onClick={() => setView('3d')} type="button">
            3D
          </button>
        </div>
      </header>

      <div className="store__searchbar" ref={searchRef}>
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value);
            setResultsOpen(true);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder="Søk etter vare"
          aria-label="Søk etter vare i butikken"
        />
        {resultsOpen && query.trim() !== '' && (
          <div className="results fade-in">
            {results.length === 0 ? (
              <div className="empty" style={{ padding: '18px 0' }}>
                Ingen varer matcher «{query}».
              </div>
            ) : (
              results.map((item, index) => (
                <button
                  key={item.id}
                  className="result"
                  data-active={index === activeIndex}
                  onPointerEnter={() => setActiveIndex(index)}
                  onClick={() => selectProduct(item)}
                  type="button"
                >
                  <span className="result__main">
                    <span className="result__name">{item.name}</span>
                    <span className="result__sub">
                      {item.brand} · {departmentName(item.departmentId)}
                    </span>
                  </span>
                  <span className="result__code mono">{fixtureCode(item)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <MapView
        plan={plan}
        target={target}
        route={route ? route.points : null}
        origin={origin}
        picking={picking}
        onPick={handlePick}
      />

      {(picking || routeError) && (
        <div className="map__hint">
          <span>{routeError ?? 'Trykk på kartet der du står'}</span>
          <button onClick={() => { setPicking(false); setRouteError(null); }} type="button">
            Avbryt
          </button>
        </div>
      )}

      {product && fixture && (
        <ProductPanel
          product={product}
          fixture={fixture}
          departmentName={departmentName(product.departmentId)}
          routeMeters={routeMeters}
          steps={steps}
          picking={picking}
          onShowRoute={() => {
            setRouteError(null);
            setPicking(true);
          }}
          onClearRoute={clearRoute}
          onClose={() => {
            setProduct(null);
            clearRoute();
          }}
        />
      )}
    </div>
  );
}
