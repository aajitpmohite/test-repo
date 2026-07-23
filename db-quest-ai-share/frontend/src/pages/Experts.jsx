import { useState } from 'react';
import { apiPost } from '../api';
import { PageHeader, Spinner, EmptyState } from '../components/ui';
import { ExpertIcon, LockIcon, ArrowRightIcon } from '../components/icons';

const examples = ['privacy', 'security', 'release', 'onboarding', 'responsible ai'];

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Experts() {
  const [query, setQuery] = useState('privacy');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function searchExperts(value) {
    const q = (value ?? query).trim();
    if (!q || loading) return;
    setQuery(q);
    setLoading(true);
    try {
      const response = await apiPost('/api/colleague/expert', { query: q });
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Expert Finder"
        subtitle="Discover who owns a topic so you know who to ask — matched by ownership and topic relevance, never by performance."
        icon={<ExpertIcon className="h-6 w-6" />}
      />

      <div className="card space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchExperts();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try privacy, security, release, onboarding…"
          />
          <button className="btn-primary shrink-0 sm:w-40" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <ExpertIcon className="h-4 w-4" />}
            {loading ? 'Searching…' : 'Find experts'}
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button key={ex} className="chip" onClick={() => searchExperts(ex)} disabled={loading}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        result.matches?.length ? (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-line bg-inset p-3 text-xs leading-relaxed text-faint">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {result.note}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {result.matches.map((match) => (
                <div key={match.name} className="card-interactive">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                      {initials(match.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-strong">{match.name}</h3>
                      <p className="text-sm text-muted">{match.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-body">
                    <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {match.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {match.topics.map((topic) => (
                      <span key={topic} className="badge">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <a href={`mailto:${match.contact}`} className="text-sm font-medium text-accent hover:text-accent">
                      {match.contact}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No topic owners matched"
            text="No one in the directory owns that topic. Try a broader term like privacy, security, or release."
            icon={<ExpertIcon className="h-6 w-6" />}
          />
        )
      ) : null}
    </div>
  );
}
