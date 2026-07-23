// Team Insights (admin only). Shows ONLY anonymized, aggregated training stats.
// There are deliberately no individual names, scores, or rankings here.
import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import { PageHeader, StatCard, EmptyState, Spinner } from '../components/ui';
import { ChartIcon, TrophyIcon, UsersIcon, BoltIcon, LockIcon } from '../components/icons';

function Meter({ value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-strong">{pct}%</span>
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Escape Missions"
        title="Team Insights"
        subtitle="Aggregated, anonymized training results for your team. No individual scores or rankings — ever."
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total attempts" value={data.totalAttempts} icon={<BoltIcon className="h-5 w-5" />} />
            <StatCard label="Active members" value={data.activeMembers} icon={<UsersIcon className="h-5 w-5" />} />
            <StatCard label="Average score" value={`${data.averageScore}`} hint="out of 100" icon={<TrophyIcon className="h-5 w-5" />} />
          </div>

          {Object.keys(data.gradeDistribution || {}).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-strong">Grade distribution</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(data.gradeDistribution).map(([grade, count]) => (
                  <span key={grade} className="badge">{grade}: <b className="ml-1 text-strong">{count}</b></span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-faint">Per-mission breakdown</h3>
            {data.missions.filter((m) => m.attempts > 0).map((m) => (
              <div key={m.missionSlug} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-strong">{m.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{m.attempts} attempts</span>
                    <span className="badge">avg {m.averageScore}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted">Completion across team</p>
                  <Meter value={m.completionRate} />
                </div>
                {m.steps.length > 0 && (
                  <div className="mt-4 space-y-2.5 border-t border-line pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-faint">Got it right first try</p>
                    {m.steps.map((s) => (
                      <div key={s.stepId}>
                        <p className="mb-1 text-sm text-body">{s.prompt}</p>
                        <Meter value={s.correctRate} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
