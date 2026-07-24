// Confluence — Knowledge connector (demo).
// Browse sample spaces/pages, then wire them into the REAL product: import a page into
// the team knowledge base (so the Digital Colleague cites it), or turn a policy page
// into a compliance escape mission. Real deployments read pages via the Confluence
// Cloud REST API with OAuth + permission-aware retrieval.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, GraduationCap, Check, X, BookText, Sparkles } from 'lucide-react';
import { apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Spinner } from '../components/ui';
import { confluenceSpaces, confluencePages } from '../lib/demoData';

const spaceColor = (key) => confluenceSpaces.find((s) => s.key === key)?.color || '#2f5aa8';
const spaceName = (key) => confluenceSpaces.find((s) => s.key === key)?.name || key;

export default function Confluence() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [spaceFilter, setSpaceFilter] = useState('all');
  const [busy, setBusy] = useState(null);
  const [imported, setImported] = useState(() => new Set());
  const [preview, setPreview] = useState(null);

  const pages = useMemo(
    () => (spaceFilter === 'all' ? confluencePages : confluencePages.filter((p) => p.space === spaceFilter)),
    [spaceFilter],
  );

  async function importPage(page) {
    setBusy(`${page.id}:imp`);
    try {
      await apiPost('/api/documents/paste', { title: page.title, text: page.content, source: 'confluence' });
      setImported((prev) => new Set(prev).add(page.id));
      toast.success(`Imported “${page.title}” — the Colleague can now cite it.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function generateMission(page) {
    setBusy(`${page.id}:gen`);
    try {
      const m = await apiPost('/api/missions/generate', {
        topic: page.topic, difficulty: 'Intermediate', audience: 'team member', policy: page.content,
      });
      toast.success(`Mission created from “${page.title}”.`);
      navigate(`/missions/play/${m.id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  const isPolicy = (p) => p.labels.includes('policy') || p.labels.includes('process');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Confluence"
        title="Knowledge connector"
        subtitle="Ground the Digital Colleague in your living documentation — import pages into the knowledge base or turn a policy into training."
        icon={<BookText className="h-6 w-6" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-accent">Demo connector</span>
          <span className="text-xs text-faint">Sample spaces · a real deployment reads pages via the Confluence Cloud API.</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSpaceFilter('all')} className={`chip ${spaceFilter === 'all' ? 'ring-1 ring-brand-500/50' : ''}`}>All spaces</button>
          {confluenceSpaces.map((s) => (
            <button key={s.key} onClick={() => setSpaceFilter(s.key)}
              className={`chip ${spaceFilter === s.key ? 'ring-1 ring-brand-500/50' : ''}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.key}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-line bg-inset p-3 text-xs text-muted">
          Importing pages and generating missions are admin actions. You can still browse the spaces below.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => {
          const done = imported.has(page.id);
          return (
            <div key={page.id} className="card flex flex-col">
              <div className="flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: spaceColor(page.space) }}>{page.space}</span>
                <span className="text-xs text-faint">{spaceName(page.space)}</span>
                <span className="ml-auto text-xs text-faint">Updated {page.updated}</span>
              </div>
              <button onClick={() => setPreview(page)} className="mt-2 text-left">
                <h3 className="flex items-center gap-2 font-semibold text-strong hover:text-accent">
                  <FileText className="h-4 w-4 shrink-0 text-muted" /> {page.title}
                </h3>
              </button>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{page.excerpt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {page.labels.map((l) => <span key={l} className="badge">{l}</span>)}
                <span className="ml-auto text-xs text-faint">by {page.author}</span>
              </div>
              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <button onClick={() => importPage(page)} disabled={busy === `${page.id}:imp` || done}
                    className="btn-outline btn-sm">
                    {busy === `${page.id}:imp` ? <Spinner className="h-4 w-4" /> : done ? <Check className="h-4 w-4 text-emerald-500" /> : <Download className="h-4 w-4" />}
                    {done ? 'Imported' : 'Import to KB'}
                  </button>
                  {isPolicy(page) && (
                    <button onClick={() => generateMission(page)} disabled={busy === `${page.id}:gen`}
                      className="btn-gold btn-sm">
                      {busy === `${page.id}:gen` ? <Spinner className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                      Generate mission
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Page preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: spaceColor(preview.space) }}>{preview.space}</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Confluence</p>
              <button onClick={() => setPreview(null)} className="ml-auto text-muted hover:text-strong" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <h3 className="text-lg font-bold text-strong">{preview.title}</h3>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-body">{preview.content}</pre>
            {isAdmin && isPolicy(preview) && (
              <button onClick={() => { const p = preview; setPreview(null); generateMission(p); }} className="btn-gold btn-sm mt-4">
                <Sparkles className="h-4 w-4" /> Turn this into a mission
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
