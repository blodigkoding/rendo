import type { Chain, Fixture, Product } from '../data/types';
import type { DirectionStep } from '../lib/directions';
import { fixtureTypeName, formatMeters, formatWalkTime, type ShelfPosition } from '../lib/geometry';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { ProductImage } from './ProductImage';
import { ScanButton } from './ScanButton';
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
  chain: Chain | null;
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
 * Hvor langt inn i gangen seksjonen står.
 *
 * En reolrad er tolv–femten meter lang, så seksjonskoden alene sier ingenting
 * om hvor man skal stoppe. Her vises raden ovenfra: du kommer inn fra den ene
 * enden, og merket viser hvor varen står.
 */
function AislePosition({ position, aisle }: { position: ShelfPosition; aisle: string }) {
  const where =
    position.fraction < 0.25
      ? 'rett innenfor der du kommer inn i gangen'
      : position.fraction < 0.6
        ? 'omtrent midtveis i gangen'
        : 'nesten helt innerst i gangen';

  return (
    <div className="along">
      <div className="along__text">
        <strong>Gå {formatMeters(position.metersIn)} inn i {aisle.toLowerCase()}</strong>
        <p>Varen står {where}.</p>
      </div>

      <div className="along__bar" aria-hidden="true">
        <span className="along__label along__label--start">Du kommer inn her</span>
        <span className="along__run">
          {Array.from({ length: Math.min(position.count, 14) }, (_, i) => (
            <span key={i} className="along__tick" />
          ))}
        </span>
        <span className="along__you" />
        <span className="along__mark" style={{ left: `${position.fraction * 100}%` }}>
          <span className="along__mark-dot" />
          <span className="along__mark-label">{formatMeters(position.metersIn)}</span>
        </span>
      </div>
    </div>
  );
}

export function ProductSheet({
  product,
  fixture,
  departmentName,
  chain,
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
        <div className="sheet__where">
          {departmentName} · {fixtureTypeName(fixture)}
        </div>
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
      {chain?.scanApp && (
        <div className="place place--scan">
          <ScanButton chain={chain} product={product} />
        </div>
      )}

      <div className="place">
        <div className="place__shelf">
          <ShelfDiagram levels={fixture.levels} active={product.placement.level} large={arrived} />
          <div className="place__text">
            <strong>
              Hylle {product.placement.level} av {fixture.levels}
            </strong>
            <p>
              {product.placement.heightCm} cm over gulv, i {fixtureTypeName(fixture, true)}
            </p>
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
