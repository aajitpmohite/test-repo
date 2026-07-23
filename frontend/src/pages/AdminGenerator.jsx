import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';
import { useToast } from '../context/ToastContext';
import { PageHeader, Spinner, EmptyState, DifficultyBadge, TopicBadge } from '../components/ui';
import { GenerateIcon, SparkIcon, ArrowRightIcon, AlertIcon, BookIcon } from '../components/icons';

const topics = ['Cybersecurity', 'Data Privacy', 'Operational Risk', 'Responsible AI'];
const difficulties = ['Beginner', 'Intermediate', 'Expert'];

export default function AdminGenerator() {
  const toast = useToast();
  const [topic, setTopic] = useState('Cybersecurity');
  const [audience, setAudience] = useState('team member');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function generate(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const result = await apiPost('/api/missions/generate', { topic, audience, difficulty });
      setMission(result);
      toast.success('Mission created and saved to your team.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Escape Missions"
        title="Mission Generator"
        subtitle="Spin up a fresh three-step compliance scenario on demand — preview it, then play it immediately."
        icon={<GenerateIcon className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={generate} className="card h-fit space-y-4">
          <div>
            <label className="label">Topic</label>
            <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Audience</label>
            <input
              className="input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. new analysts"
            />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {difficulties.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
            {loading ? 'Generating…' : 'Generate mission'}
          </button>
          <p className="text-xs leading-relaxed text-faint">
            In offline mode this uses deterministic archetypes keyed off your topic. With a live provider configured, it
            calls the model and coerces the result into the mission schema.
          </p>
        </form>

        <div>
          {loading ? (
            <div className="card flex items-center justify-center gap-3 py-24 text-muted">
              <Spinner /> Building your mission…
            </div>
          ) : mission ? (
            <div className="card animate-fade-in space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-strong">{mission.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{mission.summary}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <TopicBadge topic={mission.topic} />
                <DifficultyBadge difficulty={mission.difficulty} />
                <span className="badge">{mission.points} pts</span>
                <span className="badge border-brand-400/25 bg-brand-500/10 text-accent">AI generated</span>
              </div>

              <div className="divider" />

              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">Steps</p>
                {mission.steps.map((step, i) => (
                  <div key={step.id} className="surface-inset">
                    <p className="flex items-center gap-2 font-medium text-strong">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-500/20 text-[10px] font-bold text-accent">
                        {i + 1}
                      </span>
                      {step.prompt}
                    </p>
                    <p className="mt-1.5 flex items-start gap-2 text-sm text-muted">
                      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
                      {step.clue}
                    </p>
                  </div>
                ))}
              </div>

              {mission.learningPoints?.length ? (
                <div className="surface-inset">
                  <p className="flex items-center gap-2 font-semibold text-strong">
                    <BookIcon className="h-4 w-4 text-accent" /> Learning points
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {mission.learningPoints.map((lp) => (
                      <li key={lp}>• {lp}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button className="btn-primary" onClick={() => navigate(`/missions/play/${mission.id}`)}>
                Play this mission <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <EmptyState
              title="No mission generated yet"
              text="Choose a topic, audience, and difficulty, then generate to preview the steps and learning points."
              icon={<GenerateIcon className="h-6 w-6" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
