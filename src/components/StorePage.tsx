import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataSource } from '../data';
import type { Chain, Product, Store, StorePlan, Vec2 } from '../data/types';
import { buildDirections } from '../lib/directions';
import { fixtureAccessPoint, pathLength, productMarker } from '../lib/geometry';
import { buildNavGrid, findRoute, type RouteResult } from '../lib/pathfinding';
import { useShoppingList } from '../lib/shoppingList';
import { planTour, type Tour } from '../lib/tour';
import { sheetHeight, type SheetSnap } from './BottomSheet';
import { Map2D, type MapInsets, type MapTarget } from './Map2D';
import { ProductSheet } from './ProductSheet';
import { SearchOverlay } from './SearchOverlay';
import { ShoppingListOverlay } from './ShoppingListOverlay';
import { TourSheet } from './TourSheet';
import { Wordmark } from './Wordmark';
import { BackIcon, CubeIcon, ListIcon, SearchIcon } from './icons';

/** three.js lastes først når noen faktisk ber om 3D. */
const Map3D = lazy(() => import('./Map3D').then((module) => ({ default: module.Map3D })));

interface Props {
  storeId: string;
  onBack: () => void;
}

type View = '2d' | '3d';
type PickIntent = 'single' | 'tour' | null;

const SEARCHBAR_INSET = 74;

