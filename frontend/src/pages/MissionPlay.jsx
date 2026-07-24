// THE ESCAPE ROOM — cinematic mission play screen.
// Game logic is unchanged (sanitized fetch, server-side evaluate, AI Game Master chat,
// progressive hints, server-saved report). Only the presentation is an escape-room:
// you're locked in, read the clues, pick the right move to pop each lock, and escape.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, DoorOpen, Lock, LockOpen, KeyRound, Timer, Puzzle, Lightbulb, Send,
  Trophy, AlertTriangle, CheckCircle2, ChevronRight, Drama, Flame, Fingerprint,
  Sparkles, Eye, Search, Volume2, VolumeX, Megaphone, Mic, Award,
} from 'lucide-react';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { EscapeRoom, Panel, Tag, CountUp, ER, ROOM_COLOR } from '../components/escaperoom';
import { playSound, isMuted, setMuted } from '../lib/audio';
import { speak, stopSpeaking, speechSupported, startDictation, recognitionSupported } from '../lib/speech';
import Certificate from '../components/Certificate';

const RISK = {
  low: { label: 'LOW', color: ER.emerald },
  medium: { label: 'MEDIUM', color: ER.amber },
  high: { label: 'HIGH', color: ER.rust },
};
const CLUE_QUESTIONS = [
  'Who really sent this?',
  'Where does the link actually go?',
  'What are they asking me to do?',
  'Why is it so urgent?',
  'How should I report it?',
];
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

