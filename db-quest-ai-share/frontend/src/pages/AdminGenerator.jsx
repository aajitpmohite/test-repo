import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { ArrowRightIcon, SparkIcon } from '../components/icons'
import { DifficultyBadge, PageHeader, RichText, Spinner, TopicBadge } from '../components/ui'

const EXAMPLES = [
  'Using confidential data in external AI tools',
  'Phishing email from a fake senior manager',
  'Sharing credentials over the phone',
  'Vendor invoice fraud',
  'Tailgating into a secure office',
]

export default function AdminGenerator() {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('New joiners')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [loading, setLoading] = useState(false)
  const [mission, setMission] = useState(null)
  const [error, setError] = useState('')

  async function generate(e) {
    e?.preventDefault()
    if (!topic.trim() || loading) return
    setLoading(true)
    setError('')
    setMission(null)
    try {
      const m = await api.generateMission({ topic, audience, difficulty })
      setMission(m)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={SparkIcon}
        title="AI Mission Generator"
        subtitle="Admin tool — turn any policy, process or risk topic into a playable, adaptive escape-room mission."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <form onSubmit={generate} className="card space-y-4 p-6 lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Topic</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Using confidential data in external AI tools"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => setTopic(ex)}>
                {ex}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Audience</label>
            <input
              className="input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="New joiners"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Difficulty</label>
            <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Expert</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading || !topic.trim()}>
            {loading ? <Spinner className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
            {loading ? 'Generating…' : 'Generate mission'}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </form>

        <div className="lg:col-span-3">
          {!mission && !loading && (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-center text-slate-400">
              <SparkIcon className="h-10 w-10" />
              <p className="mt-3 font-medium text-slate-500">Your generated mission preview appears here</p>
              <p className="mt-1 text-sm">Enter a topic and let AI design the scenario, choices and learning points.</p>
            </div>
          )}
          {loading && (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-brand-600">
              <Spinner className="h-8 w-8" />
              <p className="mt-3 text-sm text-slate-500">AI is designing the mission…</p>
            </div>
          )}
          {mission && (
            <div className="card animate-in p-6">
              <div className="flex flex-wrap items-center gap-2">
                <TopicBadge topic={mission.topic} />
                <DifficultyBadge level={mission.difficulty} />
                <span className="badge bg-brand-100 text-brand-700">
                  <SparkIcon className="h-3 w-3" /> AI-generated
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold text-ink">{mission.title}</h2>
              <RichText text={mission.briefing} className="mt-2 text-sm text-slate-600" />

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Steps ({mission.steps.length})
              </h3>
              <ol className="mt-2 space-y-2">
                {mission.steps.map((s, i) => (
                  <li key={s.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="font-semibold text-slate-700">
                      {i + 1}. {s.prompt}
                    </span>
                    <span className="mt-1 block text-slate-400">{s.choices.length} options</span>
                  </li>
                ))}
              </ol>

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Learning points
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {mission.learningPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link to={`/missions/${mission.id}`} className="btn-primary mt-6">
                Play this mission <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
