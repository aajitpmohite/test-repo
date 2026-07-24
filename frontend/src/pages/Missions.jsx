// ESCAPE MISSIONS board — pick a locked room to break out of.
// Same data/logic as before (team-scoped list + server-saved progress); escape-room UI.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, LockOpen, DoorClosed, KeyRound, Timer, Trophy, ChevronRight, Plus,
  Flame, Puzzle, Skull, Fingerprint, Search, SlidersHorizontal, ArrowDownUp, X,
} from 'lucide-react';
import { apiGet } from '../api';
import { useAuth } from '../context/AuthContext';
import { EscapeRoom, Panel, Tag, ER, ROOM_COLOR } from '../components/escaperoom';

const DIFFICULTY = {
  Beginner: { label: 'EASY', color: ER.emerald },
  Intermediate: { label: 'TRICKY', color: ER.amber },
  Expert: { label: 'FIENDISH', color: ER.rust },
};
const TOPICS = ['Cybersecurity', 'Data Privacy', 'Operational Risk', 'Responsible AI'];
const DIFF_ORDER = { Beginner: 0, Intermediate: 1, Expert: 2 };
const SORTS = {
  default: { label: 'Newest', fn: (a, b, ai, bi) => ai - bi },
  points: { label: 'Most keys', fn: (a, b) => (b.points || 0) - (a.points || 0) },
  time: { label: 'Quickest', fn: (a, b) => (a.estimatedMinutes || 0) - (b.estimatedMinutes || 0) },
  difficulty: { label: 'Hardest', fn: (a, b) => (DIFF_ORDER[b.difficulty] ?? 0) - (DIFF_ORDER[a.difficulty] ?? 0) },
  title: { label: 'A → Z', fn: (a, b) => (a.title || '').localeCompare(b.title || '') },
};

// Escape-room styled control.
const erSelect = 'rounded-md border border-white/10 bg-black/40 px-2.5 py-2 font-type text-xs uppercase tracking-wider text-stone-200 outline-none transition focus:border-amber-400/50';

