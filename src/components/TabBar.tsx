import { ListIcon, PersonIcon, PlanIcon, StoreIcon } from './icons';

/** Fanelinja nederst. Fire steder å være, i alle deler av appen. */

export type Tab = 'butikker' | 'plan' | 'handleliste' | 'profil';

const TABS: Array<{
  id: Tab;
  label: string;
  icon: (props: { size?: number }) => React.ReactElement;
}> = [
  { id: 'butikker', label: 'Butikker', icon: StoreIcon },
  { id: 'plan', label: 'Plan', icon: PlanIcon },
  { id: 'handleliste', label: 'Handleliste', icon: ListIcon },
  { id: 'profil', label: 'Profil', icon: PersonIcon },
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
              {tab.id === 'handleliste' && listCount > 0 && <span className="badge">{listCount}</span>}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
