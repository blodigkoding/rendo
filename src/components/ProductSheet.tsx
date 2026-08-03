import type { Fixture, Product } from '../data/types';
import type { DirectionStep } from '../lib/directions';
import { formatMeters, formatWalkTime } from '../lib/geometry';
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
  routeMeters: number | null;
  steps: DirectionStep[];
  /** Ruten er gått ferdig – da er det hylla som gjelder. */
  arrived: boolean;
  inList: boolean;
  picking: boolean;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  onShowRoute: () => void;
  onClearRoute: () => void;
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="fact__label">{label}</div>
      <div className="fact__value">{value}</div>
    </div>
  );
}

export function ProductSheet({
  product,
  fixture,
  departmentName,
  routeMeters,
  steps,
  arrived,
  inList,
  picking,
  snap,
  onSnapChange,
  onShowRoute,
  onClearRoute,
  onArrived,
  onToggleList,
  onClose,
}: Props) {
  const hasRoute = routeMeters !== null && steps.length > 0;
  const firstStep = steps[0];

  const header = (
    <div className="sheet__head">
      <span className="sheet__art">
        <ProductImage product={product} size={30} />
      </span>
      <div className="sheet__title">
        <div className="meta">{product.brand}</div>
        <h2>{product.name}</h2>
        <div className="sheet__where">
          {fixture.aisle} · {fixture.code} · hylle {product.placement.level}
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
        <button className="btn btn--sm" onClick={onArrived} type="button">
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
      {arrived && (
        <div className="arrival">
          <ShelfDiagram levels={fixture.levels} active={product.placement.level} large />
          <div className="arrival__text">
            <strong>
              Hylle {product.placement.level} av {fixture.levels}
            </strong>
            <p>
              {product.placement.heightCm} cm over gulv, {product.placement.facings} fronter bredt.
              Seksjon {fixture.code} i {fixture.aisle.toLowerCase()}.
            </p>
            <span className="arrival__mark">
              <ArriveIcon size={14} />
              Du står foran varen
            </span>
          </div>
        </div>
      )}

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

      <div className="placement">
        <div className="placement__facts">
          <Fact label="Avdeling" value={departmentName} />
          <Fact label="Gang" value={fixture.aisle} />
          <Fact label="Reolseksjon" value={fixture.code} />
          <Fact label="Hylle" value={`${product.placement.level} av ${fixture.levels}`} />
          <Fact label="Høyde" value={`${product.placement.heightCm} cm over gulv`} />
          <Fact label="Fronter" value={String(product.placement.facings)} />
          <Fact label="På lager" value={`${product.stock} stk`} />
          <Fact label="EAN" value={product.ean} />
        </div>
        {!arrived && <ShelfDiagram levels={fixture.levels} active={product.placement.level} />}
      </div>
    </BottomSheet>
  );
}
