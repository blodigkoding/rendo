import { useEffect, useMemo, useRef, useState } from 'react';
import { dataSource } from '../data';
import type { Department, Product, StorePlan } from '../data/types';
import type { ListItem } from '../lib/shoppingList';
import { ProductImage } from './ProductImage';
import {
  BackIcon,
  CheckIcon,
  CloseIcon,
  PlusCircleIcon,
  RouteIcon,
  SearchIcon,
} from './icons';

/**
 * Handlelista.
 *
 * Her lages lista og her brukes den: søkefeltet øverst legger varer til, og
 * under ligger lista man krysser av mens man går. Når noe står igjen, kan
 * appen legge én rute innom alt sammen.
 */

interface Props {
  storeId: string;
  plan: StorePlan;
  items: ListItem[];
  products: Map<string, Product>;
  has: (productId: string) => boolean;
  onAdd: (productId: string) => void;
  onToggle: (productId: string) => void;
  onRemove: (productId: string) => void;
  onSelect: (product: Product) => void;
  onRoute: () => void;
  onClear: () => void;
}

export function ShoppingListPage({
  storeId,
  plan,
  items,
  products,
  has,
  onAdd,
  onToggle,
  onRemove,
  onSelect,
  onRoute,
  onClear,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [browse, setBrowse] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const term = query.trim();
    if (!term) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      dataSource.searchProducts(storeId, term, 30).then((found) => {
        if (!active) return;
        setResults(found);
        setSearching(false);
      });
    }, 90);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, storeId]);

  useEffect(() => {
    let active = true;
    if (!department) {
      setBrowse([]);
      return;
    }
    dataSource.getProductsInDepartment(storeId, department.id).then((found) => {
      if (active) setBrowse(found);
    });
    return () => {
      active = false;
    };
  }, [department, storeId]);

  const fixtureCode = useMemo(() => {
    const byId = new Map(plan.fixtures.map((f) => [f.id, f.code]));
    return (product: Product) => byId.get(product.placement.fixtureId) ?? '';
  }, [plan]);

  const rows = items
    .map((item) => ({ item, product: products.get(item.productId) }))
    .filter((row): row is { item: ListItem; product: Product } => row.product !== undefined);
  const remaining = rows.filter((row) => !row.item.done);
  const total = rows.reduce((sum, row) => sum + row.product.price, 0);

  const finding = query.trim() !== '' || department !== null;
  const found = query.trim() ? results : browse;

  return (
    <div className="overlay overlay--flat">
      <div className="overlay__bar">
        <div className="search">
          <span className="search__icon">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            placeholder="Legg til vare"
            aria-label="Søk etter vare å legge i lista"
            onChange={(event) => {
              setQuery(event.target.value);
              setDepartment(null);
            }}
          />
        </div>
        {finding && (
          <button
            className="overlay__cancel"
            onClick={() => {
              setQuery('');
              setDepartment(null);
            }}
            type="button"
          >
            Ferdig
          </button>
        )}
      </div>

      <div className="overlay__body">
        {finding ? (
          <>
            {department && (
              <button className="overlay__back" onClick={() => setDepartment(null)} type="button">
                <BackIcon size={16} />
                {department.name}
                <span className="overlay__count">{browse.length} varer</span>
              </button>
            )}

            {searching && found.length === 0 ? (
              <ul className="rows">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="row row--skeleton">
                    <span className="row__art skeleton" />
                    <span className="row__main">
                      <span className="skeleton skeleton--line" />
                      <span className="skeleton skeleton--line skeleton--short" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : found.length === 0 ? (
              <div className="empty">Ingen varer matcher «{query}».</div>
            ) : (
              <ul className="rows">
                {found.map((product) => (
                  <li key={product.id} className="list-item">
                    <button
                      className="list-item__main row"
                      onClick={() => onSelect(product)}
                      type="button"
                    >
                      <span className="row__art">
                        <ProductImage product={product} size={30} />
                      </span>
                      <span className="row__main">
                        <span className="row__name">{product.name}</span>
                        <span className="row__sub">
                          {product.brand} · {fixtureCode(product)}
                        </span>
                      </span>
                      <span className="row__price mono">
                        {product.price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                    <button
                      className="list-item__add"
                      data-in={has(product.id)}
                      onClick={() => onAdd(product.id)}
                      aria-label={`Legg ${product.name} i handlelista`}
                      type="button"
                    >
                      {has(product.id) ? <CheckIcon size={19} /> : <PlusCircleIcon size={24} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {rows.length > 0 && (
              <div className="list-total">
                <span className="meta">
                  {remaining.length} igjen av {rows.length}
                </span>
                <strong>{total.toFixed(2).replace('.', ',')} kr</strong>
              </div>
            )}

            {rows.length === 0 ? (
              <div className="block">
                <p className="profile__empty">
                  Lista er tom. Søk opp en vare i feltet over, eller velg en avdeling under, og
                  trykk pluss for å legge den til.
                </p>
              </div>
            ) : (
              <ul className="rows">
                {rows.map(({ item, product }) => (
                  <li key={product.id} className="list-item" data-done={item.done}>
                    <button
                      className="list-item__check"
                      onClick={() => onToggle(product.id)}
                      aria-label={item.done ? 'Fjern avhuking' : 'Huk av som plukket'}
                      type="button"
                    >
                      <CheckIcon size={13} />
                    </button>
                    <button
                      className="list-item__main row"
                      onClick={() => onSelect(product)}
                      type="button"
                    >
                      <span className="row__art">
                        <ProductImage product={product} size={26} />
                      </span>
                      <span className="row__main">
                        <span className="row__name">{product.name}</span>
                        <span className="row__sub">
                          {product.brand} · {fixtureCode(product)}
                        </span>
                      </span>
                    </button>
                    <button
                      className="list-item__remove"
                      onClick={() => onRemove(product.id)}
                      aria-label={`Fjern ${product.name}`}
                      type="button"
                    >
                      <CloseIcon size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <section className="block">
              <div className="block__title meta">
                Avdelinger
                {rows.length > 0 && (
                  <button className="block__action" onClick={onClear} type="button">
                    Tøm lista
                  </button>
                )}
              </div>
              <div className="dept-grid">
                {plan.departments.map((dept) => (
                  <button
                    key={dept.id}
                    className="dept"
                    onClick={() => setDepartment(dept)}
                    type="button"
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {!finding && remaining.length > 0 && (
        <div className="sheet__footer overlay__footer">
          <button className="btn btn--wide" onClick={onRoute} type="button">
            <RouteIcon />
            Vis rute innom {remaining.length} {remaining.length === 1 ? 'vare' : 'varer'}
          </button>
        </div>
      )}
    </div>
  );
}
