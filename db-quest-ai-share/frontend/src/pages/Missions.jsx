import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowRightIcon,
  ClockIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
} from '../components/icons'
import {
  Badge,
  DifficultyBadge,
  EmptyState,
  PageHeader,
  Spinner,
  TopicBadge,
} from '../components/ui'

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('dbquest_progress') || '{}')
  } catch {
    return {}
  }
}

export default function Missions() {
  const [missions, setMissions] = useState(null)
  const [error, setError] = useState('')
  const progress = getProgress()

  useEffect(() => {
    api
      .listMissions()
      .then(setMissions)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <PageHeader
        icon={TargetIcon}
        title="Escape Missions"
        subtitle="Pick a mission and learn by making realistic workplace decisions. Your score stays private to you."
      >
        <Link to="/admin" className="btn-outline">
          <SparkIcon className="h-4 w-4" /> Generate a mission
        </Link>
      </PageHeader>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!missions && !error && (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {missions && missions.length === 0 && (
        <EmptyState icon={TargetIcon} title="No missions yet" subtitle="Generate one to get started." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {missions?.map((m) => {
          const done = progress[m.id]
          return (
            <Link
              key={m.id}
              to={`/missions/${m.id}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TopicBadge topic={m.topic} />
                  <DifficultyBadge level={m.difficulty} />
                  {m.generated && (
                    <Badge color="blue">
                      <SparkIcon className="h-3 w-3" /> AI-generated
                    </Badge>
                  )}
                </div>
                {done ? (
                  <Badge color="green">
                    <TrophyIcon className="h-3.5 w-3.5" /> {done.score}/100
                  </Badge>
                ) : (
                  <Badge color="slate">Not started</Badge>
                )}
              </div>

              <h3 className="mt-3 text-lg font-semibold text-ink">{m.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{m.summary}</p>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" /> {m.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <TrophyIcon className="h-4 w-4" /> {m.points} pts
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  {done ? 'Replay' : 'Play'} <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
