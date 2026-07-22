// Reusable presentational components shared across pages.

export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}

const BADGE_COLORS = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-brand-100 text-brand-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
}

export function Badge({ color = 'slate', children, className = '' }) {
  return <span className={`badge ${BADGE_COLORS[color]} ${className}`}>{children}</span>
}

const DIFFICULTY = { Beginner: 'green', Intermediate: 'amber', Expert: 'red' }
export function DifficultyBadge({ level }) {
  return <Badge color={DIFFICULTY[level] || 'slate'}>{level}</Badge>
}

const TOPIC = {
  Cybersecurity: 'blue',
  'Data Privacy': 'violet',
  'Operational Risk': 'amber',
  'Responsible AI': 'green',
}
export function TopicBadge({ topic }) {
  return <Badge color={TOPIC[topic] || 'slate'}>{topic}</Badge>
}

export function ConfidenceBadge({ level }) {
  const map = { high: 'green', medium: 'amber', low: 'red' }
  return <Badge color={map[level] || 'slate'}>{level} confidence</Badge>
}

export function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300" />}
      <p className="font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}

// Minimal, safe text renderer: paragraphs, bullet lines and **bold**.
export function RichText({ text, className = '' }) {
  if (!text) return null
  const blocks = String(text).split(/\n{2,}/)
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const isList = lines.every((l) => /^\s*[-*•]/.test(l))
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*[-*•]\s?/, ''))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="leading-relaxed">
            {lines.map((l, j) => (
              <span key={j}>
                {renderInline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-brand-700">
          {p.slice(1, -1)}
        </code>
      )
    return <span key={i}>{p}</span>
  })
}
