import { useState } from 'react'
import { api } from '../api'
import { RouteIcon, SparkIcon, UsersIcon } from '../components/icons'
import { Badge, PageHeader, Spinner } from '../components/ui'

export default function Onboarding() {
  const [role, setRole] = useState('Software Engineer')
  const [project, setProject] = useState('Payments Modernization')
  const [days, setDays] = useState(7)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate(e) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.onboarding({ role, project, days: Number(days) })
      setPlan(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={RouteIcon}
        title="AI Onboarding Buddy"
        subtitle="Generate a structured, day-by-day onboarding plan tailored to a role and project."
      />

      <form onSubmit={generate} className="card mb-5 grid gap-4 p-5 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Role</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Project / Team</label>
          <input className="input" value={project} onChange={(e) => setProject(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Days</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="7"
              className="input"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <button type="submit" className="btn-primary px-4" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {plan && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {plan.plan.length}-day plan · {plan.role} · {plan.project}
            </h2>
            <ol className="relative space-y-4 border-l-2 border-brand-100 pl-6">
              {plan.plan.map((d) => (
                <li key={d.day} className="animate-in">
                  <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {d.day}
                  </span>
                  <div className="card p-4">
                    <h3 className="font-semibold text-ink">
                      Day {d.day}: {d.title}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {d.tasks.map((t, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-400" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    {d.resources?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {d.resources.map((r, i) => (
                          <Badge key={i} color="slate">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-ink">
                <UsersIcon className="h-5 w-5 text-brand-600" /> Key contacts
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {plan.keyContacts.map((c, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2.5">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink">Glossary</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {plan.glossary.map((g, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="font-semibold text-brand-700">{g.term}</dt>
                    <dd className="text-slate-600">{g.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
