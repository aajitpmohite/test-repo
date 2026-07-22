import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BulbIcon,
  CheckIcon,
  ClockIcon,
  SendIcon,
  ShieldIcon,
  SparkIcon,
  TrophyIcon,
  XIcon,
} from '../components/icons'
import {
  Badge,
  DifficultyBadge,
  RichText,
  Spinner,
  TopicBadge,
} from '../components/ui'
import { getProgress } from './Missions'

const RISK_ORDER = { low: 0, medium: 1, high: 2 }
const worseRisk = (a, b) => (RISK_ORDER[b] > RISK_ORDER[a] ? b : a)

export default function MissionPlay() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [mission, setMission] = useState(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('briefing') // briefing | playing | report

  const [stepIndex, setStepIndex] = useState(0)
  const [decisions, setDecisions] = useState([])
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const stepState = useRef({ firstCorrect: null, worstRisk: 'low' })

  const [hintsUsed, setHintsUsed] = useState(0)
  const hintLevel = useRef(0)
  const startTime = useRef(null)

  const [report, setReport] = useState(null)

  // Game Master chat
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const chatEndRef = useRef(null)

  useEffect(() => {
    api
      .getMission(id)
      .then((m) => {
        setMission(m)
        setMessages([
          {
            role: 'assistant',
            content:
              '\ud83d\udd75\ufe0f I\'m your AI Game Master. Ask me questions to investigate and uncover the solution \u2014 for example: "Who really sent this?", "Where does the link go?", "What are they asking me to do?", "Why is it so urgent?", or "How should I report it?". Tap a suggested question below, or type your own.',
          },
        ])
      })
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatBusy])

  const currentStep = mission?.steps?.[stepIndex]

  function begin() {
    startTime.current = Date.now()
    setPhase('playing')
  }

  async function choose(choice) {
    if (evaluating || feedback?.correct) return
    setSelected(choice.id)
    setEvaluating(true)
    try {
      const res = await api.evaluate({
        missionId: mission.id,
        stepId: currentStep.id,
        choiceId: choice.id,
      })
      setFeedback(res)
      const ss = stepState.current
      if (ss.firstCorrect === null) ss.firstCorrect = res.correct
      if (!res.correct) ss.worstRisk = worseRisk(ss.worstRisk, res.risk)
    } catch (e) {
      setError(e.message)
    } finally {
      setEvaluating(false)
    }
  }

  function proceed() {
    const ss = stepState.current
    const decision = {
      stepId: currentStep.id,
      choiceId: selected,
      correct: !!ss.firstCorrect,
      risk: ss.firstCorrect ? 'low' : ss.worstRisk,
    }
    const next = [...decisions, decision]
    setDecisions(next)
    setFeedback(null)
    setSelected(null)
    stepState.current = { firstCorrect: null, worstRisk: 'low' }
    if (stepIndex + 1 < mission.steps.length) {
      setStepIndex(stepIndex + 1)
    } else {
      finish(next)
    }
  }

  function tryAgain() {
    setFeedback(null)
    setSelected(null)
  }

  async function finish(finalDecisions) {
    setPhase('report')
    const duration = Math.round((Date.now() - startTime.current) / 1000)
    try {
      const rep = await api.report({
        missionId: mission.id,
        decisions: finalDecisions,
        hintsUsed,
        durationSeconds: duration,
      })
      setReport(rep)
      const prog = getProgress()
      prog[mission.id] = { score: rep.score, grade: rep.grade, date: Date.now() }
      localStorage.setItem('dbquest_progress', JSON.stringify(prog))
    } catch (e) {
      setError(e.message)
    }
  }

  async function sendChat(text) {
    const msg = (text ?? chatInput).trim()
    if (!msg || chatBusy) return
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setChatInput('')
    setSuggestions([])
    setChatBusy(true)
    try {
      const res = await api.interact({ missionId: mission.id, message: msg, history })
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
      setSuggestions(res.suggestions || [])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `(Game Master unavailable: ${e.message})` }])
    } finally {
      setChatBusy(false)
    }
  }

  async function getHint() {
    if (chatBusy) return
    const level = Math.min(hintLevel.current + 1, 3)
    hintLevel.current = level
    setHintsUsed((h) => h + 1)
    setChatBusy(true)
    try {
      const res = await api.hint({ missionId: mission.id, stepId: currentStep?.id, level })
      setMessages((m) => [...m, { role: 'assistant', content: `Hint ${level}/3 — ${res.hint}` }])
    } catch (e) {
      setError(e.message)
    } finally {
      setChatBusy(false)
    }
  }

  if (error)
    return (
      <div className="card p-8 text-center">
        <p className="text-rose-600">{error}</p>
        <Link to="/missions" className="btn-outline mt-4 inline-flex">
          <ArrowLeftIcon className="h-4 w-4" /> Back to missions
        </Link>
      </div>
    )

  if (!mission)
    return (
      <div className="flex justify-center py-20 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/missions" className="btn-ghost p-2">
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">{mission.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <TopicBadge topic={mission.topic} />
              <DifficultyBadge level={mission.difficulty} />
              <Badge color="slate">
                <TrophyIcon className="h-3.5 w-3.5" /> {mission.points} pts
              </Badge>
            </div>
          </div>
        </div>
        {phase === 'playing' && (
          <Badge color="blue">
            Step {stepIndex + 1} / {mission.steps.length}
          </Badge>
        )}
      </div>

      {phase === 'briefing' && <Briefing mission={mission} onBegin={begin} />}

      {phase === 'playing' && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProgressBar index={stepIndex} total={mission.steps.length} />
            <DecisionPanel
              step={currentStep}
              selected={selected}
              feedback={feedback}
              evaluating={evaluating}
              onChoose={choose}
              onProceed={proceed}
              onTryAgain={tryAgain}
              isLast={stepIndex + 1 === mission.steps.length}
            />
          </div>
          <div className="lg:col-span-2">
            <GameMaster
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSend={sendChat}
              onHint={getHint}
              busy={chatBusy}
              suggestions={suggestions}
              hintsUsed={hintsUsed}
              chatEndRef={chatEndRef}
            />
          </div>
        </div>
      )}

      {phase === 'report' && (
        <ReportView
          report={report}
          mission={mission}
          hintsUsed={hintsUsed}
          onReplay={() => navigate(0)}
        />
      )}
    </div>
  )
}

