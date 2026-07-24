// Digital Colleague — a conversational assistant grounded in the CURRENT team's
// documents. Multi-turn chat with context, per-answer sources + confidence, copy,
// voice input (mic) and read-aloud (speech), and follow-up suggestions.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Volume2, VolumeX, Copy, Check, RotateCcw } from 'lucide-react';
import { apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfidenceBadge, PageHeader, Spinner, EmptyState } from '../components/ui';
import { ColleagueIcon, SendIcon, DocumentIcon, SparkIcon, AlertIcon, ArrowRightIcon } from '../components/icons';
import { speak, stopSpeaking, speechSupported, startDictation, recognitionSupported } from '../lib/speech';

const examples = [
  'How should I onboard a new teammate?',
  'What is the release checklist?',
  'Where do I find the support guide?',
  'What does the architecture look like?',
];

export default function Colleague() {
  const { activeTeam } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]); // {role:'user'|'colleague', content, sources?, confidence?, notFound?}
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [openSource, setOpenSource] = useState(null); // `${msgIdx}-${srcIdx}`
  const [copied, setCopied] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => () => { stopSpeaking(); recognitionRef.current?.stop(); }, []);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setQuestion('');
    setLoading(true);
    setOpenSource(null);
    try {
      const res = await apiPost('/api/colleague/ask', { question: text, history });
      const notFound = !res.sources || res.sources.length === 0;
      setMessages((prev) => [...prev, { role: 'colleague', content: res.answer, sources: res.sources || [], confidence: res.confidence, notFound }]);
    } catch (e) {
      toast.error(e.message);
      setMessages((prev) => [...prev, { role: 'colleague', content: 'Something went wrong reaching the Colleague. Please try again.', sources: [], error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleDictation() {
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = startDictation({
      onResult: (t) => setQuestion(t),
      onEnd: () => { setListening(false); recognitionRef.current = null; },
      onError: () => { setListening(false); recognitionRef.current = null; },
    });
    if (rec) { recognitionRef.current = rec; setListening(true); }
  }

  function readAloud(idx, text) {
    if (speakingIdx === idx) { stopSpeaking(); setSpeakingIdx(null); return; }
    speak(text);
    setSpeakingIdx(idx);
  }

  async function copyAnswer(idx, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied((c) => (c === idx ? null : c)), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  function newChat() {
    stopSpeaking();
    setMessages([]);
    setQuestion('');
    setOpenSource(null);
  }

  // Follow-up chips derived from the most recent grounded answer.
  const followUps = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'colleague' && !m.notFound && !m.error);
    const fromSources = (last?.sources || []).slice(0, 2).map((s) => `Tell me more about the ${s.title}`);
    return last ? [...fromSources, 'How does this apply to my team?'] : [];
  }, [messages]);

  const empty = messages.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Ask about projects & processes"
        subtitle={`A conversational assistant grounded in ${activeTeam?.name || 'your team'}'s documents — with cited sources, voice, and follow-ups.`}
        icon={<ColleagueIcon className="h-6 w-6" />}
      />

      {/* Conversation */}
      {empty ? (
        <EmptyState
          title="Ask your first question"
          text="Pick an example below or type your own. The Colleague answers only from your team’s documents, cites its sources, and flags what it doesn’t know."
          icon={<ColleagueIcon className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">Conversation</p>
            <button onClick={newChat} className="btn-ghost btn-sm"><RotateCcw className="h-3.5 w-3.5" /> New chat</button>
          </div>

          {messages.map((m, idx) => {
            if (m.role === 'user') {
              return (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500/[0.12] px-4 py-2.5 text-[15px] text-strong">
                    {m.content}
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className="card animate-fade-in space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.notFound || m.error ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300' : 'bg-brand-500/15 text-accent'}`}>
                    {m.notFound || m.error ? <AlertIcon className="h-5 w-5" /> : <SparkIcon className="h-5 w-5" />}
                  </div>
                  <h3 className="text-base font-semibold text-strong">{m.notFound ? 'Not in your documents' : 'Colleague'}</h3>
                  {!m.notFound && !m.error && <ConfidenceBadge confidence={m.confidence} />}
                  {!m.error && (
                    <div className="ml-auto flex items-center gap-1">
                      {speechSupported && (
                        <button onClick={() => readAloud(idx, m.content)} title="Read aloud" aria-label="Read answer aloud"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-elevated hover:text-strong">
                          {speakingIdx === idx ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      )}
                      <button onClick={() => copyAnswer(idx, m.content)} title="Copy answer" aria-label="Copy answer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-elevated hover:text-strong">
                        {copied === idx ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[15px] leading-8 text-body">{m.content}</p>

                {m.notFound ? (
                  <Link to="/documents" className="btn-outline"><DocumentIcon className="h-4 w-4" /> Add a document <ArrowRightIcon className="h-4 w-4" /></Link>
                ) : m.sources?.length > 0 ? (
                  <div>
                    <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                      <DocumentIcon className="h-4 w-4" /> Sources · click to expand
                    </p>
                    <div className="space-y-2">
                      {m.sources.map((source, i) => {
                        const key = `${idx}-${i}`;
                        const open = openSource === key;
                        return (
                          <button key={key} onClick={() => setOpenSource(open ? null : key)}
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
                ) : null}
              </div>
            );
          })}

          {loading && (
            <div className="card flex items-center gap-3 text-muted">
              <Spinner className="h-4 w-4" /> The Colleague is reading your documents…
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Composer */}
      <div className="card space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="space-y-3">
          <div className="flex items-end gap-2">
            <textarea className="textarea flex-1" rows="2" value={question} aria-label="Your question"
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
              placeholder={listening ? 'Listening… speak now' : 'Ask a follow-up, or a new question…'} />
            {recognitionSupported && (
              <button type="button" onClick={toggleDictation} title={listening ? 'Stop listening' : 'Ask by voice'}
                aria-label={listening ? 'Stop listening' : 'Ask by voice'} aria-pressed={listening}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${listening ? 'animate-pulse border-rose-400/60 bg-rose-500/15 text-rose-500' : 'border-line bg-elevated text-muted hover:text-strong'}`}>
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button type="submit" className="btn-primary h-11 shrink-0" disabled={loading || !question.trim()}>
              {loading ? <Spinner className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
              {loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(followUps.length ? followUps : examples).map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => ask(ex)} disabled={loading}>{ex}</button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