export function StorePage({ storeId, onBack }: Props) {
  const [store, setStore] = useState<Store | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [plan, setPlan] = useState<StorePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>('2d');
  const [searchOpen, setSearchOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [pickIntent, setPickIntent] = useState<PickIntent>(null);
  const [origin, setOrigin] = useState<Vec2 | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [tour, setTour] = useState<Tour<Product> | null>(null);
  const [arrived, setArrived] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const list = useShoppingList(storeId);
  const [listProducts, setListProducts] = useState<Map<string, Product>>(new Map());

  // Callback-ref: elementet finnes først når butikken er lastet, så en vanlig
  // useEffect på mount ville aldri fått tak i det.
  const [stageHeight, setStageHeight] = useState(0);
  const stageObserver = useRef<ResizeObserver | null>(null);
  const stageRef = useCallback((node: HTMLDivElement | null) => {
    stageObserver.current?.disconnect();
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setStageHeight(entry.contentRect.height));
    observer.observe(node);
    stageObserver.current = observer;
  }, []);

  useEffect(() => () => stageObserver.current?.disconnect(), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataSource.getStore(storeId).then(async (storeResult) => {
      if (!active) return;
      setStore(storeResult);
      const [planResult, chainResult] = await Promise.all([
        dataSource.getStorePlan(storeId),
        storeResult ? dataSource.getChain(storeResult.chainId) : Promise.resolve(null),
      ]);
      if (!active) return;
      setPlan(planResult);
      setChain(chainResult);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [storeId]);

  // Varene på handlelista, slått opp så vi kan vise navn og plassering.
  useEffect(() => {
    let active = true;
    Promise.all(list.items.map((item) => dataSource.getProduct(storeId, item.productId))).then(
      (found) => {
        if (!active) return;
        const map = new Map<string, Product>();
        for (const item of found) if (item) map.set(item.id, item);
        setListProducts(map);
      },
    );
    return () => {
      active = false;
    };
  }, [list.items, storeId]);

  const grid = useMemo(() => (plan ? buildNavGrid(plan) : null), [plan]);

  const fixtureById = useMemo(() => {
    const map = new Map(plan?.fixtures.map((f) => [f.id, f]) ?? []);
    return (id: string) => map.get(id) ?? null;
  }, [plan]);

  const fixture = product ? fixtureById(product.placement.fixtureId) : null;

  const doneIds = useMemo(
    () => new Set(list.items.filter((i) => i.done).map((i) => i.productId)),
    [list.items],
  );

  const targets: MapTarget[] = useMemo(() => {
    const toTarget = (item: Product, stop?: number): MapTarget | null => {
      const f = fixtureById(item.placement.fixtureId);
      if (!f) return null;
      return {
        id: item.id,
        fixture: f,
        marker: productMarker(f, item.placement.offsetCm),
        departmentId: item.departmentId,
        heightCm: item.placement.heightCm,
        stop,
        done: doneIds.has(item.id),
      };
    };

    if (tour) {
      return tour.order
        .map((stop, index) => toTarget(stop.value, index + 1))
        .filter((t): t is MapTarget => t !== null);
    }
    if (product) {
      const single = toTarget(product);
      return single ? [single] : [];
    }
    return [];
  }, [tour, product, fixtureById, doneIds]);

  const steps = useMemo(() => {
    if (!route || !fixture) return [];
    return buildDirections(route.points, fixture, fixture.aisle);
  }, [route, fixture]);

  const routeMeters = route ? pathLength(route.points) : null;
  const tourMeters = tour ? pathLength(tour.points) : 0;

  const clearRoute = useCallback(() => {
    setRoute(null);
    setTour(null);
    setOrigin(null);
    setPickIntent(null);
    setArrived(false);
    setRouteError(null);
  }, []);

  const selectProduct = useCallback(
    (next: Product) => {
      setProduct(next);
      setSearchOpen(false);
      setListOpen(false);
      setSnap('half');
      clearRoute();
    },
    [clearRoute],
  );

  const startPicking = useCallback((intent: Exclude<PickIntent, null>) => {
    setRouteError(null);
    setPickIntent(intent);
    setListOpen(false);
    // Arket trekkes ned, så man ser butikken mens man peker ut hvor man står.
    setSnap('peek');
  }, []);

  const handlePick = useCallback(
    (point: Vec2) => {
      if (!grid) return;

      if (pickIntent === 'tour') {
        const stops = list.items
          .filter((item) => !item.done)
          .map((item) => listProducts.get(item.productId))
          .filter((p): p is Product => p !== undefined)
          .map((p) => {
            const f = fixtureById(p.placement.fixtureId)!;
            return { point: fixtureAccessPoint(f), value: p };
          });

        const planned = planTour(grid, point, stops);
        if (!planned) {
          setRouteError('Fant ingen rute innom alle varene herfra.');
          return;
        }
        setProduct(null);
        setTour(planned);
        setOrigin(planned.legs[0].route.points[0]);
        setPickIntent(null);
        setRouteError(null);
        setSnap('half');
        return;
      }

      if (!fixture) return;
      const found = findRoute(grid, point, fixtureAccessPoint(fixture));
      if (!found) {
        setRouteError('Fant ingen vei dit. Prøv å trykke i en gang.');
        return;
      }
      setOrigin(found.start);
      setRoute(found);
      setPickIntent(null);
      setRouteError(null);
      setSnap('half');
    },
    [grid, pickIntent, fixture, list.items, listProducts, fixtureById],
  );

  /** Huker av en vare underveis og legger resten av ruten fra det punktet. */
  const tickOff = useCallback(
    (productId: string) => {
      list.toggle(productId);
      if (!tour || !grid || doneIds.has(productId)) return;

      const picked = tour.order.find((stop) => stop.value.id === productId);
      const rest = tour.order.filter(
        (stop) => stop.value.id !== productId && !doneIds.has(stop.value.id),
      );
      if (!picked) return;
      if (rest.length === 0) {
        setTour({ ...tour, points: [], legs: [] });
        return;
      }
      const replanned = planTour(grid, picked.point, rest);
      if (replanned) {
        setTour({ ...replanned, order: tour.order });
        setOrigin(picked.point);
      }
    },
    [list, tour, grid, doneIds],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (searchOpen) setSearchOpen(false);
      else if (listOpen) setListOpen(false);
      else if (pickIntent) setPickIntent(null);
      else if (route || tour) clearRoute();
      else if (product) setProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, listOpen, pickIntent, route, tour, product, clearRoute]);

  const departmentName = (id: string) => plan?.departments.find((d) => d.id === id)?.name ?? id;

  const sheetOpen = Boolean(product || tour);
  const insets: MapInsets = useMemo(
    () => ({
      top: SEARCHBAR_INSET,
      right: 0,
      bottom: sheetOpen && stageHeight > 0 ? sheetHeight(stageHeight, snap) : 0,
    }),
    [sheetOpen, snap, stageHeight],
  );

  const accentStyle = chain
    ? ({ '--accent': chain.accent, '--on-accent': chain.onAccent } as React.CSSProperties)
    : undefined;

  if (loading) {
    return (
      <div className="store">
        <header className="store__header">
          <button className="icon-btn" onClick={onBack} aria-label="Tilbake" type="button">
            <BackIcon />
          </button>
          <div className="store__title">
            <span className="skeleton skeleton--line" style={{ width: 130 }} />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
        </header>
        <div className="map map--loading" />
      </div>
    );
  }

  if (!store || !plan) {
    return (
      <div className="store">
        <div className="loading">
          Fant ingen plantegning for denne butikken.
          <button className="btn btn--ghost btn--sm" onClick={onBack} type="button">
            Tilbake
          </button>
        </div>
      </div>
    );
  }

  const mapProps = {
    plan,
    targets,
    route: tour ? (tour.points.length > 1 ? tour.points : null) : route ? route.points : null,
    origin,
    picking: pickIntent !== null,
    insets,
    onPick: handlePick,
  };

  return (
    <div className="store" ref={stageRef} style={accentStyle}>
      <header className="store__header">
        <button className="icon-btn" onClick={onBack} aria-label="Tilbake til butikksøk" type="button">
          <BackIcon />
        </button>
        <div className="store__title">
          {chain ? <Wordmark chain={chain} large /> : <h1>{store.name}</h1>}
          <p>
            {store.address}, {store.city} · {store.openingHours}
          </p>
        </div>
        <div className="view-toggle" role="group" aria-label="Visning">
          <button data-active={view === '2d'} onClick={() => setView('2d')} type="button">
            Plan
          </button>
          <button data-active={view === '3d'} onClick={() => setView('3d')} type="button">
            <CubeIcon size={13} />
            3D
          </button>
        </div>
      </header>

      <div className="searchbar" data-filled={Boolean(product)}>
        <button
          className="searchbar__open"
          onClick={() => setSearchOpen(true)}
          type="button"
          aria-label="Søk etter vare"
        >
          <SearchIcon />
          <span>{product ? product.name : 'Søk etter vare'}</span>
        </button>
        <button
          className="searchbar__list"
          onClick={() => setListOpen(true)}
          type="button"
          aria-label={`Handleliste, ${list.items.length} varer`}
        >
          <ListIcon />
          {list.items.length > 0 && <span className="badge">{list.items.length}</span>}
        </button>
      </div>

      <Suspense fallback={<div className="map map--loading" />}>
        {view === '2d' ? <Map2D {...mapProps} /> : <Map3D {...mapProps} />}
      </Suspense>

      {(pickIntent || routeError) && (
        <div
          className={`hint${routeError ? ' hint--error' : ''}`}
          style={{ bottom: 16 + insets.bottom }}
          role="status"
        >
          <span className="hint__pulse" aria-hidden="true" />
          <span>
            {routeError ??
              (pickIntent === 'tour'
                ? 'Trykk der du starter handleturen'
                : 'Trykk på kartet der du står')}
          </span>
          <button
            onClick={() => {
              setPickIntent(null);
              setRouteError(null);
            }}
            type="button"
          >
            Avbryt
          </button>
        </div>
      )}

      {tour && (
        <TourSheet
          tour={tour}
          plan={plan}
          meters={tourMeters}
          doneIds={doneIds}
          snap={snap}
          onSnapChange={setSnap}
          onToggle={tickOff}
          onSelect={selectProduct}
          onEnd={clearRoute}
        />
      )}

      {!tour && product && fixture && (
        <ProductSheet
          product={product}
          fixture={fixture}
          departmentName={departmentName(product.departmentId)}
          routeMeters={routeMeters}
          steps={steps}
          arrived={arrived}
          inList={list.has(product.id)}
          picking={pickIntent !== null}
          snap={snap}
          onSnapChange={setSnap}
          onShowRoute={() => startPicking('single')}
          onClearRoute={clearRoute}
          onArrived={() => {
            setArrived(true);
            setSnap('half');
          }}
          onToggleList={() => (list.has(product.id) ? list.remove(product.id) : list.add(product.id))}
          onClose={() => {
            setProduct(null);
            clearRoute();
          }}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          storeId={storeId}
          plan={plan}
          inList={list.has}
          onAdd={list.add}
          onSelect={selectProduct}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {listOpen && (
        <ShoppingListOverlay
          items={list.items}
          products={listProducts}
          plan={plan}
          onToggle={list.toggle}
          onRemove={list.remove}
          onSelect={selectProduct}
          onRoute={() => startPicking('tour')}
          onClear={list.clear}
          onClose={() => setListOpen(false)}
        />
      )}
    </div>
  );
}
