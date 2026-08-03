import type { Product, StorePlan } from '../data/types';
import { formatMeters, formatWalkTime } from '../lib/geometry';
import type { Tour } from '../lib/tour';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { ProductImage } from './ProductImage';
import { CheckIcon } from './icons';

/** Arket som følger handleruten: stoppene i rekkefølge, med avhuking. */

interface Props {
  tour: Tour<Product>;
  plan: StorePlan;
  meters: number;
  doneIds: Set<string>;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  onToggle: (productId: string) => void;
  onSelect: (product: Product) => void;
  onEnd: () => void;
}

export function TourSheet({
  tour,
  plan,
  meters,
  doneIds,
  snap,
  onSnapChange,
  onToggle,
  onSelect,
  onEnd,
}: Props) {
  const stops = tour.order.map((stop) => stop.value);
  const remaining = stops.filter((product) => !doneIds.has(product.id));
  const next = remaining[0];
  const fixtureFor = (product: Product) =>
    plan.fixtures.find((f) => f.id === product.placement.fixtureId);

  const header = (
    <div className="sheet__head">
      <div className="sheet__title">
        <div className="meta">Handlerute</div>
        <h2>
          {remaining.length} {remaining.length === 1 ? 'vare' : 'varer'} igjen
        </h2>
        <div className="sheet__where">
          {formatMeters(meters)} · {formatWalkTime(meters)} · {stops.length} stopp
        </div>
      </div>
      <button className="btn btn--ghost btn--sm" onClick={onEnd} type="button">
        Avslutt
      </button>
    </div>
  );

  const footer = next ? (
    <div className="routebar">
      <span className="routebar__icon">{stops.indexOf(next) + 1}</span>
      <div className="routebar__text">
        <strong>{next.name}</strong>
        <span className="meta">
          {fixtureFor(next)?.aisle} · {fixtureFor(next)?.code} · hylle {next.placement.level}
        </span>
      </div>
      <button className="btn btn--sm" onClick={() => onToggle(next.id)} type="button">
        <CheckIcon size={14} />
        Plukket
      </button>
    </div>
  ) : (
    <button className="btn btn--wide" onClick={onEnd} type="button">
      <CheckIcon size={15} />
      Alt plukket – avslutt
    </button>
  );

  return (
    <BottomSheet
      snap={snap}
      onSnapChange={onSnapChange}
      header={header}
      footer={footer}
      label="Handlerute"
    >
      <ul className="rows">
        {stops.map((product, index) => {
          const done = doneIds.has(product.id);
          const fixture = fixtureFor(product);
          return (
            <li key={product.id} className="list-item" data-done={done}>
              <button
                className="list-item__check"
                onClick={() => onToggle(product.id)}
                aria-label={done ? 'Fjern avhuking' : 'Huk av som plukket'}
                type="button"
              >
                <CheckIcon size={13} />
              </button>
              <button className="list-item__main row" onClick={() => onSelect(product)} type="button">
                <span className="steps__number">{index + 1}</span>
                <span className="row__art">
                  <ProductImage product={product} size={26} />
                </span>
                <span className="row__main">
                  <span className="row__name">{product.name}</span>
                  <span className="row__sub">
                    {fixture?.aisle} · {fixture?.code} · hylle {product.placement.level}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
