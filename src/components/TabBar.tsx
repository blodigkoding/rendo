import { ListIcon, MapIcon, SearchIcon, StoreIcon } from './icons';

/** Fanelinja nederst. Fire steder å være: kartet, søket, lista og butikken. */

export type Tab = 'kart' | 'sok' | 'liste' | 'butikk';

const TABS: Array<{ id: Tab; label: string; icon: (props: { size?: number }) => React.ReactElement }> = [
  { id: 'kart', label: 'Kart', icon: MapIcon },
  { id: 'sok', label: 'Søk', icon: SearchIcon },
  { id: 'liste', label: 'Liste', icon: ListIcon },
  { id: 'butikk', label: 'Butikk', icon: StoreIcon },
];

interface Props {
  active: Tab;
  listCount: number;
  onSelect: (tab: Tab) => void;
}

export function TabBar({ active, listCount, onSelect }: Props) {
  return (
    <nav className="tabbar" aria-label="Hovedmeny">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className="tabbar__tab"
            data-active={tab.id === active}
            onClick={() => onSelect(tab.id)}
            type="button"
            aria-current={tab.id === active ? 'page' : undefined}
          >
            <span className="tabbar__icon">
              <Icon size={22} />
              {tab.id === 'liste' && listCount > 0 && <span className="badge">{listCount}</span>}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
