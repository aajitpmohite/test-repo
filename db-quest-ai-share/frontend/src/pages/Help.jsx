// In-app "How it works" documentation for both admins and members.
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui';
import { HelpIcon, ShieldIcon, UploadIcon, ColleagueIcon, MissionIcon, ChartIcon, LockIcon } from '../components/icons';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-strong">{title}</h3>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-body">{children}</div>
    </div>
  );
}

export default function Help() {
  const { isAdmin } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="How DB Quest AI works"
        subtitle="A quick guide to the usage flow, roles, and what stays private."
        icon={<HelpIcon className="h-6 w-6" />}
      />

      <Section icon={ShieldIcon} title="The big idea">
        <p>
          DB Quest AI gives every team a private <b>AI Digital Colleague</b> (answers from your own documents) and a set
          of <b>AI Escape Missions</b> (compliance training as a game). All content is scoped to your team — you only
          ever see your team’s documents, missions, and results.
        </p>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={UploadIcon} title="1. Admins add knowledge">
          <p>Admins upload guides, runbooks and policies (.txt, .md, .csv) or paste text on the <b>Documents</b> page.</p>
          <p>Each document is split into chunks and indexed so it can be searched. Uploads are shared with the whole team.</p>
        </Section>
        <Section icon={ColleagueIcon} title="2. Members ask & learn">
          <p>On the <b>Ask</b> page, anyone can ask a question and get an answer grounded in the team’s documents, with clickable sources and a confidence level.</p>
          <p>Members can also generate a personal <b>onboarding</b> plan, look up <b>acronyms</b>, and find <b>experts</b>.</p>
        </Section>
        <Section icon={MissionIcon} title="3. Everyone plays missions">
          <p>Missions are two-part: <b>make a decision</b> on the left, and <b>investigate with the AI Game Master</b> on the right by asking questions like “Who really sent this?”.</p>
          <p>Finish to get a <b>private learning report</b>. Your score is stored privately and never shown to anyone as a ranking.</p>
        </Section>
        <Section icon={ChartIcon} title="4. Admins track progress">
          <p>The <b>Team Insights</b> page (admins only) shows aggregated, anonymized stats — e.g. “70% identified the red flag on the first try”.</p>
          <p>There are no individual scores or leaderboards, by design.</p>
        </Section>
      </div>

      <Section icon={LockIcon} title="Roles & privacy">
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Admin</b>: upload documents, create/assign missions, view team insights.</li>
          <li><b>Member</b>: ask questions, take onboarding, play missions.</li>
          <li>Mission answer keys never reach the browser — choices are graded on the server.</li>
          <li>Individual scores are private; only anonymized aggregates are shared with admins.</li>
        </ul>
        {isAdmin && (
          <p className="mt-2 rounded-lg border border-line bg-inset p-3 text-xs text-muted">
            You’re an admin on this team. Use <b>Documents → Upload</b> to power better answers, and <b>Create Mission</b> to add training.
          </p>
        )}
      </Section>

      <Section icon={ShieldIcon} title="Demo mode vs live mode">
        <p><b>Demo mode (default):</b> runs fully offline — no API keys. Uses a deterministic mock AI and keyword (TF-IDF) search. Perfect for trying everything instantly.</p>
        <p><b>Live mode:</b> set an AI provider + key in <code>backend/.env</code> to switch the Ask answers and mission generation to a real model, with embeddings-based search. The app falls back to the mock automatically if the model is unavailable.</p>
      </Section>
    </div>
  );
}
