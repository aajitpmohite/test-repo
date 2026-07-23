// App shell: authentication gate + the signed-in layout (sidebar, top bar, routes).
// The top bar carries the team switcher, AI-mode indicator, theme toggle and user menu.
// Navigation and routes are role-aware — admin-only items are hidden from members.
import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  DashboardIcon, MissionIcon, GenerateIcon, ColleagueIcon, OnboardingIcon, AcronymIcon,
  ExpertIcon, DocumentIcon, ShieldIcon, MenuIcon, CloseIcon, SunIcon, MoonIcon,
  ChevronDownIcon, LogoutIcon, HelpIcon, ChartIcon, UsersIcon, CheckIcon,
} from './components/icons';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import MissionPlay from './pages/MissionPlay';
import AdminGenerator from './pages/AdminGenerator';
import Colleague from './pages/Colleague';
import Onboarding from './pages/Onboarding';
import Acronyms from './pages/Acronyms';
import Experts from './pages/Experts';
import Documents from './pages/Documents';
import Insights from './pages/Insights';
import Help from './pages/Help';
import Login from './pages/Login';
import { apiGet } from './api';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';

const navGroups = [
  { title: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: DashboardIcon, end: true }] },
  {
    title: 'Escape Missions',
    items: [
      { to: '/missions', label: 'Missions', icon: MissionIcon },
      { to: '/missions/generate', label: 'Create Mission', icon: GenerateIcon, adminOnly: true },
      { to: '/insights', label: 'Team Insights', icon: ChartIcon, adminOnly: true },
    ],
  },
  {
    title: 'Digital Colleague',
    items: [
      { to: '/colleague', label: 'Ask', icon: ColleagueIcon },
      { to: '/onboarding', label: 'Onboarding', icon: OnboardingIcon },
      { to: '/acronyms', label: 'Acronyms', icon: AcronymIcon },
      { to: '/experts', label: 'Experts', icon: ExpertIcon },
      { to: '/documents', label: 'Documents', icon: DocumentIcon },
    ],
  },
  { title: 'Support', items: [{ to: '/help', label: 'How it works', icon: HelpIcon }] },
];

const routeMeta = {
  '/': 'Dashboard',
  '/missions': 'Escape Missions',
  '/missions/generate': 'Create Mission',
  '/insights': 'Team Insights',
  '/colleague': 'Ask the Colleague',
  '/onboarding': 'Onboarding Planner',
  '/acronyms': 'Acronym Explorer',
  '/experts': 'Expert Finder',
  '/documents': 'Documents',
  '/help': 'How it works',
};

function getInitialTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) return attr;
  try {
    return localStorage.getItem('dbquest_theme') || 'light';
  } catch {
    return 'light';
  }
}

function useClickOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
        <ShieldIcon className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-strong">DB Quest AI</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">Secure · Guided</p>
      </div>
    </div>
  );
}

function TeamSwitcher() {
  const { teams, activeTeam, switchTeam } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  if (!activeTeam) return null;
  return (
    <div className="relative" ref={ref}>
      <button className="btn-outline btn-sm max-w-[200px]" onClick={() => setOpen((v) => !v)}>
        <UsersIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{activeTeam.name}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-2 w-64 rounded-xl border border-line bg-card p-1.5 shadow-card">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">Your teams</p>
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => { switchTeam(t.id); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-body hover:bg-elevated"
            >
              <span className="truncate">
                {t.name}
                <span className="ml-2 text-xs text-faint">{t.role}</span>
              </span>
              {t.id === activeTeam.id && <CheckIcon className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, activeTeam, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  if (!user) return null;
  const initials = (user.fullName || user.email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded-full border border-line bg-elevated p-1 pr-2 hover:border-brand-500/40" onClick={() => setOpen((v) => !v)} aria-label="User menu">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">{initials}</span>
        <ChevronDownIcon className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-card p-1.5 shadow-card">
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-strong">{user.fullName || 'Signed in'}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            {activeTeam && (
              <p className="mt-1 text-xs text-faint">
                {activeTeam.name} · <span className="capitalize text-accent">{role}</span>
              </p>
            )}
          </div>
          <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-body hover:bg-elevated">
            <LogoutIcon className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ onNavigate, isAdmin }) {
  return (
    <nav className="space-y-6">
      {navGroups.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || isAdmin);
        if (!items.length) return null;
        return (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">{group.title}</p>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
                    className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                    <Icon className="h-[18px] w-[18px]" /> {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AdminRoute({ isAdmin, children }) {
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { isAuthenticated, isAdmin, loading, activeTeamId } = useAuth();
  const [health, setHealth] = useState({ aiProvider: 'mock', liveAi: false });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('dbquest_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) apiGet('/api/health').then(setHealth).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted">
        <Spinner /> Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Login />;

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));
  const pageTitle = routeMeta[location.pathname] || 'DB Quest AI';

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-inset px-4 py-6 lg:flex">
        <div className="px-1"><Brand /></div>
        <div className="mt-8 flex-1 overflow-y-auto pr-1"><SidebarNav isAdmin={isAdmin} /></div>
        <div className="rounded-2xl border border-line bg-gradient-to-br from-elevated to-card p-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${health.liveAi ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse-soft`} />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">AI mode</p>
          </div>
          <p className="mt-1.5 text-base font-bold text-strong">{health.liveAi ? 'Live AI' : 'Offline demo'}</p>
          <p className="text-xs text-faint">Provider: {health.aiProvider || 'mock'}</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-fade-in flex-col border-r border-line bg-inset px-4 py-6">
            <div className="flex items-center justify-between px-1">
              <Brand />
              <button className="btn-ghost p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu"><CloseIcon /></button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto"><SidebarNav isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-inset px-4 py-3 md:px-8">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><MenuIcon /></button>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">DB Quest AI</p>
            <p className="truncate text-sm font-semibold text-strong">{pageTitle}</p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <TeamSwitcher />
            <button className="btn-ghost border border-line p-2" onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
            </button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {/* Keying by team forces pages to refetch when the active team changes. */}
          <div key={`${activeTeamId}:${location.pathname}`} className="mx-auto max-w-6xl animate-fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/missions/play/:missionId" element={<MissionPlay />} />
              <Route path="/missions/generate" element={<AdminRoute isAdmin={isAdmin}><AdminGenerator /></AdminRoute>} />
              <Route path="/insights" element={<AdminRoute isAdmin={isAdmin}><Insights /></AdminRoute>} />
              <Route path="/colleague" element={<Colleague />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/acronyms" element={<Acronyms />} />
              <Route path="/experts" element={<Experts />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
