import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { api } from './api'
import {
  BookIcon,
  ChatIcon,
  DocIcon,
  HomeIcon,
  MenuIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
  UsersIcon,
} from './components/icons'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'
import MissionPlay from './pages/MissionPlay'
import AdminGenerator from './pages/AdminGenerator'
import Colleague from './pages/Colleague'
import Onboarding from './pages/Onboarding'
import Acronyms from './pages/Acronyms'
import Experts from './pages/Experts'
import Documents from './pages/Documents'

const NAV = [
  { section: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: HomeIcon, end: true }] },
  {
    section: 'Escape Missions',
    items: [
      { to: '/missions', label: 'Missions', icon: TargetIcon },
      { to: '/admin', label: 'Generate Mission', icon: SparkIcon },
    ],
  },
  {
    section: 'Digital Colleague',
    items: [
      { to: '/colleague', label: 'Ask Colleague', icon: ChatIcon },
      { to: '/onboarding', label: 'Onboarding Buddy', icon: RouteIcon },
      { to: '/acronyms', label: 'Acronym Explainer', icon: BookIcon },
      { to: '/experts', label: 'Expert Finder', icon: UsersIcon },
      { to: '/documents', label: 'Documents', icon: DocIcon },
    ],
  },
]

function Sidebar({ health, open, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-ink text-white transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-black">
            DB
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">DB Quest AI</div>
            <div className="text-[11px] text-slate-400">Digital Colleague + Escape Missions</div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${health?.liveAi ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            {health
              ? health.liveAi
                ? `Live AI · ${health.aiProvider}`
                : 'Demo AI (offline mock)'
              : 'Connecting…'}
          </div>
          {health && (
            <div className="mt-1 text-slate-500">
              {health.missions} missions · {health.documents} docs
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth(null))
  }, [])

  return (
    <div className="min-h-full">
      <Sidebar
        health={health}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 backdrop-blur lg:hidden">
          <button className="btn-ghost p-2" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <span className="font-bold">DB Quest AI</span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <Routes>
            <Route path="/" element={<Dashboard health={health} />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/missions/:id" element={<MissionPlay />} />
            <Route path="/admin" element={<AdminGenerator />} />
            <Route path="/colleague" element={<Colleague />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/acronyms" element={<Acronyms />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/documents" element={<Documents />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
