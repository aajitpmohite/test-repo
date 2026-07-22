import { useState } from 'react'
import { api } from '../api'
import { SearchIcon, UsersIcon } from '../components/icons'
import { Badge, EmptyState, PageHeader, Spinner } from '../components/ui'

const EXAMPLES = [
  'deployment pipeline',
  'architecture and API design',
  'production incidents',
  'ETL and data pipeline',
  'security and access',
]

export default function Experts() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function find(text) {
    const q = (text ?? query).trim()
    if (!q) return
    setQuery(q)
    setLoading(true)
    try {
      const res = await api.expert({ query: q })
      setResult(res)
    } catch (err) {
      setResult({ query: q, matches: [], note: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={UsersIcon}
        title="AI Expert Finder"
        subtitle="Find the right contact based on document ownership and topic match — not a performance ranking."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          find()
        }}
        className="card mb-4 flex items-center gap-2 p-3"
      >
        <SearchIcon className="ml-2 h-5 w-5 text-slate-400" />
        <input
          className="input border-0 focus:ring-0"
          placeholder="What do you need help with? e.g. deployment pipeline"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : 'Find'}
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" onClick={() => find(ex)}>
            {ex}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-3">
          {result.matches.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No relevant contacts found"
              subtitle="Try a different topic such as 'deployment', 'architecture' or 'incidents'."
            />
          ) : (
            <>
              {result.matches.map((m, i) => (
                <div key={i} className="card flex items-start gap-4 p-5 animate-in">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {m.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-ink">{m.name}</h3>
                      <span className="text-sm text-slate-400">{m.contact}</span>
                    </div>
                    <p className="text-sm text-slate-500">{m.role}</p>
                    <p className="mt-2 text-sm text-slate-700">
                      <span className="font-medium text-brand-700">Why: </span>
                      {m.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.topics.slice(0, 5).map((t, j) => (
                        <Badge key={j} color="slate">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-400">{result.note}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
