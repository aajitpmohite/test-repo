// Jira — Sprint Board (demo connector, read-only).
// An embedded Kanban view of the current sprint. Real deployments read issues via
// Jira Cloud REST/JQL; here it's clearly-labelled sample data. The Digital Colleague
// can answer questions like "what's blocking the payments release?" from this feed.
import { useMemo, useState } from 'react';
import { LayoutGrid, Filter } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { jiraColumns, jiraIssues } from '../lib/demoData';

const TYPE_META = {
  Story: { color: '#10b981', glyph: '▪' },
  Bug: { color: '#ef4444', glyph: '●' },
  Task: { color: '#2f5aa8', glyph: '◆' },
};
const PRIORITY_COLOR = { Highest: '#ef4444', High: '#f59e0b', Medium: '#2f5aa8', Low: '#64748b' };
const ASSIGNEES = {
  JL: '#b45309', AC: '#0f766e', MA: '#7c3aed', RS: '#2f5aa8', DP: '#be185d',
};

function IssueCard({ issue }) {
  const t = TYPE_META[issue.type] || TYPE_META.Task;
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm transition hover:border-brand-500/40 hover:shadow-card">
      <p className="text-sm leading-snug text-strong">{issue.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-muted">{issue.key}</span>
          <span className="text-[11px]" style={{ color: t.color }} title={issue.type}>{t.glyph} {issue.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: PRIORITY_COLOR[issue.priority], background: `${PRIORITY_COLOR[issue.priority]}18` }}>{issue.priority}</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: ASSIGNEES[issue.assignee] || '#64748b' }} title={`Assignee ${issue.assignee}`}>{issue.assignee}</span>
        </div>
      </div>
    </div>
  );
}

export default function Board() {
  const [typeFilter, setTypeFilter] = useState('all');

  const columns = useMemo(() => {
    const filtered = typeFilter === 'all' ? jiraIssues : jiraIssues.filter((i) => i.type === typeFilter);
    return jiraColumns.map((col) => ({ name: col, issues: filtered.filter((i) => i.status === col) }));
  }, [typeFilter]);

  const totalPoints = jiraIssues.reduce((s, i) => s + i.points, 0);
  const donePoints = jiraIssues.filter((i) => i.status === 'Done').reduce((s, i) => s + i.points, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jira · Sprint 24"
        title="Payments Sprint Board"
        subtitle="Embedded read-only board of the active sprint. The Colleague answers release-readiness questions from this feed."
        icon={<LayoutGrid className="h-6 w-6" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-accent">Demo connector</span>
          <span className="text-xs text-faint">Sample Jira data · {donePoints}/{totalPoints} points done</span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <select className="select w-auto py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by issue type">
            <option value="all">All types</option>
            <option value="Story">Stories</option>
            <option value="Bug">Bugs</option>
            <option value="Task">Tasks</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div key={col.name} className="rounded-2xl border border-line bg-inset p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{col.name}</p>
              <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] font-semibold text-muted">{col.issues.length}</span>
            </div>
            <div className="space-y-2.5">
              {col.issues.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-faint">No issues</p>
              ) : (
                col.issues.map((issue) => <IssueCard key={issue.key} issue={issue} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
