// Custom inline SVG icons — no external icon library.
// Every icon accepts a className so callers control size/color.

function Svg({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Svg>
  );
}

export function MissionIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 2l7 3.5v6c0 4.7-3.3 7.6-7 9.5-3.7-1.9-7-4.8-7-9.5v-6L12 2Z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

export function GenerateIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </Svg>
  );
}

export function ColleagueIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 5h16v11H8l-4 3V5Z" />
      <path d="M8.5 10h.01M12 10h.01M15.5 10h.01" />
    </Svg>
  );
}

export function OnboardingIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6 1.3 0 2.6.3 3.6.8" />
      <path d="M17 17l1.8 1.8L22 15.5" />
    </Svg>
  );
}

export function AcronymIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 19V5h9a4 4 0 0 1 0 8H8" />
      <path d="M13 13l5 6" />
    </Svg>
  );
}

export function ExpertIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.4-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
      <path d="M17 4.5a3 3 0 0 1 0 6" />
      <path d="M18 13.8c2.2.5 3.8 2.3 3.8 5.2" />
    </Svg>
  );
}

export function DocumentIcon(props) {
  return (
    <Svg {...props}>
      <path d="M7 3h7l5 5v13H7V3Z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6M10 17h4" />
    </Svg>
  );
}

export function SparkIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
    </Svg>
  );
}

export function ShieldIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 2l7 3.5v6c0 4.7-3.3 7.6-7 9.5-3.7-1.9-7-4.8-7-9.5v-6L12 2Z" />
    </Svg>
  );
}

export function MenuIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function CloseIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function AlertIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l9.5 16.5H2.5L12 3Z" />
      <path d="M12 9v5M12 17.5h.01" />
    </Svg>
  );
}

export function BoltIcon(props) {
  return (
    <Svg {...props}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" />
    </Svg>
  );
}

export function SendIcon(props) {
  return (
    <Svg {...props}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
    </Svg>
  );
}

export function LockIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </Svg>
  );
}

export function ClockIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function TrophyIcon(props) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M10 17h4v4h-4z" />
    </Svg>
  );
}

export function BookIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </Svg>
  );
}

export function UploadIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Svg>
  );
}

export function SunIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props) {
  return (
    <Svg {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </Svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function LogoutIcon(props) {
  return (
    <Svg {...props}>
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 17l-5-5 5-5M5 12h11" />
    </Svg>
  );
}

export function HelpIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function InfoIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

export function UsersIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 19a5.5 5.5 0 0 0-2-4.2" />
    </Svg>
  );
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ChartIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 20V4M4 20h16" />
      <rect x="7" y="12" width="3" height="5" rx="0.5" />
      <rect x="12" y="8" width="3" height="9" rx="0.5" />
      <rect x="17" y="5" width="3" height="12" rx="0.5" />
    </Svg>
  );
}

export function LayersIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5Z" />
      <path d="M3 13l9 5 9-5M3 17l9 5 9-5" />
    </Svg>
  );
}