export default function Missions() {
  const { isAdmin, activeTeam } = useAuth();
  const [missions, setMissions] = useState(null);
  const [query, setQuery] = useState('');
  const [topicF, setTopicF] = useState('all');
  const [diffF, setDiffF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [sort, setSort] = useState('default');
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/api/missions').then(setMissions).catch(() => setMissions([]));
  }, []);

  const escaped = missions ? missions.filter((m) => m.completed).length : 0;
  const total = missions ? missions.length : 0;

  const filtered = useMemo(() => {
    if (!missions) return [];
    const q = query.trim().toLowerCase();
    const withIndex = missions.map((m, i) => [m, i]);
    return withIndex
      .filter(([m]) => {
        if (topicF !== 'all' && m.topic !== topicF) return false;
        if (diffF !== 'all' && m.difficulty !== diffF) return false;
        if (statusF === 'escaped' && !m.completed) return false;
        if (statusF === 'locked' && m.completed) return false;
        if (q && !(`${m.title} ${m.summary} ${m.topic}`.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => SORTS[sort].fn(a[0], b[0], a[1], b[1]))
      .map(([m]) => m);
  }, [missions, query, topicF, diffF, statusF, sort]);

  const filtersActive = query || topicF !== 'all' || diffF !== 'all' || statusF !== 'all' || sort !== 'default';
  const clearFilters = () => { setQuery(''); setTopicF('all'); setDiffF('all'); setStatusF('all'); setSort('default'); };

  return (
    <EscapeRoom>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag color={ER.amber}><Flame className="mr-1 h-3 w-3" /> {activeTeam?.name || 'YOUR TEAM'}</Tag>
            <Tag color={ER.teal}>{total} ROOMS</Tag>
          </div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
            Escape Missions
          </h1>
          <p className="mt-1 font-type text-xs text-stone-400">
            Every room is a real compliance trap. Read the clues, pick the right move, and escape before it costs you.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/missions/generate')}
            className="clue-frame group flex items-center gap-2 rounded-md px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider text-amber-300 transition hover:bg-amber-400/10">
            <Plus className="h-4 w-4" /> Build a room
          </button>
        )}
      </div>

      {/* Progress ribbon */}
      <Panel className="mb-6 flex flex-wrap items-center gap-4 px-5 py-3" glow={ER.amber}>
        <KeyRound className="h-5 w-5 text-amber-300" />
        <div className="flex-1">
          <p className="stamp-label text-stone-500">ROOMS ESCAPED</p>
          <p className="font-display text-lg font-semibold text-white">
            {escaped} <span className="text-stone-600">/</span> {total}
          </p>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-black/50 sm:w-64">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ER.amber}, ${ER.ember})` }}
            initial={{ width: 0 }} animate={{ width: `${total ? (escaped / total) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </Panel>

      {/* Filter / search / sort toolbar */}
      {missions !== null && missions.length > 0 && (
        <Panel className="mb-5 flex flex-wrap items-center gap-2.5 px-4 py-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rooms…"
              aria-label="Search missions"
              className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-stone-100 outline-none transition focus:border-amber-400/50 placeholder:text-stone-600"
            />
          </div>
          <div className="flex items-center gap-1.5 text-stone-500">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <select className={erSelect} value={topicF} onChange={(e) => setTopicF(e.target.value)} aria-label="Filter by topic">
            <option value="all">All topics</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={erSelect} value={diffF} onChange={(e) => setDiffF(e.target.value)} aria-label="Filter by difficulty">
            <option value="all">All levels</option>
            {Object.keys(DIFFICULTY).map((d) => <option key={d} value={d}>{DIFFICULTY[d].label}</option>)}
          </select>
          <select className={erSelect} value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status">
            <option value="all">Any status</option>
            <option value="locked">Locked</option>
            <option value="escaped">Escaped</option>
          </select>
          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="h-4 w-4 text-stone-500" />
            <select className={erSelect} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort missions">
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {filtersActive && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-2 font-type text-[11px] uppercase tracking-wider text-stone-400 transition hover:border-rose-400/40 hover:text-rose-300">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <span className="ml-auto font-type text-[11px] uppercase tracking-wider text-stone-500">
            {filtered.length} / {total} rooms
          </span>
        </Panel>
      )}

      {/* Rooms */}
      {missions === null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Panel key={i} className="h-44 animate-pulse" />)}
        </div>
      ) : missions.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-16 text-center">
          <DoorClosed className="h-10 w-10 text-stone-600" />
          <p className="font-display text-xl uppercase tracking-wide text-white">No rooms yet</p>
          <p className="max-w-sm font-type text-xs text-stone-500">
            {isAdmin ? 'Build a room to start training your team.' : 'No escape rooms have been set up for this team yet.'}
          </p>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="h-10 w-10 text-stone-600" />
          <p className="font-display text-xl uppercase tracking-wide text-white">No rooms match</p>
          <p className="max-w-sm font-type text-xs text-stone-500">Try a different search or clear the filters.</p>
          <button onClick={clearFilters}
            className="clue-frame mt-1 rounded-md px-4 py-2 font-display text-sm uppercase tracking-wider text-amber-300 hover:bg-amber-400/10">
            Clear filters
          </button>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((m, i) => {
            const diff = DIFFICULTY[m.difficulty] || DIFFICULTY.Beginner;
            const door = ROOM_COLOR[m.topic] || ER.amber;
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}>
                <Panel className="group relative flex h-full flex-col p-5" glow={door}>
                  {/* room number, like a door plate */}
                  <span className="pointer-events-none absolute right-4 top-2 font-display text-6xl font-bold text-white/[0.05]">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="mb-3 flex items-center justify-between">
                    <Tag color={door}>{m.topic}</Tag>
                    <span className="stamp-label flex items-center gap-1.5" style={{ color: diff.color }}>
                      <Skull className="h-3.5 w-3.5" /> {diff.label}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
                      style={{ borderColor: `${m.completed ? ER.emerald : door}55`, background: `${m.completed ? ER.emerald : door}12` }}>
                      {m.completed
                        ? <LockOpen className="h-5 w-5" style={{ color: ER.emerald }} />
                        : <Lock className="h-5 w-5" style={{ color: door }} />}
                    </div>
                    <div>
                      <p className="stamp-label text-stone-500">THE ROOM</p>
                      <h3 className="font-display text-2xl font-bold uppercase leading-none tracking-wide text-white">{m.title}</h3>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-400">{m.summary}</p>

                  {/* facts row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 font-type text-xs">
                    <div><p className="text-stone-500">TIME</p><p className="flex items-center gap-1 text-stone-200"><Timer className="h-3 w-3" />{m.estimatedMinutes}m</p></div>
                    <div><p className="text-stone-500">KEYS</p><p className="flex items-center gap-1 text-stone-200"><KeyRound className="h-3 w-3" />{m.points}</p></div>
                    <div><p className="text-stone-500">STATUS</p>
                      {m.completed
                        ? <p className="flex items-center gap-1 text-emerald-400"><LockOpen className="h-3 w-3" />ESCAPED</p>
                        : <p className="flex items-center gap-1 text-amber-400"><Lock className="h-3 w-3" />LOCKED</p>}
                    </div>
                  </div>

                  <button onClick={() => navigate(`/missions/play/${m.id}`)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-md border py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition"
                    style={{ borderColor: `${door}55`, background: `${door}16` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${door}2a`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${door}16`)}>
                    <Puzzle className="h-4 w-4" />
                    {m.completed ? 'Re-enter room' : 'Enter room'}
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                </Panel>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 font-type text-[11px] text-stone-600">
        <Lock className="h-3 w-3" /> <Fingerprint className="h-3 w-3" /> Your results stay private. Only anonymized team stats are ever shared — no leaderboards.
      </p>
    </EscapeRoom>
  );
}
