// ServiceNow — Open Incidents (demo connector).
// Surfaces live open incidents, an AI triage summary, and links each incident to the
// right runbook (Confluence) + a targeted training refresher — the "know → act → train"
// loop that ties the platform together. Uses clearly-labelled demo data.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Users, BookOpen, GraduationCap, Activity, X, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { incidents, PRIORITY_META, pageById } from '../lib/demoData';

function DemoBadge() {
  return <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-accent">Demo connector</span>;
}

function Kpi({ label, value, tone }) {
  const color = tone === 'bad' ? 'text-rose-500' : tone === 'warn' ? 'text-amber-500' : 'text-strong';
  return (
    <div className="kpi">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`kpi-figure mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function SlaBar({ mins }) {
  const pct = Math.max(4, Math.min(100, (mins / 240) * 100));
  const color = mins <= 30 ? '#ef4444' : mins <= 90 ? '#f59e0b' : '#10b981';
  const label = mins <= 30 ? 'Breaching soon' : `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted"><Clock className="h-3 w-3" /> SLA</span>
        <span style={{ color }} className="font-semibold">{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Incidents() {
  const navigate = useNavigate();
  const [runbook, setRunbook] = useState(null);

  const stats = useMemo(() => ({
    open: incidents.length,
    p1: incidents.filter((i) => i.priority === 'P1').length,
    breaching: incidents.filter((i) => i.slaMinsLeft <= 30).length,
  }), []);

  // Client-side "AI triage" summary derived from the incident set.
  const summary = useMemo(() => {
    const p1 = incidents.find((i) => i.priority === 'P1');
    const topics = [...new Set(incidents.map((i) => i.category))];
    return `${stats.open} incidents open across ${new Set(incidents.map((i) => i.group)).size} groups. ${
      p1 ? `1 P1 — “${p1.short}” — breaching SLA in ${p1.slaMinsLeft}m. ` : ''
    }Themes: ${topics.join(', ')}. Recommend runbook links and targeted refreshers for the affected teams.`;
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ServiceNow"
        title="Open Incidents"
        subtitle="Live incident feed with AI triage — each incident links to its runbook and a targeted team refresher."
        icon={<Activity className="h-6 w-6" />}
      />

      <div className="flex items-center gap-2"><DemoBadge /><span className="text-xs text-faint">Sample ITSM data — a real deployment reads open incidents via the ServiceNow Table API.</span></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Open incidents" value={stats.open} />
        <Kpi label="P1 · Critical" value={stats.p1} tone={stats.p1 ? 'bad' : 'good'} />
        <Kpi label="Breaching SLA" value={stats.breaching} tone={stats.breaching ? 'warn' : 'good'} />
      </div>

      {/* AI triage banner */}
      <div className="card border-brand-500/30 bg-brand-500/[0.05]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-accent"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">AI triage summary</p>
            <p className="mt-1 text-sm leading-relaxed text-body">{summary}</p>
          </div>
        </div>
      </div>

      {/* Incident list */}
      <div className="space-y-3">
        {incidents.map((inc) => {
          const meta = PRIORITY_META[inc.priority];
          const rb = pageById(inc.runbookId);
          return (
            <div key={inc.number} className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: meta.color }}>{meta.label}</span>
                    <span className="font-mono text-xs text-muted">{inc.number}</span>
                    <span className="badge">{inc.state}</span>
                  </div>
                  <p className="mt-1.5 font-semibold text-strong">{inc.short}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {inc.group}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> opened {inc.opened}</span>
                    <span>{inc.category}</span>
                  </div>
                </div>
                <div className="w-full md:w-48"><SlaBar mins={inc.slaMinsLeft} /></div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {rb && (
                    <button onClick={() => setRunbook(rb)} className="btn-outline btn-sm">
                      <BookOpen className="h-4 w-4" /> Runbook
                    </button>
                  )}
                  <button onClick={() => navigate('/missions/generate')} className="btn-gold btn-sm">
                    <GraduationCap className="h-4 w-4" /> Train the team
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Runbook modal (from Confluence) */}
      {runbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRunbook(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Confluence · {runbook.space}</p>
              <button onClick={() => setRunbook(null)} className="ml-auto text-muted hover:text-strong" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <h3 className="text-lg font-bold text-strong">{runbook.title}</h3>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-body">{runbook.content}</pre>
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-faint">
              <AlertTriangle className="h-3.5 w-3.5" /> Pulled from the linked runbook — in production this deep-links to the Confluence page.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
