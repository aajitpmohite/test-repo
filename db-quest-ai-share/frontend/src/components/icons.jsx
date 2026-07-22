// Lightweight inline SVG icon set (no external icon dependency).
// Each icon accepts a className and inherits color via currentColor.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

const make = (paths) =>
  function Icon({ className = 'w-5 h-5' }) {
    return (
      <svg className={className} {...base}>
        {paths}
      </svg>
    )
  }

export const HomeIcon = make(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </>,
)
export const TargetIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </>,
)
export const ChatIcon = make(
  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />,
)
export const BookIcon = make(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 5.5V20.5" />
  </>,
)
export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
    <path d="M17.5 20a5.5 5.5 0 0 0-3-4.9" />
  </>,
)
export const DocIcon = make(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 16h6" />
  </>,
)
export const SparkIcon = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </>,
)
export const BulbIcon = make(
  <>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
  </>,
)
export const ShieldIcon = make(
  <>
    <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
)
export const CheckIcon = make(<path d="m5 12 5 5 9-11" />)
export const XIcon = make(
  <>
    <path d="m6 6 12 12M18 6 6 18" />
  </>,
)
export const SendIcon = make(
  <>
    <path d="M4 12 20 4l-6 16-3-7Z" />
    <path d="m11 13 3-3" />
  </>,
)
export const UploadIcon = make(
  <>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </>,
)
export const ArrowRightIcon = make(<path d="M5 12h14M13 6l6 6-6 6" />)
export const ArrowLeftIcon = make(<path d="M19 12H5M11 6l-6 6 6 6" />)
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </>,
)
export const TrophyIcon = make(
  <>
    <path d="M8 4h8v4a4 4 0 0 1-8 0Z" />
    <path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3" />
    <path d="M10 12.5V16h4v-3.5M8 20h8M12 16v4" />
  </>,
)
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
)
export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />)
export const RouteIcon = make(
  <>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h6a3 3 0 0 0 3-3V8M6 16V9a3 3 0 0 1 3-3h5" />
  </>,
)
