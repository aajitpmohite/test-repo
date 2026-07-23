// Home page. Role-aware quick actions + a persistent "How it works" explainer so
// anyone landing here understands the two pillars and the admin -> member flow.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../hooks/useHealth';
import {
  MissionIcon, ColleagueIcon, ShieldIcon, DocumentIcon, GenerateIcon, ChartIcon,
  OnboardingIcon, ArrowRightIcon, UploadIcon, BoltIcon, HelpIcon,
} from '../components/icons';

function ActionCard({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="card-interactive group flex flex-col">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold text-strong">{title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition group-hover:gap-2.5">
        Open <ArrowRightIcon className="h-4 w-4" />
      </span>
    </Link>
  );
}

const adminActions = [
  { to: '/documents', icon: UploadIcon, title: 'Upload knowledge', desc: 'Add your team’s guides so the Colleague can answer from them.' },
  { to: '/missions/generate', icon: GenerateIcon, title: 'Create a mission', desc: 'Generate a new compliance escape mission for your team.' },
  { to: '/insights', icon: ChartIcon, title: 'Team insights', desc: 'See anonymized, aggregated training results — never individual scores.' },
];

const memberActions = [
  { to: '/colleague', icon: ColleagueIcon, title: 'Ask a question', desc: 'Get answers grounded in your team’s documents, with sources.' },
  { to: '/onboarding', icon: OnboardingIcon, title: 'My onboarding', desc: 'Generate a day-by-day ramp-up plan for your role.' },
  { to: '/missions', icon: MissionIcon, title: 'My missions', desc: 'Play compliance escape missions and get a private report.' },
];

const steps = [
  { n: 1, icon: UploadIcon, t: 'Admin uploads docs', d: 'Team guides, runbooks and policies are indexed into a private knowledge base.' },
  { n: 2, icon: ColleagueIcon, t: 'Members ask & learn', d: 'The Digital Colleague answers questions with cited sources from those docs.' },
  { n: 3, icon: MissionIcon, t: 'Everyone plays missions', d: 'Escape-room scenarios build real compliance instinct; scores stay private.' },
];

export default function Dashboard() {
  const { user, activeTeam, isAdmin } = useAuth();
  const { liveAi, aiProvider } = useHealth();
  const firstName = (user?.fullName || user?.email || 'there').split(' ')[0].split('@')[0];
  const actions = isAdmin ? adminActions : memberActions;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-600/25 via-card to-app p-8 shadow-card md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:32px_32px] opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge">{activeTeam?.name || 'Your team'}</span>
            <span className="badge capitalize">{isAdmin ? 'Admin' : 'Member'}</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-strong md:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
            {isAdmin
              ? 'Set your team up for success: upload knowledge, create missions, and track anonymized progress.'
              : 'Ask questions grounded in your team’s docs, plan your onboarding, and sharpen your compliance instincts.'}
          </p>
        </div>
      </section>

      {/* Role-aware quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">
          {isAdmin ? 'Admin quick actions' : 'Your quick actions'}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((a) => <ActionCard key={a.to} {...a} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="card">
        <div className="flex items-center gap-2">
          <HelpIcon className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-strong">How DB Quest AI works</h3>
        </div>
        <p className="mt-1 text-sm text-muted">Two pillars, one flow — from team knowledge to confident, compliant people.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="relative surface-inset">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{s.n}</span>
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-3 font-semibold text-strong">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
                {i < steps.length - 1 && (
                  <ArrowRightIcon className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-line md:block" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/help" className="btn-outline">Read the full guide <ArrowRightIcon className="h-4 w-4" /></Link>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-inset px-3 py-2 text-xs text-muted">
            <ShieldIcon className="h-4 w-4 text-accent" />
            {liveAi ? `Live AI (${aiProvider}) · scores stay private` : 'Offline demo mode · scores stay private'}
          </div>
        </div>
      </section>

      {/* Two pillars */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2">
            <ColleagueIcon className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-strong">AI Digital Colleague</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Answers project & process questions from your team’s documents — with citations and a confidence signal.
            Also plans onboarding, explains acronyms, finds experts, and summarises documents.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/colleague" className="chip">Ask</Link>
            <Link to="/documents" className="chip">Documents</Link>
            <Link to="/acronyms" className="chip">Acronyms</Link>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2">
            <MissionIcon className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-strong">AI Escape Missions</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Compliance training as an interactive escape room: make decisions, investigate with the AI Game Master,
            and get a private learning report. Admins see only anonymized team trends.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/missions" className="chip">Play missions</Link>
            {isAdmin && <Link to="/insights" className="chip">Team insights</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
