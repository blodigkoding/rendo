import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataSource } from '../data';
import type { Chain, Product, Store, StorePlan, Vec2 } from '../data/types';
import { buildDirections } from '../lib/directions';
import { fixtureAccessPoint, pathLength, productMarker, shelfPosition } from '../lib/geometry';
import { buildNavGrid, findRoute, type RouteResult } from '../lib/pathfinding';
import { useSettings } from '../lib/settings';
import { useShoppingList } from '../lib/shoppingList';
import { createWalkSimulator, type Fix } from '../lib/positioning';
import { planTour, type Tour } from '../lib/tour';
import { sheetHeight, type SheetSnap } from './BottomSheet';
import { Map2D, type MapInsets, type MapTarget } from './Map2D';
import { ProductSheet } from './ProductSheet';
import { ScanButton } from './ScanButton';
import { SearchOverlay } from './SearchOverlay';
import { ProfilePage } from './ProfilePage';
import { ShoppingListPage } from './ShoppingListPage';
import { StoreInfo } from './StoreInfo';
import type { Tab } from './TabBar';
import { TourSheet } from './TourSheet';
import { ChainLogo } from './ChainLogo';
import { BackIcon, CubeIcon, PlanIcon, SearchIcon } from './icons';

/** three.js lastes først når noen faktisk ber om 3D. */
const Map3D = lazy(() => import('./Map3D').then((module) => ({ default: module.Map3D })));

interface Props {
  storeId: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onSwitchStore: () => void;
  onListCount: (count: number) => void;
}

type View = '2d' | '3d';

const SEARCHBAR_INSET = 78;
/** Den flytende fanelinja tar plass nederst i kartet. */
const TABBAR_INSET = 84;

