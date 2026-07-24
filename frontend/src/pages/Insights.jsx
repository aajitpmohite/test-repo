// Team Insights (admin only) — anonymized analytics.
// Shows ONLY aggregated, anonymized training stats: KPI tiles, grade distribution,
// per-mission performance, and the team's weakest training steps ("risk gaps").
// There are deliberately no individual names, scores, or rankings here.
import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import { PageHeader, EmptyState, Spinner } from '../components/ui';
import { ChartIcon, TrophyIcon, UsersIcon, BoltIcon, LockIcon, CheckIcon } from '../components/icons';

// Status palette (reserved good/warning/critical) — always paired with a text label.
const C = { good: '#10b981', navy: '#2f5aa8', warn: '#f59e0b', bad: '#ef4444', gold: '#c8a24a' };

// Grades are ordinal — rank + colour by performance (best → worst).
const GRADE_META = {
  'Risk Champion': { rank: 4, color: C.good },
  'Solid Awareness': { rank: 3, color: C.navy },
  Developing: { rank: 2, color: C.warn },
  'Needs Practice': { rank: 1, color: C.bad },
};
const rateColor = (r) => (r >= 0.75 ? C.good : r >= 0.5 ? C.warn : C.bad);

function Kpi({ label, value, hint, icon }) {
  return (
    <div className="kpi">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className="text-gold-accent">{icon}</span>
      </div>
      <p className="kpi-figure mt-2">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

// One horizontal bar: label · track · value. Identity comes from the label, never colour alone.
function BarRow({ label, sublabel, pct, valueLabel, color, title }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-3" title={title}>
      <div className="w-44 shrink-0">
        <p className="truncate text-sm text-body">{label}</p>
        {sublabel && <p className="truncate text-xs text-faint">{sublabel}</p>}
      </div>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${width}%`, background: color }} />
      </div>
      <div className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-strong">{valueLabel}</div>
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-semibold text-strong">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/insights').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Could not load insights" text={error} icon={<ChartIcon className="h-6 w-6" />} />;
  if (!data) return <div className="flex items-center justify-center gap-3 py-24 text-muted"><Spinner /> Loading insights…</div>;

  const hasData = data.totalAttempts > 0;
  const activeMissions = (data.missions || []).filter((m) => m.attempts > 0);

  // Derived KPI: average completion across missions that have any attempts.
  const avgCompletion = activeMissions.length
    ? Math.round((activeMissions.reduce((s, m) => s + (m.completionRate || 0), 0) / activeMissions.length) * 100)
    : 0;

  const grades = Object.entries(data.gradeDistribution || {})
    .map(([grade, count]) => ({ grade, count, ...(GRADE_META[grade] || { rank: 0, color: C.navy }) }))
    .sort((a, b) => b.rank - a.rank);
  const gradeTotal = grades.reduce((s, g) => s + g.count, 0) || 1;

  const maxScore = Math.max(1, ...activeMissions.map((m) => m.averageScore || 0));

  // Weakest steps across all missions — the team's biggest training gaps (lowest first-try rate).
  const gaps = activeMissions
    .flatMap((m) => (m.steps || []).map((s) => ({ ...s, mission: m.title })))
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Escape Missions"
        title="Team Insights"
        subtitle="Aggregated, anonymized training analytics for your team. No individual scores or rankings — ever."
        icon={<ChartIcon className="h-6 w-6" />}
      />

      <div className="flex items-start gap-2 rounded-xl border border-line bg-inset p-3 text-xs leading-relaxed text-muted">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0" /> {data.note}
      </div>

      {!hasData ? (
        <EmptyState
          title="No mission attempts yet"
          text="Once your team plays missions, you’ll see aggregated trends here — like which red flags people miss most."
          icon={<TrophyIcon className="h-6 w-6" />}
        />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Total attempts" value={data.totalAttempts} icon={<BoltIcon className="h-5 w-5" />} />
            <Kpi label="Active members" value={data.activeMembers} hint="played ≥ 1 mission" icon={<UsersIcon className="h-5 w-5" />} />
            <Kpi label="Average score" value={data.averageScore} hint="out of 100" icon={<TrophyIcon className="h-5 w-5" />} />
            <Kpi label="Avg completion" value={`${avgCompletion}%`} hint="across live missions" icon={<CheckIcon className="h-5 w-5" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Grade distribution */}
            {grades.length > 0 && (
              <Section title="Grade distribution" subtitle={`${gradeTotal} graded ${gradeTotal === 1 ? 'run' : 'runs'}`}>
                <div className="space-y-3">
                  {grades.map((g) => (
                    <BarRow
                      key={g.grade}
                      label={g.grade}
                      pct={(g.count / gradeTotal) * 100}
                      valueLabel={g.count}
                      color={g.color}
                      title={`${g.grade}: ${g.count} (${Math.round((g.count / gradeTotal) * 100)}%)`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
                  {grades.map((g) => (
                    <span key={g.grade} className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} /> {g.grade}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Mission average score */}
            <Section title="Average score by mission" subtitle="Out of 100, per active mission">
              <div className="space-y-3">
                {activeMissions.map((m) => (
                  <BarRow
                    key={m.missionSlug}
                    label={m.title}
                    sublabel={`${m.attempts} ${m.attempts === 1 ? 'attempt' : 'attempts'}`}
                    pct={(m.averageScore / maxScore) * 100}
                    valueLabel={m.averageScore}
                    color={C.navy}
                    title={`${m.title}: avg ${m.averageScore}/100`}
                  />
                ))}
              </div>
            </Section>
          </div>

          {/* Training gaps — lowest first-try correct rates */}
          {gaps.length > 0 && (
            <Section
              title="Biggest training gaps"
              subtitle="Steps the team gets wrong most on the first try — where to focus coaching"
              right={
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.bad }} /> &lt;50%</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.warn }} /> 50–75%</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.good }} /> &gt;75%</span>
                </div>
              }
            >
              <div className="space-y-3">
                {gaps.map((s, i) => (
                  <BarRow
                    key={`${s.mission}-${s.stepId}-${i}`}
                    label={s.prompt}
                    sublabel={s.mission}
                    pct={s.correctRate * 100}
                    valueLabel={`${Math.round(s.correctRate * 100)}%`}
                    color={rateColor(s.correctRate)}
                    title={`${s.prompt} — ${Math.round(s.correctRate * 100)}% correct first try`}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Per-mission completion */}
          <Section title="Completion across the team" subtitle="Share of team members who have played each mission">
            <div className="space-y-3">
              {activeMissions.map((m) => (
                <BarRow
                  key={m.missionSlug}
                  label={m.title}
                  pct={(m.completionRate || 0) * 100}
                  valueLabel={`${Math.round((m.completionRate || 0) * 100)}%`}
                  color={rateColor(m.completionRate || 0)}
                  title={`${m.title} — ${Math.round((m.completionRate || 0) * 100)}% completion`}
                />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
