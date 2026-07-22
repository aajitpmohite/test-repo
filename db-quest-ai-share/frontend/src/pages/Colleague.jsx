import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { ChatIcon, DocIcon, SendIcon, SparkIcon } from '../components/icons'
import { ConfidenceBadge, PageHeader, RichText, Spinner } from '../components/ui'

const EXAMPLES = [
  'What is the process for production deployment?',
  'Who should I contact for access issues?',
  'Explain this project to a new joiner.',
  'What are the top risks in this project?',
  'What changed recently in this project?',
]

export default function Colleague() {
  const [entries, setEntries] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, busy])

  async function ask(text) {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    setEntries((e) => [...e, { role: 'user', content: q }])
    setBusy(true)
    try {
      const res = await api.ask({ question: q })
      setEntries((e) => [
        ...e,
        { role: 'assistant', content: res.answer, sources: res.sources, confidence: res.confidence },
      ])
    } catch (err) {
      setEntries((e) => [...e, { role: 'assistant', content: `Error: ${err.message}`, sources: [] }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={ChatIcon}
        title="Ask Digital Colleague"
        subtitle="Ask anything about your project, process or systems. Answers are grounded in your team documents and cite their sources."
      />

      <div className="card flex h-[calc(100vh-16rem)] min-h-[460px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {entries.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <SparkIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium text-slate-500">Ask me about your team's knowledge</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} className="chip" onClick={() => ask(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {entries.map((e, i) => (
            <div key={i} className={`flex ${e.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {e.role === 'user' ? (
                <div className="max-w-[80%] rounded-2xl bg-brand-600 px-4 py-2.5 text-sm text-white">
                  {e.content}
                </div>
              ) : (
                <div className="max-w-[85%] space-y-3">
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    <RichText text={e.content} />
                    {e.confidence && (
                      <div className="mt-2">
                        <ConfidenceBadge level={e.confidence} />
                      </div>
                    )}
                  </div>
                  {e.sources?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Sources
                      </p>
                      {e.sources.map((s, j) => (
                        <div key={j} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5">
                          <DocIcon className="mt-0.5 h-4 w-4 flex-none text-brand-500" />
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{s.title}</p>
                            <p className="text-xs text-slate-400">{s.snippet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-400">
                <Spinner className="h-4 w-4" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t border-slate-100 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}
        >
          <input
            className="input"
            placeholder="Ask about deployment, onboarding, risks, contacts…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4" disabled={busy}>
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
