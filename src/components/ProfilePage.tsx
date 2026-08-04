import { useEffect, useState } from 'react';
import type { Chain, Store } from '../data/types';
import { readRecents } from '../lib/recents';
import { ChainLogo } from './ChainLogo';
import { ChevronRight, ListIcon } from './icons';

/**
 * Profilfanen: hvilken butikk man handler i, veien til handlelista, og de siste
 * søkene. Selve lista bor i sin egen fane.
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
  useEffect(() => setRecents(readRecents()), []);

  return (
    <div className="overlay overlay--flat">
      <div className="overlay__body">
        <header className="info__head">
          <h2>Min profil</h2>
          <p>Butikken din og det du har søkt etter</p>
        </header>

        <button className="profile__store" onClick={onOpenStoreInfo} type="button">
          <span className="profile__store-mark">
            {chain ? <ChainLogo chain={chain} size={13} /> : null}
          </span>
          <span className="profile__store-main">
            <span className="row__name">{store.name}</span>
            <span className="row__sub">
              {store.address} · {store.distanceKm.toFixed(1).replace('.', ',')} km
            </span>
          </span>
          <ChevronRight />
        </button>

        <button className="profile__store" onClick={onOpenList} type="button">
          <span className="profile__store-mark">
            <ListIcon size={18} />
          </span>
          <span className="profile__store-main">
            <span className="row__name">Handleliste</span>
            <span className="row__sub">
              {listCount === 0
                ? 'Ingen varer ennå'
                : `${listCount} ${listCount === 1 ? 'vare' : 'varer'}`}
            </span>
          </span>
          <ChevronRight />
        </button>

        {recents.length > 0 && (
          <div className="block">
            <div className="block__title meta">Siste søk</div>
            <div className="chips">
              {recents.map((term) => (
                <button key={term} className="chip" onClick={() => onSearch(term)} type="button">
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="info__switch" onClick={onSwitchStore} type="button">
          Bytt butikk
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
