import { useEffect, useState } from 'react';
import type { Chain, Store } from '../data/types';
import { readRecents } from '../lib/recents';
import { useSettings } from '../lib/settings';
import { ChainLogo } from './ChainLogo';
import { ChevronRight, CubeIcon, ListIcon, PlanIcon, StoreIcon } from './icons';

/**
 * Profilen.
 *
 * Det finnes ingen innlogging i rendo ennå, så dette er en demoprofil. Den er
 * satt opp som en vanlig profilside: hvem du er øverst, så det du bruker
 * appen til, så innstillinger, så litt om appen.
 */

interface Props {
  store: Store;
  chain: Chain | null;
  listCount: number;
  onOpenList: () => void;
  onSearch: (term: string) => void;
  onSwitchStore: () => void;
  onOpenStoreInfo: () => void;
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button className="prow" onClick={onClick} type="button">
      <span className="prow__icon">{icon}</span>
      <span className="prow__label">{label}</span>
      {value && <span className="prow__value">{value}</span>}
      <ChevronRight />
    </button>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="prow prow--static">
      <span className="prow__label">
        {label}
        {hint && <span className="prow__hint">{hint}</span>}
      </span>
      <button
        className="switch"
        data-on={on}
        onClick={() => onChange(!on)}
        role="switch"
        aria-checked={on}
        aria-label={label}
        type="button"
      >
        <span className="switch__knob" />
      </button>
    </div>
  );
}

export function ProfilePage({
  store,
  chain,
  listCount,
  onOpenList,
  onSearch,
  onSwitchStore,
  onOpenStoreInfo,
}: Props) {
  const [recents, setRecents] = useState<string[]>([]);
  const [settings, setSettings] = useSettings();

  useEffect(() => setRecents(readRecents()), []);

  return (
    <div className="overlay overlay--flat">
      <div className="overlay__body">
        <header className="profile__head">
          <span className="profile__avatar" aria-hidden="true">
            AB
          </span>
          <div>
            <h2>Adrian</h2>
            <p>Demoprofil · ingen innlogging ennå</p>
          </div>
        </header>

        <section className="block">
          <div className="block__title meta">Handelen din</div>
          <div className="prows">
            <Row
              icon={<ListIcon size={18} />}
              label="Handleliste"
              value={
                listCount === 0 ? 'Tom' : `${listCount} ${listCount === 1 ? 'vare' : 'varer'}`
              }
              onClick={onOpenList}
            />
            <Row
              icon={chain ? <ChainLogo chain={chain} size={12} /> : <StoreIcon size={18} />}
              label="Butikken din"
              value={store.name}
              onClick={onOpenStoreInfo}
            />
            <Row
              icon={<StoreIcon size={18} />}
              label="Bytt butikk"
              onClick={onSwitchStore}
            />
          </div>
        </section>

        {recents.length > 0 && (
          <section className="block">
            <div className="block__title meta">Siste søk</div>
            <div className="chips">
              {recents.map((term) => (
                <button key={term} className="chip" onClick={() => onSearch(term)} type="button">
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="block">
          <div className="block__title meta">Visning</div>
          <div className="prows">
            <div className="prow prow--static">
              <span className="prow__label">Butikken åpner i</span>
              <div className="viewswitch viewswitch--inline">
                <button
                  data-active={settings.defaultView === '2d'}
                  onClick={() => setSettings({ defaultView: '2d' })}
                  type="button"
                >
                  <PlanIcon size={14} />
                  Plan
                </button>
                <button
                  data-active={settings.defaultView === '3d'}
                  onClick={() => setSettings({ defaultView: '3d' })}
                  type="button"
                >
                  <CubeIcon size={14} />
                  3D
                </button>
              </div>
            </div>
            <Toggle
              label="Avdelingsnavn i kartet"
              hint="Navnene som står oppå reolene"
              on={settings.showLabels}
              onChange={(on) => setSettings({ showLabels: on })}
            />
          </div>
        </section>

        <section className="block">
          <div className="block__title meta">Om rendo</div>
          <div className="prows">
            <div className="prow prow--static">
              <span className="prow__label">Versjon</span>
              <span className="prow__value">0.1.0 · demo</span>
            </div>
            <div className="prow prow--static">
              <span className="prow__label">Butikkdata</span>
              <span className="prow__value">Demodata</span>
            </div>
          </div>
          <p className="profile__note">
            Butikkene, varene og plasseringene er laget for demonstrasjon. Når rendo kobles til
            kjedenes egne plan- og planogramdata, kommer alt herfra i stedet.
          </p>
        </section>
      </div>
    </div>
  );
}
