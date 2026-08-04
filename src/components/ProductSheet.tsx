import type { Fixture, Product } from '../data/types';
import type { DirectionStep } from '../lib/directions';
import { formatMeters, formatWalkTime, type ShelfPosition } from '../lib/geometry';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { ProductImage } from './ProductImage';
import {
  ArriveIcon,
  CheckIcon,
  CloseIcon,
  PlusCircleIcon,
  RouteIcon,
  StraightIcon,
  TurnLeftIcon,
  TurnRightIcon,
} from './icons';

interface Props {
  product: Product;
  fixture: Fixture;
  departmentName: string;
  /** Hvor langt inn i gangen seksjonen står. */
  position: ShelfPosition;
  routeMeters: number | null;
  steps: DirectionStep[];
  /** Ruten er gått ferdig – da er det hylla som gjelder. */
  arrived: boolean;
  /** Veibeskrivelsen spilles av med posisjon i butikken. */
  walking: boolean;
  inList: boolean;
  picking: boolean;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  onShowRoute: () => void;
  onClearRoute: () => void;
  onWalk: () => void;
  onStopWalk: () => void;
  onArrived: () => void;
  onToggleList: () => void;
  onClose: () => void;
}

const price = (value: number) => value.toFixed(2).replace('.', ',');

function StepIcon({ turn }: { turn: DirectionStep['turn'] }) {
  if (turn === 'arrive') return <ArriveIcon size={15} />;
  if (turn === 'left' || turn === 'sharp-left') return <TurnLeftIcon size={15} />;
  if (turn === 'right' || turn === 'sharp-right') return <TurnRightIcon size={15} />;
  return <StraightIcon size={15} />;
}

/** Snitt av reolen med den aktuelle hylla markert. */
export function ShelfDiagram({
  levels,
  active,
  large,
}: {
  levels: number;
  active: number;
  large?: boolean;
}) {
  return (
    <div className={`shelf${large ? ' shelf--large' : ''}`} aria-hidden="true">
      {Array.from({ length: levels }, (_, i) => {
        const level = levels - i;
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

/**
 * Hvor langt inn i gangen seksjonen står. Reolrader er lange, så «seksjon
 * G1-01» sier ingenting alene – det er meterne inn i gangen man trenger.
 */
function AislePosition({ position, aisle }: { position: ShelfPosition; aisle: string }) {
  return (
    <div className="along">
      <div className="along__text">
        <strong>{formatMeters(position.metersIn)} inn i {aisle.toLowerCase()}</strong>
        <p>
          Regnet fra enden nærmest inngangen. Seksjon {position.index} av {position.count} i raden.
        </p>
      </div>
      <div className="along__bar" aria-hidden="true">
        <span className="along__run" />
        <span className="along__mark" style={{ left: `${position.fraction * 100}%` }} />
        <span className="along__end along__end--start">Inngang</span>
        <span className="along__end along__end--far">
          {formatMeters(position.runLength)}
        </span>
      </div>
    </div>
  );
}

export function ProductSheet({
  product,
  fixture,
  departmentName,
  position,
  routeMeters,
  steps,
  arrived,
  walking,
  inList,
  picking,
  snap,
  onSnapChange,
  onShowRoute,
  onClearRoute,
  onWalk,
  onStopWalk,
  onArrived,
  onToggleList,
  onClose,
}: Props) {
  const hasRoute = routeMeters !== null && steps.length > 0;
  const firstStep = steps[0];

  const header = (
    <div className="sheet__head">
      <span className="sheet__art sheet__art--large">
        <ProductImage product={product} size={44} />
      </span>
      <div className="sheet__title">
        <div className="meta">{product.brand}</div>
        <h2>{product.name}</h2>
        <div className="sheet__where">{departmentName}</div>
      </div>
      <div className="sheet__price">
        <strong>{price(product.price)}</strong>
        <span className="meta">kr / {product.unit}</span>
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="Lukk" type="button">
        <CloseIcon />
      </button>
    </div>
  );

  let footer;
  if (arrived) {
    footer = (
      <button className="btn btn--wide" onClick={onClearRoute} type="button">
        <CheckIcon size={15} />
        Ferdig
      </button>
    );
  } else if (hasRoute) {
    footer = (
      <div className="routebar">
        <span className="routebar__icon">
          <StepIcon turn={firstStep.turn} />
        </span>
        <div className="routebar__text">
          <strong>{firstStep.text}</strong>
          <span className="meta">
            {formatMeters(routeMeters)} · {formatWalkTime(routeMeters)}
          </span>
        </div>
        {walking ? (
          <button className="btn btn--sm btn--ghost" onClick={onStopWalk} type="button">
            Stopp
          </button>
        ) : (
          <button className="btn btn--sm" onClick={onWalk} type="button">
            Gå
          </button>
        )}
        <button className="btn btn--sm btn--ghost" onClick={onArrived} type="button">
          Framme
        </button>
      </div>
    );
  } else {
    footer = (
      <>
        <button className="btn btn--wide" onClick={onShowRoute} disabled={picking} type="button">
          <RouteIcon />
          {picking ? 'Velg hvor du står' : 'Vis veien'}
        </button>
        <button
          className={`btn btn--sm${inList ? '' : ' btn--ghost'}`}
          onClick={onToggleList}
          type="button"
          style={{ flex: 'none', paddingInline: 14 }}
        >
          {inList ? <CheckIcon size={14} /> : <PlusCircleIcon size={14} />}
          {inList ? 'I lista' : 'Legg i liste'}
        </button>
      </>
    );
  }

  return (
    <BottomSheet
      snap={snap}
      onSnapChange={onSnapChange}
      header={header}
      footer={footer}
      label={`Plassering av ${product.name}`}
    >
      <div className="place">
        <div className="place__shelf">
          <ShelfDiagram levels={fixture.levels} active={product.placement.level} large={arrived} />
          <div className="place__text">
            <strong>
              Hylle {product.placement.level} av {fixture.levels}
            </strong>
            <p>{product.placement.heightCm} cm over gulv</p>
            {arrived && (
              <span className="arrival__mark">
                <ArriveIcon size={14} />
                Du står foran varen
              </span>
            )}
          </div>
        </div>

        <AislePosition position={position} aisle={fixture.aisle} />
      </div>

      {hasRoute && !arrived && (
        <ol className="steps">
          {steps.map((step, index) => (
            <li key={step.id} data-current={index === 0}>
              <span className="steps__icon">
                <StepIcon turn={step.turn} />
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      )}

    </BottomSheet>
  );
}
