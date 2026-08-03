import type { Fixture, Product } from '../data/types';
import type { DirectionStep } from '../lib/directions';
import { formatMeters, formatWalkTime } from '../lib/geometry';
import {
  ArriveIcon,
  CloseIcon,
  RouteIcon,
  StraightIcon,
  TurnLeftIcon,
  TurnRightIcon,
} from './icons';

interface Props {
  product: Product;
  fixture: Fixture;
  departmentName: string;
  routeMeters: number | null;
  steps: DirectionStep[];
  picking: boolean;
  onShowRoute: () => void;
  onClearRoute: () => void;
  onClose: () => void;
}

const price = (value: number) => value.toFixed(2).replace('.', ',');

function StepIcon({ turn }: { turn: DirectionStep['turn'] }) {
  if (turn === 'arrive') return <ArriveIcon size={15} />;
  if (turn === 'left' || turn === 'sharp-left') return <TurnLeftIcon size={15} />;
  if (turn === 'right' || turn === 'sharp-right') return <TurnRightIcon size={15} />;
  return <StraightIcon size={15} />;
}

/** Liten snittegning av reolen med den aktuelle hylla markert. */
function ShelfDiagram({ levels, active }: { levels: number; active: number }) {
  return (
    <div className="shelf" aria-hidden="true">
      {Array.from({ length: levels }, (_, i) => {
        const level = levels - i; // øverste hylle først
        return (
          <div
            key={level}
            className={`shelf__level${level === active ? ' shelf__level--active' : ''}`}
          >
            <span>{level}</span>
          </div>
        );
      })}
      <div className="shelf__base" />
    </div>
  );
}

export function ProductPanel({
  product,
  fixture,
  departmentName,
  routeMeters,
  steps,
  picking,
  onShowRoute,
  onClearRoute,
  onClose,
}: Props) {
  const hasRoute = routeMeters !== null && steps.length > 0;

  return (
    <aside className="panel" aria-label={`Plassering av ${product.name}`}>
      <span className="panel__grip" />

      <div className="panel__head">
        <div className="panel__title">
          <div className="meta">{product.brand}</div>
          <h2>{product.name}</h2>
        </div>
        <div className="panel__price">
          <strong>{price(product.price)}</strong>
          <span className="meta">kr / {product.unit}</span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Lukk" type="button">
          <CloseIcon />
        </button>
      </div>

      <div className="panel__body">
        <div className="placement">
          <div className="placement__facts">
            <div>
              <div className="fact__label">Avdeling</div>
              <div className="fact__value">{departmentName}</div>
            </div>
            <div>
              <div className="fact__label">Gang</div>
              <div className="fact__value">{fixture.aisle}</div>
            </div>
            <div>
              <div className="fact__label">Reolseksjon</div>
              <div className="fact__value mono" style={{ fontSize: 14 }}>
                {fixture.code}
              </div>
            </div>
            <div>
              <div className="fact__label">Hylle</div>
              <div className="fact__value">
                {product.placement.level} av {fixture.levels}
              </div>
            </div>
            <div>
              <div className="fact__label">Høyde</div>
              <div className="fact__value">{product.placement.heightCm} cm over gulv</div>
            </div>
            <div>
              <div className="fact__label">Fronter</div>
              <div className="fact__value">{product.placement.facings}</div>
            </div>
            <div>
              <div className="fact__label">På lager</div>
              <div className="fact__value">{product.stock} stk</div>
            </div>
            <div>
              <div className="fact__label">EAN</div>
              <div className="fact__value mono" style={{ fontSize: 13 }}>
                {product.ean}
              </div>
            </div>
          </div>
          <ShelfDiagram levels={fixture.levels} active={product.placement.level} />
        </div>

        {hasRoute && (
          <>
            <div className="route-summary">
              <div className="route-summary__stat">
                <strong>{formatMeters(routeMeters!)}</strong>
                <span className="meta">Avstand</span>
              </div>
              <div className="route-summary__stat">
                <strong>{formatWalkTime(routeMeters!)}</strong>
                <span className="meta">Gangtid</span>
              </div>
              <button className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto' }} onClick={onClearRoute} type="button">
                Avslutt
              </button>
            </div>
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.id}>
                  <span className="steps__icon">
                    <StepIcon turn={step.turn} />
                  </span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {!hasRoute && (
        <div className="panel__actions">
          <button className="btn" onClick={onShowRoute} disabled={picking} type="button">
            <RouteIcon />
            {picking ? 'Velg hvor du står' : 'Vis veien'}
          </button>
        </div>
      )}
    </aside>
  );
}
