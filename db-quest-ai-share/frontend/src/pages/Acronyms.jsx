import { useState } from 'react'
import { api } from '../api'
import { BookIcon, SearchIcon } from '../components/icons'
import { Badge, EmptyState, PageHeader, Spinner } from '../components/ui'

const COMMON = ['UBR', 'SFT', 'TLA', 'IRT', 'UAT', 'ETL', 'KYC', 'AML', 'RTB', 'CTB', 'SOC', 'DPO']

export default function Acronyms() {
  const [term, setTerm] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function lookup(text) {
    const t = (text ?? term).trim()
    if (!t) return
    setTerm(t)
    setLoading(true)
    try {
      const res = await api.acronym({ term: t })
      setResult(res)
    } catch (err) {
      setResult({ term: t, matched: false, explanation: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={BookIcon}
        title="AI Acronym Explainer"
        subtitle="Decode the bank's endless acronyms — with plain-language meaning and project context."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          lookup()
        }}
        className="card mb-4 flex items-center gap-2 p-3"
      >
        <SearchIcon className="ml-2 h-5 w-5 text-slate-400" />
        <input
          className="input border-0 focus:ring-0"
          placeholder="Enter an acronym, e.g. UBR"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : 'Explain'}
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {COMMON.map((c) => (
          <button key={c} className="chip" onClick={() => lookup(c)}>
            {c}
          </button>
        ))}
      </div>

      {result &&
        (result.matched ? (
          <div className="card animate-in p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-bold text-brand-700">{result.term}</h2>
              <span className="text-lg text-slate-500">{result.expansion}</span>
            </div>
            <p className="mt-3 text-slate-700">{result.explanation}</p>
            {result.context && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Context: </span>
                {result.context}
              </div>
            )}
            {result.related?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Related
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.related.map((r, i) => (
                    <Badge key={i} color="blue">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={BookIcon} title={`"${result.term}" not in the glossary yet`} subtitle={result.explanation} />
        ))}
    </div>
  )
}
