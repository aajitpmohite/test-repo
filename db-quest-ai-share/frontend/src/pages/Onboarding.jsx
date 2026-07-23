import { useState } from 'react';
import { apiPost } from '../api';
import { PageHeader, Spinner, EmptyState } from '../components/ui';
import { OnboardingIcon, ExpertIcon, BookIcon, ArrowRightIcon } from '../components/icons';

export default function Onboarding() {
  const [role, setRole] = useState('Developer');
  const [project, setProject] = useState('DB Quest AI');
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generatePlan(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const result = await apiPost('/api/colleague/onboarding', { role, project, days });
      setPlan(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital Colleague"
        title="Onboarding Planner"
        subtitle="Generate a day-by-day ramp-up plan with tasks, resources, key contacts, and a starter glossary."
        icon={<OnboardingIcon className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={generatePlan} className="card h-fit space-y-4">
          <div>
            <label className="label">Role</label>
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer" />
          </div>
          <div>
            <label className="label">Project</label>
            <input className="input" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Payments Platform" />
          </div>
          <div>
            <label className="label">Duration (days)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="30"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <OnboardingIcon className="h-4 w-4" />}
            {loading ? 'Planning…' : 'Generate plan'}
          </button>
        </form>

        <div className="space-y-4">
          {!plan ? (
            <EmptyState
              title="No plan yet"
              text="Fill in a role, project, and duration to receive a structured onboarding journey."
              icon={<OnboardingIcon className="h-6 w-6" />}
            />
          ) : (
            <>
              <div className="card">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Onboarding journey</p>
                <h3 className="mt-1 text-xl font-bold text-strong">
                  {plan.role} · {plan.project}
                </h3>
                <p className="mt-1 text-sm text-muted">{plan.plan.length}-day structured ramp-up</p>
              </div>

              {/* Timeline */}
              <div className="relative space-y-3 pl-6">
                <div className="absolute bottom-2 left-[9px] top-2 w-px bg-gradient-to-b from-brand-500/60 to-white/5" />
                {plan.plan.map((day) => (
                  <div key={day.day} className="relative">
                    <div className="absolute -left-[19px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-500 bg-inset">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center gap-2">
                        <span className="badge border-brand-400/25 bg-brand-500/10 text-accent">Day {day.day}</span>
                        <p className="font-semibold text-strong">{day.title}</p>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {day.tasks.map((task) => (
                          <li key={task} className="flex items-start gap-2 text-sm text-body">
                            <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            {task}
                          </li>
                        ))}
                      </ul>
                      {day.resources?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {day.resources.map((r) => (
                            <span key={r} className="badge">
                              <BookIcon className="h-3 w-3" /> {r}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="card">
                  <p className="flex items-center gap-2 font-semibold text-strong">
                    <ExpertIcon className="h-5 w-5 text-accent" /> Key contacts
                  </p>
                  <ul className="mt-3 space-y-2">
                    {plan.keyContacts.map((contact) => (
                      <li key={contact.name} className="text-sm">
                        <span className="font-medium text-body">{contact.name}</span>
                        <span className="text-faint"> — {contact.contact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <p className="flex items-center gap-2 font-semibold text-strong">
                    <BookIcon className="h-5 w-5 text-accent" /> Glossary
                  </p>
                  <ul className="mt-3 space-y-2">
                    {plan.glossary.map((item) => (
                      <li key={item.term} className="text-sm">
                        <span className="font-semibold text-accent">{item.term}</span>
                        <span className="text-muted"> — {item.meaning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
