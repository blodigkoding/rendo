/** Tynne, monokrome ikoner – 1 px strek, ingen fyll. */

interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const SearchIcon = ({ size = 17 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const CloseIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const BackIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M14.5 5L8 12l6.5 7" />
  </svg>
);

export const ChevronRight = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M9.5 5l6.5 7-6.5 7" />
  </svg>
);

export const PlusIcon = ({ size = 15 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = ({ size = 15 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

export const RouteIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="6" cy="18.5" r="2.2" />
    <circle cx="18" cy="5.5" r="2.2" />
    <path d="M8.2 18.5H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h1.8" />
  </svg>
);

export const ArriveIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </svg>
);

export const StraightIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 20V5" />
    <path d="M7.5 9.5L12 5l4.5 4.5" />
  </svg>
);

export const TurnLeftIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M17 20v-8.5a3 3 0 0 0-3-3H6" />
    <path d="M9.5 5L5.5 8.5 9.5 12" />
  </svg>
);

export const TurnRightIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M7 20v-8.5a3 3 0 0 1 3-3h8" />
    <path d="M14.5 5l4 3.5-4 3.5" />
  </svg>
);

export const CheckIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2} aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const ListIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" strokeWidth={2} />
  </svg>
);

export const PlusCircleIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 8.4v7.2M8.4 12h7.2" />
  </svg>
);

export const RotateLeftIcon = ({ size = 17 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4.5 9.5A8 8 0 1 1 4 13.5" />
    <path d="M8.6 9.5H4.2V5" />
  </svg>
);

export const RotateRightIcon = ({ size = 17 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M19.5 9.5A8 8 0 1 0 20 13.5" />
    <path d="M15.4 9.5h4.4V5" />
  </svg>
);

export const FitIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4 9V4.5h4.5M15.5 4.5H20V9M20 15v4.5h-4.5M8.5 19.5H4V15" />
  </svg>
);

export const ScanIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
    <path d="M4 12h16" strokeWidth={1.6} />
  </svg>
);

export const BoxIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 3.2l8 4v9.6l-8 4-8-4V7.2l8-4z" />
    <path d="M4 7.2l8 4 8-4M12 11.2v9.6" />
  </svg>
);

export const PersonIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.6 20.5a7.4 7.4 0 0 1 14.8 0" />
  </svg>
);

export const MapIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8 9 4.5z" />
    <path d="M9 4.5v12.7M15 6.8v12.7" />
  </svg>
);

export const StoreIcon = ({ size = 20 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4 10v9.5h16V10" />
    <path d="M3 9.6l1.7-5.1h14.6L21 9.6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
    <path d="M10 19.5V14h4v5.5" />
  </svg>
);

export const PlanIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.4" />
    <path d="M8.5 3.5v10M14 20.5v-10M3.5 13.5h5M14 10.5h6.5" />
  </svg>
);

export const CubeIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
);
