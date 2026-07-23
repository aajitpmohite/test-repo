// ESCAPE MISSIONS board — pick a locked room to break out of.
// Same data/logic as before (team-scoped list + server-saved progress); escape-room UI.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, LockOpen, DoorClosed, KeyRound, Timer, Trophy, ChevronRight, Plus,
  Flame, Puzzle, Skull, Fingerprint,
} from 'lucide-react';
import { apiGet } from '../api';
import { useAuth } from '../context/AuthContext';
import { EscapeRoom, Panel, Tag, ER, ROOM_COLOR } from '../components/escaperoom';

const DIFFICULTY = {
  Beginner: { label: 'EASY', color: ER.emerald },
  Intermediate: { label: 'TRICKY', color: ER.amber },
  Expert: { label: 'FIENDISH', color: ER.rust },
};

export default function Missions() {
  const { isAdmin, activeTeam } = useAuth();
  const [missions, setMissions] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/api/missions').then(setMissions).catch(() => setMissions([]));
  }, []);

  const escaped = missions ? missions.filter((m) => m.completed).length : 0;
  const total = missions ? missions.length : 0;

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
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {missions.map((m, i) => {
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