export function StorePage({ storeId, tab, onTabChange, onSwitchStore, onListCount }: Props) {
  const [store, setStore] = useState<Store | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [plan, setPlan] = useState<StorePlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Standardvisningen settes i profilen; 3D er utgangspunktet.
  const [settings] = useSettings();
  const [view, setView] = useState<View>(() => settings.defaultView);
  const [browseDepartment, setBrowseDepartment] = useState<string | null>(null);
  const [initialQuery, setInitialQuery] = useState('');
  const [storeInfoOpen, setStoreInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const setTab = onTabChange;

  const [product, setProduct] = useState<Product | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [origin, setOrigin] = useState<Vec2 | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [tour, setTour] = useState<Tour<Product> | null>(null);
  const [arrived, setArrived] = useState(false);
  const [walking, setWalking] = useState(false);
  const [fix, setFix] = useState<Fix | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const list = useShoppingList(storeId);
  const [listProducts, setListProducts] = useState<Map<string, Product>>(new Map());
  const [productCount, setProductCount] = useState(0);

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

      if (planResult) {
        const perDepartment = await Promise.all(
          planResult.departments.map((d) => dataSource.getProductsInDepartment(storeId, d.id)),
        );
        if (active) setProductCount(perDepartment.reduce((sum, list) => sum + list.length, 0));
      }
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

  /** Hvor langt inn i gangen seksjonen står, regnet fra inngangen. */
  const position = useMemo(() => {
    if (!plan || !fixture) return null;
    const entrance = plan.entrances[0]?.position ?? { x: 0, y: plan.depth };
    return shelfPosition(plan.fixtures, fixture, entrance);
  }, [plan, fixture]);

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

  const routePoints = tour ? tour.points : route ? route.points : null;

  // Veibeskrivelsen spilles av fra en posisjonskilde. I dag er den simulert;
  // når butikken har faste punkter innvendig byttes kilden ut her.
  useEffect(() => {
    if (!walking || !routePoints || routePoints.length < 2) return;
    const source = createWalkSimulator(routePoints);
    return source.subscribe(setFix);
  }, [walking, routePoints]);

  useEffect(() => {
    if (!walking) setFix(null);
  }, [walking]);

  const clearRoute = useCallback(() => {
    setWalking(false);
    setRoute(null);
    setTour(null);
    setOrigin(null);
    setArrived(false);
    setRouteError(null);
  }, []);

  /** Velger man en vare, skal man se den i planen – ikke bli stående i søket. */
  const selectProduct = useCallback(
    (next: Product) => {
      setProduct(next);
      setSearchOpen(false);
      setStoreInfoOpen(false);
      setBrowseDepartment(null);
      setInitialQuery('');
      setSnap('half');
      clearRoute();
      setTab('plan');
    },
    [clearRoute, setTab],
  );

  /**
   * Vi spør ikke hvor kunden står. Ruten starter ved inngangen, som er der man
   * kommer fra – og går man allerede, starter den der man er nå.
   */
  const startPoint = useCallback((): Vec2 | null => {
    if (fix) return fix.point;
    return plan?.entrances[0]?.position ?? null;
  }, [fix, plan]);

  const showRoute = useCallback(
    (intent: 'single' | 'tour') => {
      const point = startPoint();
      if (!grid || !plan || !point) return;
      setTab('plan');

      if (intent === 'tour') {
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
          setRouteError('Fant ingen rute innom alle varene.');
          return;
        }
        setProduct(null);
        setTour(planned);
        setOrigin(planned.legs[0].route.points[0]);
        setRouteError(null);
        setSnap('half');
        return;
      }

      if (!fixture) return;
      const found = findRoute(grid, point, fixtureAccessPoint(fixture));
      if (!found) {
        setRouteError('Fant ingen vei fram til varen.');
        return;
      }
      setOrigin(found.start);
      setRoute(found);
      setRouteError(null);
      setSnap('half');
    },
    [grid, plan, startPoint, fixture, list.items, listProducts, fixtureById, setTab],
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
      if (tab !== 'plan') setTab('plan');
      else if (route || tour) clearRoute();
      else if (product) setProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, route, tour, product, clearRoute]);

  const departmentName = (id: string) => plan?.departments.find((d) => d.id === id)?.name ?? id;

  useEffect(() => onListCount(list.items.length), [list.items.length, onListCount]);

  const sheetOpen = Boolean(product || tour) && tab === 'plan';
  const insets: MapInsets = useMemo(
    () => ({
      top: SEARCHBAR_INSET,
      right: 0,
      bottom:
        TABBAR_INSET +
        (sheetOpen && stageHeight > 0 ? sheetHeight(stageHeight - TABBAR_INSET, snap) : 0),
    }),
    [sheetOpen, snap, stageHeight],
  );

  // Kjedefargen brukes bare i topplinja – knapper og faner er alltid sorte.
  const chainStyle = chain
    ? ({ '--chain': chain.accent, '--on-chain': chain.onAccent } as React.CSSProperties)
    : undefined;

  if (loading) {
    return (
      <div className="store">
        <header className="store__header">
          <div className="store__title">
            <span className="skeleton skeleton--line" style={{ width: 130 }} />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
        </header>
        <div className="store__stage">
          <div className="map map--loading" />
        </div>
      </div>
    );
  }

  if (!store || !plan) {
    return (
      <div className="store">
        <div className="loading">
          Fant ingen plantegning for denne butikken.
          <button className="btn btn--ghost btn--sm" onClick={onSwitchStore} type="button">
            Velg en annen butikk
          </button>
        </div>
      </div>
    );
  }

  const mapProps = {
    plan,
    targets,
    route: routePoints && routePoints.length > 1 ? routePoints : null,
    origin,
    fix,
    picking: false,
    showLabels: settings.showLabels,
    insets,
    onPick: () => {},
  };

  return (
    <div className="store" style={chainStyle}>
      <header className="store__header">
        <button
          className="icon-btn"
          onClick={onSwitchStore}
          aria-label="Bytt butikk"
          type="button"
        >
          <BackIcon />
        </button>
        <button
          className="store__title"
          onClick={() => setStoreInfoOpen(true)}
          type="button"
          aria-label="Om butikken"
        >
          {chain ? <ChainLogo chain={chain} onColor /> : <h1>{store.name}</h1>}
          <p>
            {store.address}, {store.city} · {store.openingHours}
          </p>
        </button>
      </header>

      <div className="store__stage" ref={stageRef}>
        <div className="topbar">
          <button
            className="searchbar"
            data-filled={Boolean(product)}
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <SearchIcon />
            <span>{product ? product.name : 'Søk etter vare'}</span>
          </button>

          <div className="viewswitch" role="group" aria-label="Visning">
            <button
              data-active={view === '2d'}
              onClick={() => setView('2d')}
              type="button"
              aria-pressed={view === '2d'}
            >
              <PlanIcon size={15} />
              Plan
            </button>
            <button
              data-active={view === '3d'}
              onClick={() => setView('3d')}
              type="button"
              aria-pressed={view === '3d'}
            >
              <CubeIcon size={15} />
              3D
            </button>
          </div>
        </div>

        {product && chain?.scanApp && (
          <div className="map__scan" style={{ bottom: 16 + insets.bottom }}>
            <ScanButton chain={chain} product={product} compact />
          </div>
        )}

        <Suspense fallback={<div className="map map--loading" />}>
          {view === '2d' ? <Map2D {...mapProps} /> : <Map3D {...mapProps} />}
        </Suspense>

        {routeError && (
          <div
            className="hint hint--error"
            style={{ bottom: 16 + insets.bottom }}
            role="status"
          >
            <span className="hint__pulse" aria-hidden="true" />
            <span>{routeError}</span>
            <button
              onClick={() => {
                            setRouteError(null);
              }}
              type="button"
            >
              Avbryt
            </button>
          </div>
        )}

        {tab === 'plan' && tour && (
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

        {tab === 'plan' && !tour && product && fixture && position && (
          <ProductSheet
            product={product}
            fixture={fixture}
            departmentName={departmentName(product.departmentId)}
            chain={chain}
            position={position}
            routeMeters={routeMeters}
            steps={steps}
            arrived={arrived}
            walking={walking}
            inList={list.has(product.id)}
            picking={false}
            snap={snap}
            onSnapChange={setSnap}
            onShowRoute={() => showRoute('single')}
            onClearRoute={clearRoute}
            onWalk={() => {
              setWalking(true);
              setView('3d');
              setSnap('peek');
            }}
            onStopWalk={() => setWalking(false)}
            onArrived={() => {
              setWalking(false);
              setArrived(true);
              setSnap('half');
            }}
            onToggleList={() =>
              list.has(product.id) ? list.remove(product.id) : list.add(product.id)
            }
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
            initialDepartmentId={browseDepartment}
            initialQuery={initialQuery}
            inList={list.has}
            onAdd={list.add}
            onSelect={selectProduct}
            onClose={() => {
              setSearchOpen(false);
              setBrowseDepartment(null);
              setInitialQuery('');
            }}
          />
        )}

        {tab === 'handleliste' && (
          <ShoppingListPage
            storeId={storeId}
            plan={plan}
            items={list.items}
            products={listProducts}
            has={list.has}
            onAdd={list.add}
            onToggle={list.toggle}
            onRemove={list.remove}
            onSelect={selectProduct}
            onRoute={() => showRoute('tour')}
            onClear={list.clear}
          />
        )}

        {tab === 'profil' && (
          <ProfilePage
            store={store}
            chain={chain}
            listCount={list.items.length}
            onOpenList={() => setTab('handleliste')}
            onSearch={(term) => {
              setInitialQuery(term);
              setSearchOpen(true);
            }}
            onSwitchStore={onSwitchStore}
            onOpenStoreInfo={() => setStoreInfoOpen(true)}
          />
        )}

        {storeInfoOpen && (
          <StoreInfo
            store={store}
            chain={chain}
            plan={plan}
            productCount={productCount}
            onSwitchStore={onSwitchStore}
            onClose={() => setStoreInfoOpen(false)}
            onPickDepartment={(departmentId) => {
              setStoreInfoOpen(false);
              setBrowseDepartment(departmentId);
              setTab('handleliste');
            }}
          />
        )}
      </div>
    </div>
  );
}
