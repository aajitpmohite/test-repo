// Team knowledge base. Admins add documents (which are chunked + indexed for search);
// everyone can browse and summarise. Clearly communicates that docs are shared with the
// whole team and power the Colleague's answers.
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiUpload } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Spinner, EmptyState, Skeleton } from '../components/ui';
import { DocumentIcon, UploadIcon, SparkIcon, CheckIcon, BoltIcon, AlertIcon, ExpertIcon, LockIcon, InfoIcon } from '../components/icons';

const sourceLabels = { seed: 'Sample', upload: 'Uploaded', paste: 'Pasted' };

export default function Documents() {
  const { isAdmin, activeTeam } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [documents, setDocuments] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [docQuery, setDocQuery] = useState('');
  const [sourceF, setSourceF] = useState('all');

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    const q = docQuery.trim().toLowerCase();
    return documents.filter((d) => {
      if (sourceF !== 'all' && d.source !== sourceF) return false;
      if (q && !d.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, docQuery, sourceF]);

  async function loadDocuments() {
    try {
      setDocuments(await apiGet('/api/documents'));
    } catch (e) {
      toast.error(e.message);
      setDocuments([]);
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const doc = await apiUpload('/api/documents/upload', form);
      toast.success(`Indexed “${doc.title}” into ${doc.chunkCount} searchable chunks.`);
      await loadDocuments();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  async function pasteDocument(e) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setBusy(true);
    try {
      const doc = await apiPost('/api/documents/paste', { title, text });
      toast.success(`Saved & indexed “${doc.title}” (${doc.chunkCount} chunks).`);
      setTitle('');
      setText('');
      await loadDocuments();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function summarize(documentId) {
    setActiveId(documentId);
    setSummarizing(true);
    try {
      setSummary(await apiPost('/api/documents/summarize', { documentId }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSummarizing(false);
    }
  }

  const sections = summary
    ? [
        { key: 'keyPoints', title: 'Key points', icon: CheckIcon, color: 'text-accent', items: summary.keyPoints },
        { key: 'decisions', title: 'Decisions', icon: SparkIcon, color: 'text-emerald-600 dark:text-emerald-300', items: summary.decisions },
        { key: 'actionItems', title: 'Action items', icon: BoltIcon, color: 'text-sky-600 dark:text-sky-300', items: summary.actionItems },
        { key: 'risks', title: 'Risks', icon: AlertIcon, color: 'text-amber-600 dark:text-amber-300', items: summary.risks },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Team knowledge base"
        subtitle="Documents here are shared with your whole team and power the Colleague's cited answers."
        icon={<DocumentIcon className="h-6 w-6" />}
      />

      <div className="flex items-start gap-2 rounded-xl border border-line bg-inset p-3 text-xs leading-relaxed text-muted">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <span>
          Supported: <b className="text-body">.txt, .md, .csv, .pdf</b>. Each document is split into searchable chunks and
          cited in answers on the <b className="text-body">Ask</b> page. Everything is scoped to{' '}
          <b className="text-body">{activeTeam?.name || 'your team'}</b>.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left: add (admin) + library */}
        <div className="space-y-4">
          {isAdmin ? (
            <form onSubmit={pasteDocument} className="card space-y-3">
              <p className="font-semibold text-strong">Add a document</p>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" aria-label="Document title" />
              <textarea className="textarea" rows="4" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste document content here…" aria-label="Document content" />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" disabled={busy || !title.trim() || !text.trim()}>
                  {busy ? <Spinner className="h-4 w-4" /> : null} Add &amp; index
                </button>
                <label className="btn-outline cursor-pointer">
                  <UploadIcon className="h-4 w-4" /> Upload file
                  <input type="file" accept=".txt,.md,.csv,.pdf" className="hidden" onChange={uploadFile} disabled={busy} />
                </label>
              </div>
            </form>
          ) : (
            <div className="card flex items-start gap-3">
              <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-strong">Only admins can add documents</p>
                <p className="mt-1 text-sm text-muted">You can browse and summarise your team’s documents below. Ask an admin to upload new guides.</p>
              </div>
            </div>
          )}

          <div className="card">
            <p className="mb-3 font-semibold text-strong">Indexed documents {documents ? `(${documents.length})` : ''}</p>
            {documents !== null && documents.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  className="input flex-1 py-2 text-sm"
                  value={docQuery}
                  onChange={(e) => setDocQuery(e.target.value)}
                  placeholder="Search documents…"
                  aria-label="Search documents"
                />
                <select className="select w-auto py-2 text-sm" value={sourceF} onChange={(e) => setSourceF(e.target.value)} aria-label="Filter by source">
                  <option value="all">All sources</option>
                  <option value="seed">Sample</option>
                  <option value="upload">Uploaded</option>
                  <option value="paste">Pasted</option>
                </select>
              </div>
            )}
            {documents === null ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : documents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No documents yet — {isAdmin ? 'add your team’s guides to power answers.' : 'ask an admin to add some.'}
              </p>
            ) : filteredDocs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No documents match your search.</p>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <button key={doc.id} onClick={() => summarize(doc.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                      activeId === doc.id ? 'border-brand-500/50 bg-brand-500/10' : 'border-line bg-inset hover:border-brand-500/30'
                    }`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-muted">
                      <DocumentIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-strong">{doc.title}</p>
                      <p className="text-xs text-faint">{sourceLabels[doc.source] || doc.source} · {doc.chunkCount} chunks</p>
                    </div>
                    <span className="chip shrink-0">Summarise</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div>
          {summarizing ? (
            <div className="card flex items-center justify-center gap-3 py-24 text-muted"><Spinner /> Summarising…</div>
          ) : summary ? (
            <div className="card animate-fade-in space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-accent"><SparkIcon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Summary</p>
                  <h3 className="text-lg font-semibold text-strong">{summary.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-7 text-body">{summary.summary}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.key} className="surface-inset">
                      <p className={`flex items-center gap-2 text-sm font-semibold ${section.color}`}><Icon className="h-4 w-4" /> {section.title}</p>
                      {section.items?.length ? (
                        <ul className="mt-2 space-y-1.5 text-sm text-muted">{section.items.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                      ) : <p className="mt-2 text-sm text-faint">None identified.</p>}
                    </div>
                  );
                })}
              </div>
              {summary.peopleMentioned?.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint"><ExpertIcon className="h-4 w-4" /> People mentioned</p>
                  <div className="flex flex-wrap gap-1.5">{summary.peopleMentioned.map((p) => <span key={p} className="badge">{p}</span>)}</div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Select a document" text="Choose any document to generate a structured summary with key points, decisions, actions, and risks." icon={<DocumentIcon className="h-6 w-6" />} />
          )}
        </div>
      </div>
    </div>
  );
}
