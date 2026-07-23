import { useState } from 'react';
import { apiPost } from '../api';
import { PageHeader, Spinner, EmptyState } from '../components/ui';
import { AcronymIcon, SparkIcon, AlertIcon } from '../components/icons';

const commonTerms = ['UBR', 'SFT', 'KYC', 'AML', 'SLA', 'ETL', 'UAT', 'BAU'];

export default function Acronyms() {
  const [term, setTerm] = useState('SFT');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function lookup(value) {
    const t = (value ?? term).trim().toUpperCase();
    if (!t || loading) return;
    setTerm(t);
    setLoading(true);
    try {
      const response = await apiPost('/api/colleague/acronym', { term: t });
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Acronym Explorer"
        subtitle="Decode the business and compliance acronyms that fly around in meetings and tickets."
        icon={<AcronymIcon className="h-6 w-6" />}
      />

      <div className="card space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            className="input font-semibold uppercase tracking-wide"
            value={term}
            onChange={(e) => setTerm(e.target.value.toUpperCase())}
            placeholder="Enter an acronym…"
          />
          <button className="btn-primary shrink-0 sm:w-40" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <AcronymIcon className="h-4 w-4" />}
            {loading ? 'Looking up…' : 'Look up'}
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {commonTerms.map((item) => (
            <button key={item} className="chip" onClick={() => lookup(item)} disabled={loading}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        result.matched ? (
          <div className="card animate-fade-in space-y-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="text-3xl font-extrabold text-strong">{result.term}</h3>
              <p className="text-lg font-medium text-accent">{result.expansion}</p>
            </div>
            <div className="divider" />
            <p className="text-[15px] leading-8 text-body">{result.explanation}</p>
            <div className="surface-inset">
              <p className="text-xs font-semibold uppercase tracking-wider text-faint">Context</p>
              <p className="mt-1.5 text-sm leading-relaxed text-body">{result.context}</p>
            </div>
            {result.related?.length ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                  <SparkIcon className="h-4 w-4" /> Related terms
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.related.map((item) => (
                    <button key={item} className="chip" onClick={() => lookup(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title={`No match for “${result.term}”`}
            text="That term isn't in the seeded glossary. Try one of the common acronyms above."
            icon={<AlertIcon className="h-6 w-6" />}
          />
        )
      ) : null}
    </div>
  );
}
