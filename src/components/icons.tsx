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

export const CubeIcon = ({ size = 16 }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
);
