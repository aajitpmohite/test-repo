import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BookIcon,
  ChatIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
  UsersIcon,
} from '../components/icons'

const FEATURES = [
  {
    to: '/colleague',
    icon: ChatIcon,
    title: 'Ask Digital Colleague',
    desc: 'Source-grounded answers about your project, process and systems.',
    color: 'from-brand-500 to-brand-700',
  },
  {
    to: '/onboarding',
    icon: RouteIcon,
    title: 'Onboarding Buddy',
    desc: 'Generate a personalised day-by-day plan for new joiners.',
    color: 'from-violet-500 to-violet-700',
  },
  {
    to: '/acronyms',
    icon: BookIcon,
    title: 'Acronym Explainer',
    desc: 'Decode UBR, SFT, IRT and every other bank TLA instantly.',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    to: '/experts',
    icon: UsersIcon,
    title: 'Expert Finder',
    desc: 'Find the right contact based on document ownership & topics.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    to: '/missions',
    icon: TargetIcon,
    title: 'Escape Missions',
    desc: 'Learn compliance by solving realistic, adaptive scenarios.',
    color: 'from-rose-500 to-rose-700',
  },
  {
    to: '/admin',
    icon: SparkIcon,
    title: 'Generate Mission',
    desc: 'Turn any policy or topic into an interactive mission with AI.',
    color: 'from-cyan-500 to-blue-600',
  },
]

export default function Dashboard({ health }) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-ink p-8 text-white sm:p-10">
        <div className="max-w-2xl">
          <span className="badge bg-white/15 text-white">
            <SparkIcon className="h-3.5 w-3.5" /> DB FutureReady 2026
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            Learn faster. Work smarter. Stay compliant.
          </h1>
          <p className="mt-3 text-brand-100">
            An AI Digital Colleague that answers questions with sources, onboards new joiners, and
            turns important policies into interactive escape-room missions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/missions" className="btn bg-white text-brand-800 hover:bg-brand-50">
              <TargetIcon className="h-5 w-5" /> Start a Mission
            </Link>
            <Link to="/colleague" className="btn bg-white/10 text-white hover:bg-white/20">
              <ChatIcon className="h-5 w-5" /> Ask Digital Colleague
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-brand-200">
            <span className={`h-2 w-2 rounded-full ${health?.liveAi ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            {health?.liveAi
              ? `Live AI enabled via ${health.aiProvider}`
              : 'Running in demo mode — fully functional AI with zero setup'}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-ink">Explore the platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white`}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                Open <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold text-ink">How AI is embedded in the product</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Answers questions', 'Retrieval-grounded Q&A over your team documents with cited sources.'],
            ['Summarises documents', 'Key points, decisions, action items, risks and people mentioned.'],
            ['Generates onboarding', 'A structured day-by-day plan tailored to role and project.'],
            ['Creates missions', 'Any topic becomes a playable, adaptive compliance scenario.'],
            ['Adapts hints & feedback', 'A Game Master guides investigation without giving the answer.'],
            ['Personalises learning', 'A private risk-awareness score with strengths and next steps.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-ink">{t}</p>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