function ProgressBar({ index, total }) {
  const pct = Math.round((index / total) * 100)
  return (
    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function Briefing({ mission, onBegin }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-700 to-ink p-6 text-white">
        <span className="badge bg-white/15 text-white">
          <ShieldIcon className="h-3.5 w-3.5" /> Mission briefing
        </span>
        <p className="mt-3 text-lg leading-relaxed">{mission.briefing}</p>
      </div>
      <div className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Objectives</h3>
        <ul className="mt-3 space-y-2">
          {mission.objectives?.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              {o}
            </li>
          ))}
        </ul>
        <button onClick={onBegin} className="btn-primary mt-6 w-full sm:w-auto">
          Begin mission <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DecisionPanel({ step, selected, feedback, evaluating, onChoose, onProceed, onTryAgain, isLast }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-ink">{step.prompt}</h2>
      <div className="mt-4 space-y-3">
        {step.choices.map((c) => {
          const isSel = selected === c.id
          const showRes = feedback && isSel
          const locked = feedback?.correct
          let ring = 'border-slate-200 hover:border-brand-300'
          if (showRes) ring = feedback.correct ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'
          return (
            <button
              key={c.id}
              onClick={() => onChoose(c)}
              disabled={evaluating || locked}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${ring}`}
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-600">
                {c.id}
              </span>
              <span className="flex-1 text-slate-700">{c.text}</span>
              {showRes &&
                (feedback.correct ? (
                  <CheckIcon className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XIcon className="h-5 w-5 text-rose-600" />
                ))}
              {evaluating && isSel && <Spinner className="h-4 w-4 text-brand-600" />}
            </button>
          )
        })}
      </div>

      {feedback && (
        <div
          className={`mt-5 animate-in rounded-xl border p-4 ${
            feedback.correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Badge color={feedback.correct ? 'green' : 'red'}>
              {feedback.correct ? 'Correct decision' : `Risky · ${feedback.risk}`}
            </Badge>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>{feedback.explanation}</p>
            <p className="text-slate-600">
              <span className="font-semibold">Policy:</span> {feedback.policyPrinciple}
            </p>
            <p className="text-slate-600">
              <span className="font-semibold">In real life:</span> {feedback.realWorldAction}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            {feedback.correct ? (
              <button onClick={onProceed} className="btn-primary">
                {isLast ? 'See my results' : 'Continue'} <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={onTryAgain} className="btn-outline">
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GameMaster({
  messages,
  chatInput,
  setChatInput,
  onSend,
  onHint,
  busy,
  suggestions,
  hintsUsed,
  chatEndRef,
}) {
  return (
    <div className="card flex h-[540px] flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <SparkIcon className="h-4 w-4" />
          </span>
          AI Game Master
        </div>
        <button onClick={onHint} className="btn-ghost px-2 py-1 text-xs" disabled={busy}>
          <BulbIcon className="h-4 w-4" /> Hint{hintsUsed ? ` (${hintsUsed})` : ''}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <RichText text={m.content} />
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3.5 py-2.5 text-slate-400">
              <Spinner className="h-4 w-4" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-2">
          {suggestions.map((s, i) => (
            <button key={i} className="chip" onClick={() => onSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t border-slate-100 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        <input
          className="input"
          placeholder="Ask a question, e.g. Who really sent this?"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3" disabled={busy}>
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function ReportView({ report, mission, hintsUsed, onReplay }) {
  if (!report)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-600">
        <Spinner className="h-8 w-8" />
        <p className="mt-3 text-sm text-slate-500">Generating your personalised learning report…</p>
      </div>
    )
  const ring =
    report.score >= 85 ? 'text-emerald-600' : report.score >= 70 ? 'text-brand-600' : report.score >= 50 ? 'text-amber-600' : 'text-rose-600'
  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-ink p-6 text-white">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            <span className="font-semibold">Mission complete</span>
          </div>
          <p className="mt-1 text-brand-100">{report.headline}</p>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6">
            <div className={`text-5xl font-black ${ring}`}>{report.score}</div>
            <div className="mt-1 text-sm text-slate-400">out of 100</div>
            <Badge color="blue" className="mt-3">
              {report.grade}
            </Badge>
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
              <ClockIcon className="h-3.5 w-3.5" /> {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} used
            </p>
          </div>
          <div className="sm:col-span-2 space-y-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckIcon className="h-4 w-4" /> Strengths
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <BulbIcon className="h-4 w-4" /> Areas to improve
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {report.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Key learning points
        </h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {mission.learningPoints?.map((p, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <ShieldIcon className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-400">
          Your score is private to you. In a real deployment, only anonymised, aggregated team
          insights would be shared — never individual rankings.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onReplay} className="btn-outline">
          Replay mission
        </button>
        <Link to="/missions" className="btn-primary">
          Back to missions <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
