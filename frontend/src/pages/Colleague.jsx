// Digital Colleague Q&A. Answers are grounded in the CURRENT team's documents.
// Sources are shown prominently and are expandable; a clear "not found" state appears
// when nothing relevant exists in the team's knowledge base.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfidenceBadge, PageHeader, Spinner, EmptyState } from '../components/ui';
import { ColleagueIcon, SendIcon, DocumentIcon, SparkIcon, AlertIcon, ArrowRightIcon } from '../components/icons';

const examples = [
  'How should I onboard a new teammate?',
  'What is the release checklist?',
  'Where do I find the support guide?',
  'What does the architecture look like?',
];

export default function Colleague() {
  const { activeTeam } = useAuth();
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSource, setOpenSource] = useState(null);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setQuestion(text);
    setLoading(true);
    setOpenSource(null);
    try {
      setAnswer(await apiPost('/api/colleague/ask', { question: text }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const notFound = answer && (!answer.sources || answer.sources.length === 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Ask about projects & processes"
        subtitle={`Answers are grounded in ${activeTeam?.name || 'your team'}'s documents, with clickable sources and a confidence signal.`}
        icon={<ColleagueIcon className="h-6 w-6" />}
      />

      <div className="card space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="space-y-3">
          <textarea className="textarea" rows="3" value={question} aria-label="Your question"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
            placeholder="Ask about onboarding, support, architecture, or release guidance…" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {examples.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => ask(ex)} disabled={loading}>{ex}</button>
              ))}
            </div>
            <button type="submit" className="btn-primary shrink-0" disabled={loading || !question.trim()}>
              {loading ? <Spinner className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
              {loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      {answer ? (
        notFound ? (
          <div className="card animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-300"><AlertIcon className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-strong">Not found in your team’s documents</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  I couldn’t find this in {activeTeam?.name || 'your team'}’s knowledge base. Try rephrasing, or add the
                  relevant document so I can answer it next time.
                </p>
                <Link to="/documents" className="btn-outline mt-3"><DocumentIcon className="h-4 w-4" /> Go to Documents <ArrowRightIcon className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card animate-fade-in space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-accent"><SparkIcon className="h-5 w-5" /></div>
              <h3 className="text-lg font-semibold text-strong">Answer</h3>
              <ConfidenceBadge confidence={answer.confidence} />
            </div>
            <p className="text-[15px] leading-8 text-body">{answer.answer}</p>

            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                <DocumentIcon className="h-4 w-4" /> Sources · click to expand
              </p>
              <div className="space-y-2">
                {answer.sources.map((source, i) => {
                  const open = openSource === i;
                  return (
                    <button key={`${source.documentId}-${i}`} onClick={() => setOpenSource(open ? null : i)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${open ? 'border-brand-500/50 bg-brand-500/[0.06]' : 'border-line bg-inset hover:border-brand-500/30'}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-500/20 text-[10px] font-bold text-accent">{i + 1}</span>
                        <span className="font-semibold text-strong">{source.title}</span>
                        <ArrowRightIcon className={`ml-auto h-4 w-4 text-muted transition ${open ? 'rotate-90' : ''}`} />
                      </div>
                      {open && <p className="mt-2 text-sm leading-relaxed text-muted">{source.snippet}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : (
        <EmptyState
          title="Ask your first question"
          text="Pick an example above or type your own. The Colleague only answers from your team’s documents and flags what it doesn’t know."
          icon={<ColleagueIcon className="h-6 w-6" />}
        />
      )}
    </div>
  );
}
