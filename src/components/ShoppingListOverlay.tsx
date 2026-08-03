import type { Product, StorePlan } from '../data/types';
import type { ListItem } from '../lib/shoppingList';
import { ProductImage } from './ProductImage';
import { BackIcon, CheckIcon, CloseIcon, RouteIcon } from './icons';

/**
 * Handlelista. Man krysser av mens man går, og appen kan legge én rute innom
 * alt som står igjen.
 */

interface Props {
  items: ListItem[];
  products: Map<string, Product>;
  plan: StorePlan;
  onToggle: (productId: string) => void;
  onRemove: (productId: string) => void;
  onSelect: (product: Product) => void;
  onRoute: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function ShoppingListOverlay({
  items,
  products,
  plan,
  onToggle,
  onRemove,
  onSelect,
  onRoute,
  onClear,
  onClose,
}: Props) {
  const rows = items
    .map((item) => ({ item, product: products.get(item.productId) }))
    .filter((row): row is { item: ListItem; product: Product } => row.product !== undefined);

  const remaining = rows.filter((row) => !row.item.done);
  const total = rows.reduce((sum, row) => sum + row.product.price, 0);
  const fixtureCode = (product: Product) =>
    plan.fixtures.find((f) => f.id === product.placement.fixtureId)?.code ?? '';

  return (
    <div className="overlay">
      <div className="overlay__bar">
        <button className="icon-btn" onClick={onClose} aria-label="Lukk handlelista" type="button">
          <BackIcon />
        </button>
        <strong style={{ flex: 1, fontWeight: 500, letterSpacing: '-0.02em' }}>Handleliste</strong>
        {rows.length > 0 && (
          <button className="overlay__cancel" onClick={onClear} type="button">
            Tøm
          </button>
        )}
      </div>

      <div className="overlay__body">
        {rows.length === 0 ? (
          <div className="empty">
            Lista er tom. Søk opp en vare og trykk «Legg i liste», så finner rendo den korteste
            veien innom alt sammen.
          </div>
        ) : (
          <>
            <div className="list-total">
              <span className="meta">
                {remaining.length} igjen av {rows.length}
              </span>
              <strong>{total.toFixed(2).replace('.', ',')} kr</strong>
            </div>

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
                  <button className="list-item__main row" onClick={() => onSelect(product)} type="button">
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
          </>
        )}
      </div>

      {remaining.length > 0 && (
        <div className="sheet__footer">
          <button className="btn btn--wide" onClick={onRoute} type="button">
            <RouteIcon />
            Vis rute innom {remaining.length} {remaining.length === 1 ? 'vare' : 'varer'}
          </button>
        </div>
      )}
    </div>
  );
}