export default function MissionPlay() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user, activeTeam } = useAuth();
  const [mission, setMission] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('briefing');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [, setWorstRisk] = useState('low');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  // Sound effects (unlock/lock) + spoken narration of the Game Master.
  const [muted, setMutedState] = useState(isMuted());
  const [narrate, setNarrate] = useState(false);
  const [listening, setListening] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const chatEndRef = useRef(null);
  const spokenCountRef = useRef(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    apiGet(`/api/missions/${missionId}`).then(setMission).catch(() => setNotFound(true));
    setChat([{ role: 'game-master', content: "I'm your Game Master. Don't rush the lock — investigate first. Ask me things like “Who really sent this?” or “Why is it so urgent?” and I'll point out what feels off." }]);
  }, [missionId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  // When narration is on, read each new Game Master reply / hint aloud.
  useEffect(() => {
    if (!narrate) { spokenCountRef.current = chat.length; return; }
    if (chat.length > spokenCountRef.current) {
      const latest = chat[chat.length - 1];
      if (latest && (latest.role === 'game-master' || latest.role === 'hint')) speak(latest.content);
    }
    spokenCountRef.current = chat.length;
  }, [chat, narrate]);

  // Stop any narration / dictation when leaving the room.
  useEffect(() => () => { stopSpeaking(); recognitionRef.current?.stop(); }, []);

  function toggleMuted() {
    setMutedState((m) => { const next = !m; setMuted(next); return next; });
  }
  function toggleNarrate() {
    setNarrate((n) => { const next = !n; if (!next) stopSpeaking(); return next; });
  }

  // Push-to-talk: dictate a question to the Game Master instead of typing it.
  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = startDictation({
      onResult: (transcript) => setMessage(transcript),
      onEnd: () => { setListening(false); recognitionRef.current = null; },
      onError: () => { setListening(false); recognitionRef.current = null; },
    });
    if (rec) {
      recognitionRef.current = rec;
      setListening(true);
    }
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase, startedAt]);

  const step = mission?.steps?.[currentStep];
  const isLastStep = mission ? currentStep === mission.steps.length - 1 : false;
  const limitSeconds = (mission?.estimatedMinutes || 5) * 60;
  const remaining = Math.max(0, limitSeconds - elapsed);
  const lowTime = phase === 'playing' && remaining <= 60;

  async function evaluateChoice(choice) {
    if (loading || feedback?.correct) return;
    setSelectedChoice(choice.id);
    setLoading(true);
    try {
      const result = await apiPost('/api/missions/evaluate', { missionId, stepId: step.id, choiceId: choice.id });
      setFeedback(result);
      playSound(result.correct ? 'unlock' : 'lock');
      setDecisions((prev) => [...prev, { stepId: step.id, correct: result.correct, risk: result.risk }]);
      if (!result.correct && result.risk === 'high') setWorstRisk('high');
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    if (isLastStep) return completeMission();
    setCurrentStep((p) => p + 1);
    setSelectedChoice(null);
    setFeedback(null);
  }

  async function askGameMaster(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || chatBusy) return;
    setMessage('');
    setChat((prev) => [...prev, { role: 'player', content: trimmed }]);
    setChatBusy(true);
    try {
      const result = await apiPost('/api/missions/interact', { missionId, message: trimmed, history: chat });
      setChat((prev) => [...prev, { role: 'game-master', content: result.reply }]);
    } finally {
      setChatBusy(false);
    }
  }

  async function requestHint() {
    if (chatBusy || phase === 'report') return;
    setChatBusy(true);
    try {
      const level = hintsUsed + 1;
      const result = await apiPost('/api/missions/hint', { missionId, stepId: step.id, level });
      setChat((prev) => [...prev, { role: 'hint', content: result.hint, level }]);
      setHintsUsed(level);
    } finally {
      setChatBusy(false);
    }
  }

  async function completeMission() {
    setLoading(true);
    try {
      const result = await apiPost('/api/missions/report', {
        missionId, decisions, hintsUsed, durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setReport(result);
      setPhase('report');
      playSound('escape');
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setPhase('briefing');
    setCurrentStep(0);
    setSelectedChoice(null);
    setFeedback(null);
    setDecisions([]);
    setReport(null);
    setHintsUsed(0);
    setElapsed(0);
    setStartedAt(Date.now());
  }

  if (notFound) {
    return (
      <EscapeRoom>
        <Panel className="mx-auto mt-16 max-w-md p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-rose-400" />
          <p className="mt-3 font-display text-xl uppercase text-white">Room not found</p>
          <p className="mt-1 font-type text-xs text-stone-500">This room isn't available to your team.</p>
          <button onClick={() => navigate('/missions')} className="clue-frame mt-5 rounded-md px-4 py-2 font-display text-sm uppercase tracking-wider text-amber-300 hover:bg-amber-400/10">
            Back to rooms
          </button>
        </Panel>
      </EscapeRoom>
    );
  }
  if (!mission) {
    return (
      <EscapeRoom>
        <div className="flex items-center justify-center gap-3 py-32 font-type text-sm text-amber-300">
          <KeyRound className="h-5 w-5 animate-pulse" /> UNLOCKING THE DOOR…
        </div>
      </EscapeRoom>
    );
  }

  const door = ROOM_COLOR[mission.topic] || ER.amber;

  return (
    <EscapeRoom>
      {/* ===== Room header ===== */}
      <Panel className="mb-5 flex flex-wrap items-center gap-4 px-4 py-3" glow={door}>
        <button onClick={() => navigate('/missions')} className="flex items-center gap-1.5 font-type text-xs uppercase tracking-wider text-stone-400 transition hover:text-rose-300">
          <ArrowLeft className="h-4 w-4" /> Leave
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleMuted} title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${muted ? 'border-white/10 text-stone-500 hover:text-stone-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'}`}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {speechSupported && (
            <button onClick={toggleNarrate} title={narrate ? 'Stop narrating the Game Master' : 'Narrate the Game Master aloud'}
              aria-label={narrate ? 'Stop narration' : 'Narrate the Game Master aloud'} aria-pressed={narrate}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${narrate ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : 'border-white/10 text-stone-500 hover:text-stone-300'}`}>
              <Megaphone className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="stamp-label text-stone-500">THE ROOM</p>
            <Tag color={door}>{mission.topic}</Tag>
          </div>
          <h1 className="truncate font-display text-xl font-bold uppercase tracking-wide text-white md:text-2xl">{mission.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* the escape clock */}
          <div className={`text-right ${lowTime ? 'er-shake' : ''}`}>
            <p className="stamp-label text-stone-500">TIME LEFT</p>
            <p className={`font-display text-2xl font-bold leading-none ${lowTime ? 'text-rose-400' : 'text-amber-300'}`}
              style={{ textShadow: `0 0 14px ${lowTime ? ER.rust : ER.amber}66` }}>
              {fmtTime(remaining)}
            </p>
          </div>
          {phase === 'playing' && (
            <div className="text-right font-type text-xs">
              <p className="stamp-label text-stone-500">LOCKS</p>
              <p className="text-white">{currentStep + (feedback?.correct ? 1 : 0)}<span className="text-stone-600">/{mission.steps.length}</span></p>
            </div>
          )}
        </div>
      </Panel>

      <AnimatePresence mode="wait">
        {/* ============ BRIEFING — you're locked in ============ */}
        {phase === 'briefing' && (
          <motion.div key="briefing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <Panel className="relative overflow-hidden p-6 md:p-8" glow={door}>
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" style={{ color: door }} />
                <p className="stamp-label" style={{ color: door }}>THE DOOR LOCKS BEHIND YOU</p>
                {speechSupported && (
                  <button onClick={() => speak(`${mission.briefing}. The scene: ${mission.scenario}`)}
                    title="Read the briefing aloud" aria-label="Read the briefing aloud"
                    className="ml-auto flex items-center gap-1.5 rounded border border-amber-400/40 px-2.5 py-1 font-type text-[11px] uppercase tracking-wider text-amber-300 transition hover:bg-amber-400/10">
                    <Volume2 className="h-3.5 w-3.5" /> Read aloud
                  </button>
                )}
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="max-w-3xl text-[15px] leading-relaxed text-stone-300">{mission.briefing}</motion.p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className="rounded-md border border-white/10 bg-black/40 p-4">
                  <p className="stamp-label mb-2 flex items-center gap-1.5 text-stone-500"><Eye className="h-3.5 w-3.5" /> THE SCENE</p>
                  <p className="text-sm leading-relaxed text-stone-300">{mission.scenario}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                  className="rounded-md border border-white/10 bg-black/40 p-4">
                  <p className="stamp-label mb-2 flex items-center gap-1.5 text-stone-500"><KeyRound className="h-3.5 w-3.5" /> TO ESCAPE YOU MUST</p>
                  <ul className="space-y-1.5">
                    {(mission.objectives || []).map((o, i) => (
                      <li key={o} className="flex items-start gap-2 text-sm text-stone-300">
                        <span className="font-type text-xs" style={{ color: door }}>0{i + 1}</span>{o}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { playSound('door'); setStartedAt(Date.now()); setElapsed(0); setPhase('playing'); }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md py-4 font-display text-base font-bold uppercase tracking-[0.2em] text-black md:w-auto md:px-10"
                style={{ background: `linear-gradient(90deg, ${ER.gold}, ${ER.ember})`, boxShadow: `0 0 30px -6px ${ER.amber}` }}>
                <DoorOpen className="h-5 w-5" /> Enter the room
              </motion.button>
            </Panel>
          </motion.div>
        )}

        {/* ============ PLAYING ============ */}
        {phase === 'playing' && step && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* padlock stepper */}
            <div className="mb-4 flex items-center gap-2">
              {mission.steps.map((s, i) => {
                const done = i < currentStep || (i === currentStep && feedback?.correct);
                const active = i === currentStep && !feedback?.correct;
                return (
                  <div key={s.id} className="flex flex-1 items-center gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${done ? 'er-unlock' : ''}`}
                      style={{ borderColor: done ? ER.emerald : active ? door : 'rgba(168,162,158,0.25)', background: done ? `${ER.emerald}18` : active ? `${door}18` : 'transparent' }}>
                      {done ? <LockOpen className="h-4 w-4" style={{ color: ER.emerald }} /> : <Lock className="h-4 w-4" style={{ color: active ? door : '#78716c' }} />}
                    </div>
                    {i < mission.steps.length - 1 && <div className="h-px flex-1" style={{ background: done ? ER.emerald : 'rgba(255,255,255,0.1)' }} />}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              {/* --- LEFT: THE LOCK --- */}
              <Panel className="p-5" glow={door}>
                <div className="mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-300" />
                  <p className="stamp-label text-amber-300">LOCK {currentStep + 1} OF {mission.steps.length}</p>
                </div>

                <p className="stamp-label text-stone-500">THE SITUATION</p>
                <h2 className="font-display text-xl font-bold text-white">{step.prompt}</h2>

                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-400/25 bg-amber-400/[0.06] p-3">
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-sm leading-relaxed text-amber-100/90"><span className="stamp-label text-amber-400">CLUE // </span>{step.clue}</p>
                </div>

                <p className="mt-4 stamp-label text-stone-500">PICK THE MOVE THAT OPENS THE LOCK</p>
                <div className="mt-2 space-y-2.5">
                  {step.choices.map((choice, idx) => {
                    const selected = selectedChoice === choice.id;
                    const show = selected && feedback;
                    const correct = show && feedback.correct;
                    const wrong = show && !feedback.correct;
                    return (
                      <motion.button key={choice.id} whileHover={!feedback?.correct ? { x: 4 } : undefined}
                        disabled={loading || feedback?.correct}
                        onClick={() => evaluateChoice(choice)}
                        className={`group flex w-full items-center gap-3 rounded-md border p-3.5 text-left transition disabled:cursor-not-allowed ${wrong ? 'er-shake' : ''}`}
                        style={{
                          borderColor: correct ? ER.emerald : wrong ? ER.rust : selected ? door : 'rgba(168,162,158,0.2)',
                          background: correct ? `${ER.emerald}14` : wrong ? `${ER.rust}14` : 'rgba(255,255,255,0.02)',
                        }}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border font-type text-xs font-bold"
                          style={{ borderColor: correct ? ER.emerald : wrong ? ER.rust : 'rgba(168,162,158,0.35)', color: correct ? ER.emerald : wrong ? ER.rust : '#a8a29e' }}>
                          {correct ? '✓' : wrong ? '✕' : String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm text-stone-200">{choice.text}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {loading && <p className="mt-3 flex items-center gap-2 font-type text-xs text-amber-300"><KeyRound className="h-4 w-4 animate-pulse" /> TRYING THE KEY…</p>}

                <AnimatePresence>
                  {feedback && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      <div className="rounded-md border p-4" style={{ borderColor: `${feedback.correct ? ER.emerald : ER.rust}55`, background: `${feedback.correct ? ER.emerald : ER.rust}0d` }}>
                        <div className="flex items-center gap-2">
                          {feedback.correct ? <LockOpen className="er-unlock h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
                          <p className="font-display text-base font-bold uppercase tracking-wide" style={{ color: feedback.correct ? ER.emerald : ER.rust }}>
                            {feedback.correct ? 'Lock opens!' : 'Wrong key'}
                          </p>
                          <span className="ml-auto stamp-label flex items-center gap-1" style={{ color: RISK[feedback.risk]?.color }}>
                            <Flame className="h-3 w-3" /> RISK: {RISK[feedback.risk]?.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-stone-200">{feedback.feedback}</p>
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm leading-relaxed text-stone-400">
                          <p>{feedback.explanation}</p>
                          <p><span className="stamp-label text-stone-500">THE RULE // </span>{feedback.policyPrinciple}</p>
                          <p><span className="stamp-label text-stone-500">IN REAL LIFE // </span>{feedback.realWorldAction}</p>
                        </div>
                        {feedback.correct ? (
                          <button onClick={advance}
                            className="mt-4 flex items-center gap-2 rounded-md px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-black"
                            style={{ background: `linear-gradient(90deg, ${ER.emerald}, ${ER.teal})` }}>
                            {isLastStep ? <><DoorOpen className="h-4 w-4" /> Escape the room</> : <>Next lock <ChevronRight className="h-4 w-4" /></>}
                          </button>
                        ) : (
                          <button onClick={() => { setSelectedChoice(null); setFeedback(null); }}
                            className="mt-4 rounded-md border border-rose-400/40 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-rose-300 hover:bg-rose-400/10">
                            Try another key
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Panel>

              {/* --- RIGHT: GAME MASTER --- */}
              <Panel className="flex h-[620px] flex-col p-0" glow={ER.amber}>
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <Drama className="h-4 w-4 text-amber-300" />
                  <p className="stamp-label text-amber-300">GAME MASTER</p>
                  <button onClick={requestHint} disabled={chatBusy}
                    className="ml-auto flex items-center gap-1.5 rounded border border-amber-400/40 px-2.5 py-1 font-type text-[11px] uppercase tracking-wider text-amber-300 transition hover:bg-amber-400/10 disabled:opacity-40">
                    <Lightbulb className="h-3.5 w-3.5" /> Hint{hintsUsed ? ` (${hintsUsed})` : ''}
                  </button>
                </div>

                <div className="er-scroll flex-1 space-y-3 overflow-y-auto p-4">
                  {chat.map((entry, i) => {
                    if (entry.role === 'player') {
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
                          <div className="max-w-[85%] rounded-md rounded-br-none border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-50">
                            <span className="font-type text-[10px] text-amber-400/70">YOU</span>
                            <p>{entry.content}</p>
                          </div>
                        </motion.div>
                      );
                    }
                    if (entry.role === 'hint') {
                      return (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                          <div className="max-w-[90%] rounded-md border border-yellow-400/30 bg-yellow-400/[0.08] px-3 py-2 text-sm text-yellow-100">
                            <p className="font-type text-[10px] uppercase tracking-wider text-yellow-400 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> HINT · LEVEL {entry.level}</p>
                            {entry.content}
                          </div>
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300"><Drama className="h-4 w-4" /></div>
                        <div className="max-w-[85%] rounded-md rounded-bl-none border border-white/10 bg-black/40 px-3 py-2 text-sm leading-relaxed text-stone-200">
                          <span className="font-type text-[10px] text-amber-400/70">GAME MASTER</span>
                          <p>{entry.content}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {chatBusy && <p className="flex items-center gap-2 pl-9 font-type text-xs text-amber-300"><Search className="h-4 w-4 animate-pulse" /> THINKING…</p>}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-white/10 p-3">
                  <p className="mb-2 stamp-label text-stone-500">ASK ABOUT A CLUE</p>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {CLUE_QUESTIONS.map((s) => (
                      <button key={s} onClick={() => askGameMaster(s)} disabled={chatBusy}
                        className="rounded border border-amber-400/25 bg-amber-400/5 px-2.5 py-1 font-type text-[11px] text-amber-200 transition hover:bg-amber-400/15 disabled:opacity-40">
                        {s}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); askGameMaster(message); }} className="flex items-center gap-2">
                    <input value={message} onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-amber-400/50 placeholder:text-stone-600"
                      placeholder={listening ? 'listening… speak now' : 'ask the Game Master…'} aria-label="Message the Game Master" />
                    {recognitionSupported && (
                      <button type="button" onClick={toggleDictation}
                        title={listening ? 'Stop listening' : 'Speak to the Game Master'}
                        aria-label={listening ? 'Stop listening' : 'Speak to the Game Master'} aria-pressed={listening}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${listening ? 'animate-pulse border-rose-400/60 bg-rose-500/20 text-rose-300' : 'border-white/10 text-stone-400 hover:border-amber-400/40 hover:text-amber-300'}`}>
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                    <button type="submit" disabled={chatBusy || !message.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </Panel>
            </div>
          </motion.div>
        )}

        {/* ============ ESCAPE REPORT ============ */}
        {phase === 'report' && report && (
          <motion.div key="report" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="space-y-5">
            <Panel className="relative overflow-hidden p-6 md:p-8" glow={ER.gold}>
              <div className="mb-5 flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-amber-300" />
                <p className="stamp-label text-amber-300">ESCAPE REPORT</p>
              </div>

              <div className="flex flex-col items-center gap-6 md:flex-row">
                {/* escape meter */}
                <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(168,162,158,0.15)" strokeWidth="8" />
                    <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#erg)" strokeWidth="8" strokeLinecap="round"
                      initial={{ strokeDasharray: '0 327' }} animate={{ strokeDasharray: `${(report.score / 100) * 327} 327` }} transition={{ duration: 1.4, ease: 'easeOut' }} />
                    <defs><linearGradient id="erg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={ER.gold} /><stop offset="100%" stopColor={ER.ember} /></linearGradient></defs>
                  </svg>
                  <div className="absolute text-center">
                    <CountUp to={report.score} className="font-display text-5xl font-bold text-white" />
                    <p className="-mt-1 font-type text-[10px] text-stone-500">/ 100</p>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <p className="stamp-label text-stone-500">YOUR RATING</p>
                  <p className="font-display text-3xl font-bold uppercase tracking-wide text-white">{report.grade}</p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-300">{report.headline}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-3 font-type text-xs text-stone-400 md:justify-start">
                    <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-amber-300" /> {fmtTime(elapsed)} in the room</span>
                    <span className="flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-yellow-300" /> {hintsUsed} hints used</span>
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid gap-5 md:grid-cols-2">
              <Panel className="p-5" glow={ER.emerald}>
                <p className="stamp-label mb-3 flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> WHAT YOU NAILED</p>
                <ul className="space-y-2 text-sm text-stone-300">
                  {report.strengths.map((s) => <li key={s} className="flex gap-2"><span className="text-emerald-400">▸</span>{s}</li>)}
                </ul>
              </Panel>
              <Panel className="p-5" glow={ER.amber}>
                <p className="stamp-label mb-3 flex items-center gap-2 text-amber-400"><AlertTriangle className="h-4 w-4" /> WHAT TO WATCH</p>
                <ul className="space-y-2 text-sm text-stone-300">
                  {report.improvements.map((s) => <li key={s} className="flex gap-2"><span className="text-amber-400">▸</span>{s}</li>)}
                </ul>
              </Panel>
            </div>

            {mission.learningPoints?.length > 0 && (
              <Panel className="p-5">
                <p className="stamp-label mb-3 flex items-center gap-2 text-amber-300"><Sparkles className="h-4 w-4" /> TAKEAWAYS</p>
                <ul className="grid gap-2 text-sm text-stone-300 md:grid-cols-2">
                  {mission.learningPoints.map((lp) => <li key={lp} className="flex gap-2"><span className="text-amber-400">▸</span>{lp}</li>)}
                </ul>
              </Panel>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="stamp-label text-stone-500">TRY NEXT:</span>
              {report.recommendedTopics.map((t) => <Tag key={t} color={ER.ember}>{t}</Tag>)}
            </div>

            <div className="flex items-start gap-2 rounded-md border border-white/10 bg-black/40 p-3 font-type text-[11px] leading-relaxed text-stone-500">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" /> <Fingerprint className="mt-0.5 h-4 w-4 shrink-0" />
              Your score is private to your account. Only anonymized, aggregated team stats are ever shared — no individual rankings.
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/missions')} className="flex items-center gap-2 rounded-md px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-black" style={{ background: `linear-gradient(90deg, ${ER.gold}, ${ER.ember})` }}>
                <ArrowLeft className="h-4 w-4" /> Back to rooms
              </button>
              <button onClick={() => setShowCert(true)}
                className="flex items-center gap-2 rounded-md border border-amber-400/50 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-amber-300 transition hover:bg-amber-400/10">
                <Award className="h-4 w-4" /> Claim certificate
              </button>
              <button onClick={restart} className="clue-frame rounded-md px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-amber-300 hover:bg-amber-400/10">
                Play again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCert && report && (
        <Certificate
          name={user?.fullName || user?.email?.split('@')[0]}
          team={activeTeam?.name}
          missionTitle={mission.title}
          topic={mission.topic}
          grade={report.grade}
          score={report.score}
          date={new Date()}
          onClose={() => setShowCert(false)}
        />
      )}
    </EscapeRoom>
  );
}
