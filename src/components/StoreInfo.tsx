import type { Chain, Store, StorePlan } from '../data/types';
import { Wordmark } from './Wordmark';
import { BackIcon, ChevronRight } from './icons';

/** «Butikk»-fanen: hva slags butikk dette er, og veien til en annen. */

interface Props {
  store: Store;
  chain: Chain | null;
  plan: StorePlan;
  productCount: number;
  onSwitchStore: () => void;
  onClose: () => void;
  onPickDepartment: (departmentId: string) => void;
}

export function StoreInfo({
  store,
  chain,
  plan,
  productCount,
  onSwitchStore,
  onClose,
  onPickDepartment,
}: Props) {
  const aisles = new Set(plan.fixtures.map((f) => f.aisle));

  return (
    <div className="overlay">
      <div className="overlay__bar">
        <button className="icon-btn" onClick={onClose} aria-label="Lukk" type="button">
          <BackIcon />
        </button>
        <strong style={{ flex: 1, fontWeight: 500, letterSpacing: '-0.02em' }}>Om butikken</strong>
      </div>
      <div className="overlay__body">
        <header className="info__head">
          {chain ? <Wordmark chain={chain} large /> : null}
          <h2>{store.name}</h2>
          <p>
            {store.address}, {store.postalCode} {store.city}
          </p>
        </header>

        <div className="info__grid">
          <div>
            <div className="fact__label">Åpent</div>
            <div className="fact__value">{store.openingHours}</div>
          </div>
          <div>
            <div className="fact__label">Avstand</div>
            <div className="fact__value">
              {store.distanceKm.toFixed(1).replace('.', ',')} km
            </div>
          </div>
          <div>
            <div className="fact__label">Salgsflate</div>
            <div className="fact__value">{store.areaM2 ?? '–'} m²</div>
          </div>
          <div>
            <div className="fact__label">Ganger</div>
            <div className="fact__value">{aisles.size}</div>
          </div>
          <div>
            <div className="fact__label">Reolseksjoner</div>
            <div className="fact__value">{plan.fixtures.length}</div>
          </div>
          <div>
            <div className="fact__label">Varer i kartet</div>
            <div className="fact__value">{productCount}</div>
          </div>
        </div>

        {store.services && store.services.length > 0 && (
          <div className="block">
            <div className="block__title meta">Tjenester</div>
            <div className="chips">
              {store.services.map((service) => (
                <span key={service} className="chip">
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="block">
          <div className="block__title meta">Avdelinger</div>
          <div className="dept-grid">
            {plan.departments.map((dept) => (
              <button
                key={dept.id}
                className="dept"
                onClick={() => onPickDepartment(dept.id)}
                type="button"
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>

        <button className="info__switch" onClick={onSwitchStore} type="button">
          Bytt butikk
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
