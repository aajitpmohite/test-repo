// Sign-in / sign-up screen. Shown whenever there is no authenticated user.
// Includes a one-click "Continue as demo" (SSO stub) that logs into the seeded team.
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldIcon, SparkIcon, BoltIcon, ArrowRightIcon, LockIcon } from '../components/icons';
import { Spinner } from '../components/ui';

export default function Login() {
  const { login, register, demo } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [busy, setBusy] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy('form');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({ email: email.trim(), password, fullName: fullName.trim(), teamName: teamName.trim() || null });
        toast.success('Workspace created — welcome aboard!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function continueAsDemo() {
    setBusy('demo');
    try {
      await demo();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand / value panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600/30 via-card to-app p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:32px_32px] opacity-40" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-strong">DB Quest AI</p>
            <p className="text-xs uppercase tracking-[0.18em] text-faint">Secure · Guided · Intelligent</p>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight text-strong">
            Your team's AI colleague &<br />
            <span className="text-gradient">compliance training arena.</span>
          </h1>
          <div className="mt-8 space-y-4">
            {[
              { icon: SparkIcon, t: 'Answers from your team’s own documents', d: 'Grounded, cited, and private to your workspace.' },
              { icon: BoltIcon, t: 'Escape-room compliance missions', d: 'Learn by doing, coached by an AI Game Master.' },
              { icon: LockIcon, t: 'Private by design', d: 'Scores stay private; only anonymized team insights are shared.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-strong">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-faint">Runs offline in demo mode with no API keys — or connect an AI provider for live answers.</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-strong">DB Quest AI</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-strong">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
          <p className="mt-1 text-sm text-muted">
            {mode === 'login' ? 'Sign in to your team workspace.' : 'Start a new team — you’ll be its admin.'}
          </p>

          <button
            onClick={continueAsDemo}
            disabled={busy !== ''}
            className="btn-primary mt-6 w-full"
          >
            {busy === 'demo' ? <Spinner className="h-4 w-4" /> : <BoltIcon className="h-4 w-4" />}
            Continue as demo user
          </button>
          <p className="mt-2 text-center text-xs text-faint">Instant access to a pre-loaded team (admin role).</p>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-faint">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Morgan" autoComplete="name" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="teamName">Team name <span className="font-normal normal-case text-faint">(optional)</span></label>
                <input id="teamName" className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Acme Payments" />
              </div>
            )}
            <button type="submit" disabled={busy !== ''} className="btn-outline w-full">
              {busy === 'form' ? <Spinner className="h-4 w-4" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create workspace'}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? "Don't have a workspace?" : 'Already have an account?'}{' '}
            <button
              className="font-semibold text-accent hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
