import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { DocIcon, SparkIcon, UploadIcon } from '../components/icons'
import { Badge, EmptyState, PageHeader, Spinner } from '../components/ui'

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [summary, setSummary] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteText, setPasteText] = useState('')
  const fileRef = useRef(null)

  const refresh = () => api.listDocuments().then(setDocs).catch((e) => setError(e.message))
  useEffect(() => {
    refresh()
  }, [])

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      await api.uploadDocument(form)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onPaste(e) {
    e.preventDefault()
    if (!pasteText.trim()) return
    setUploading(true)
    try {
      await api.pasteDocument({ title: pasteTitle || 'Pasted document', text: pasteText })
      setPasteTitle('')
      setPasteText('')
      setPasteMode(false)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function summarize(doc) {
    setActiveId(doc.id)
    setLoading(true)
    setSummary(null)
    try {
      const res = await api.summarize({ documentId: doc.id })
      setSummary(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={DocIcon}
        title="Knowledge Documents"
        subtitle="Upload team documents to power the Digital Colleague, then summarise any of them with AI."
      >
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setPasteMode((v) => !v)}>
            Paste text
          </button>
          <label className="btn-primary cursor-pointer">
            {uploading ? <Spinner className="h-4 w-4" /> : <UploadIcon className="h-4 w-4" />}
            Upload
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv"
              className="hidden"
              onChange={onUpload}
            />
          </label>
        </div>
      </PageHeader>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {pasteMode && (
        <form onSubmit={onPaste} className="card mb-5 space-y-3 p-5">
          <input
            className="input"
            placeholder="Document title"
            value={pasteTitle}
            onChange={(e) => setPasteTitle(e.target.value)}
          />
          <textarea
            className="textarea"
            rows={6}
            placeholder="Paste document text here…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button className="btn-primary" disabled={uploading || !pasteText.trim()}>
            Add document
          </button>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Loaded documents ({docs.length})
          </h2>
          {docs.length === 0 ? (
            <EmptyState icon={DocIcon} title="No documents yet" subtitle="Upload or paste one to begin." />
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => summarize(d)}
                  className={`card flex w-full items-center gap-3 p-4 text-left transition hover:border-brand-300 ${
                    activeId === d.id ? 'border-brand-400 ring-2 ring-brand-100' : ''
                  }`}
                >
                  <DocIcon className="h-5 w-5 flex-none text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{d.title}</p>
                    <p className="text-xs text-slate-400">
                      {d.chunks} chunks · {d.chars.toLocaleString()} chars
                    </p>
                  </div>
                  <Badge color="blue">
                    <SparkIcon className="h-3 w-3" /> Summarise
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {loading && (
            <div className="card flex h-64 items-center justify-center text-brand-600">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          {!loading && !summary && (
            <div className="card flex h-64 flex-col items-center justify-center text-center text-slate-400">
              <SparkIcon className="h-10 w-10" />
              <p className="mt-3 font-medium text-slate-500">Select a document to summarise</p>
            </div>
          )}
          {summary && !loading && (
            <div className="card animate-in space-y-4 p-6">
              <h2 className="text-xl font-bold text-ink">{summary.title}</h2>
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{summary.summary}</p>
              <SummarySection title="Key points" items={summary.keyPoints} color="bg-brand-500" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SummarySection title="Decisions" items={summary.decisions} color="bg-emerald-500" />
                <SummarySection title="Action items" items={summary.actionItems} color="bg-amber-500" />
                <SummarySection title="Risks" items={summary.risks} color="bg-rose-500" />
                <SummarySection title="People mentioned" items={summary.peopleMentioned} color="bg-violet-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummarySection({ title, items, color }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-600">{title}</h3>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${color}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
