import { useEffect, useMemo, useRef, useState } from 'react';
import { dataSource } from '../data';
import type { Department, Product, StorePlan } from '../data/types';
import { pushRecent, readRecents } from '../lib/recents';
import { ProductImage } from './ProductImage';
import { BackIcon, CheckIcon, PlusCircleIcon, SearchIcon } from './icons';

/**
 * Varesøket i fullskjerm, slik man forventer på iPhone. Tomt søk er ikke en
 * blank skjerm: da får man siste søk og avdelingene å bla i.
 */

interface Props {
  storeId: string;
  plan: StorePlan;
  /** Åpne rett i en avdeling, f.eks. fra butikkinfo. */
  initialDepartmentId?: string | null;
  /** Åpne med et søk allerede fylt inn, f.eks. fra siste søk. */
  initialQuery?: string;
  inList: (productId: string) => boolean;
  onAdd: (productId: string) => void;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function SearchOverlay({
  storeId,
  plan,
  initialDepartmentId,
  initialQuery = '',
  inList,
  onAdd,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [department, setDepartment] = useState<Department | null>(
    () => plan.departments.find((d) => d.id === initialDepartmentId) ?? null,
  );
  const [browse, setBrowse] = useState<Product[]>([]);
  const [recents, setRecents] = useState<string[]>(() => readRecents());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Kommer man rett inn i en avdeling, skal ikke tastaturet sprette opp.
    if (!initialDepartmentId) inputRef.current?.focus();
  }, [initialDepartmentId]);

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

  const departmentName = useMemo(() => {
    const byId = new Map(plan.departments.map((d) => [d.id, d.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [plan]);

  const choose = (product: Product) => {
    setRecents(pushRecent(query.trim() || product.name));
    onSelect(product);
  };

  const list = query.trim() ? results : browse;
  const showList = query.trim() !== '' || department !== null;

  return (
    <div className="overlay">
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
            placeholder="Søk etter vare"
            aria-label="Søk etter vare i butikken"
            onChange={(event) => {
              setQuery(event.target.value);
              setDepartment(null);
            }}
          />
        </div>
        <button className="overlay__cancel" onClick={onClose} type="button">
          Avbryt
        </button>
      </div>

      <div className="overlay__body">
        {!showList && (
          <>
            {recents.length > 0 && (
              <section className="block">
                <div className="block__title meta">Siste søk</div>
                <div className="chips">
                  {recents.map((term) => (
                    <button key={term} className="chip" onClick={() => setQuery(term)} type="button">
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="block">
              <div className="block__title meta">Avdelinger</div>
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

        {showList && (
          <>
            {department && (
              <button className="overlay__back" onClick={() => setDepartment(null)} type="button">
                <BackIcon size={16} />
                {department.name}
                <span className="overlay__count">{browse.length} varer</span>
              </button>
            )}

            {searching && list.length === 0 ? (
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
            ) : list.length === 0 ? (
              <div className="empty">Ingen varer matcher «{query}».</div>
            ) : (
              <ul className="rows">
                {list.map((product) => (
                  <li key={product.id} className="list-item">
                    <button
                      className="list-item__main row"
                      onClick={() => choose(product)}
                      type="button"
                    >
                      <span className="row__art">
                        <ProductImage product={product} size={30} />
                      </span>
                      <span className="row__main">
                        <span className="row__name">{product.name}</span>
                        <span className="row__sub">
                          {product.brand} · {departmentName(product.departmentId)} ·{' '}
                          {fixtureCode(product)}
                        </span>
                      </span>
                      <span className="row__price mono">
                        {product.price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                    <button
                      className="list-item__add"
                      data-in={inList(product.id)}
                      onClick={() => onAdd(product.id)}
                      aria-label={`Legg ${product.name} i handlelista`}
                      type="button"
                    >
                      {inList(product.id) ? <CheckIcon size={19} /> : <PlusCircleIcon size={24} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
