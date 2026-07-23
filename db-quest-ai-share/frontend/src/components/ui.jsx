import { CheckIcon } from './icons';

export function Spinner({ className = 'h-5 w-5' }) {
  return <div className={`${className} animate-spin rounded-full border-2 border-line border-t-brand-400`} />;
}

export function Badge({ children, className = '' }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

const difficultyStyles = {
  Beginner: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  Intermediate: 'border-sky-400/25 bg-sky-400/10 text-sky-600 dark:text-sky-300',
  Expert: 'border-amber-400/25 bg-amber-400/10 text-amber-600 dark:text-amber-300',
};

export function DifficultyBadge({ difficulty }) {
  const style = difficultyStyles[difficulty] || difficultyStyles.Beginner;
  return <span className={`badge ${style}`}>{difficulty}</span>;
}

const topicStyles = {
  Cybersecurity: 'border-rose-400/25 bg-rose-400/10 text-rose-600 dark:text-rose-300',
  'Data Privacy': 'border-violet-400/25 bg-violet-400/10 text-violet-600 dark:text-violet-300',
  'Operational Risk': 'border-amber-400/25 bg-amber-400/10 text-amber-600 dark:text-amber-300',
  'Responsible AI': 'border-teal-400/25 bg-teal-400/10 text-teal-600 dark:text-teal-300',
};

export function TopicBadge({ topic }) {
  const style = topicStyles[topic] || 'border-brand-400/25 bg-brand-500/10 text-accent';
  return <span className={`badge ${style}`}>{topic}</span>;
}

const confidenceStyles = {
  high: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  medium: 'border-amber-400/25 bg-amber-400/10 text-amber-600 dark:text-amber-300',
  low: 'border-slate-400/25 bg-slate-400/10 text-body',
};

export function ConfidenceBadge({ confidence }) {
  const style = confidenceStyles[confidence] || confidenceStyles.low;
  return (
    <span className={`badge ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {confidence} confidence
    </span>
  );
}

export function PageHeader({ title, subtitle, eyebrow, icon, children }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-500/25 bg-brand-500/10 text-accent sm:flex">
            {icon}
          </div>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-bold text-strong md:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, icon, hint }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      {icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-accent">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
        <p className="text-2xl font-bold text-strong">{value}</p>
        {hint ? <p className="text-xs text-faint">{hint}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, text, icon }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-elevated text-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-strong">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}

export function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-body">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}

export function SectionTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-strong ${className}`}>{children}</h3>;
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />;
}

export function RichText({ text }) {
  if (!text) return null;
  return <div className="space-y-2 text-sm leading-7 text-body">{text}</div>;
}
