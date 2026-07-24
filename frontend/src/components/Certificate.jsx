// Printable completion certificate, shown after escaping a room.
// Colours are hard-coded (navy + gold on cream) so it prints correctly regardless
// of the app's light/dark theme. The `.cert-print` sheet is the only thing that
// prints — see the @media print rules in index.css.
import { Award, Printer, X, ShieldCheck } from 'lucide-react';

const NAVY = '#1c3970';
const GOLD = '#b8942f';

export default function Certificate({ name, team, missionTitle, topic, grade, score, date, onClose }) {
  const issued = (date || new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const ref = `DBQ-${String(Math.abs(hashCode(`${name}${missionTitle}${issued}`)) % 1_000_000).padStart(6, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto bg-black/70 p-4 backdrop-blur-sm print:bg-white print:p-0">
      {/* Controls (not printed) */}
      <div className="print-hide absolute right-4 top-4 flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
        <button onClick={onClose} aria-label="Close certificate"
          className="flex items-center gap-2 rounded-md bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30">
          <X className="h-4 w-4" /> Close
        </button>
      </div>

      {/* The certificate sheet */}
      <div className="cert-print w-full max-w-3xl" style={{ aspectRatio: '1.414 / 1' }}>
        <div className="relative flex h-full flex-col items-center justify-center px-10 py-8 text-center"
          style={{
            background: 'linear-gradient(160deg, #fffdf6 0%, #fdf7e8 100%)',
            border: `2px solid ${NAVY}`,
            boxShadow: `inset 0 0 0 8px #fffdf6, inset 0 0 0 10px ${GOLD}`,
            color: NAVY,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
          {/* corner flourishes */}
          {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((pos) => (
            <span key={pos} className={`absolute ${pos} h-6 w-6`} style={{ borderColor: GOLD, borderWidth: 2, opacity: 0.6 }} />
          ))}

          <div className="flex items-center gap-2" style={{ color: GOLD }}>
            <ShieldCheck className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-[0.35em]">DB Quest AI</span>
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD }}>Certificate of Completion</p>
          <div className="mx-auto mt-2 h-px w-24" style={{ background: GOLD }} />

          <p className="mt-5 text-sm italic" style={{ color: '#5b6b86' }}>This certifies that</p>
          <p className="mt-1 text-3xl font-bold tracking-wide md:text-4xl" style={{ color: NAVY }}>{name || 'Team member'}</p>
          <p className="mt-1 text-sm" style={{ color: '#5b6b86' }}>of {team || 'the team'}</p>

          <p className="mt-4 max-w-xl text-sm leading-relaxed md:text-base" style={{ color: '#33415c' }}>
            has successfully completed the compliance escape mission
            <br />
            <span className="font-bold" style={{ color: NAVY }}>“{missionTitle}”</span>
            {topic ? <> in <span className="font-semibold">{topic}</span></> : null}
            {grade ? <>, earning the rating <span className="font-bold" style={{ color: GOLD }}>{grade}</span></> : null}
            {typeof score === 'number' ? <> with a score of <span className="font-bold">{score}/100</span></> : null}.
          </p>

          {/* gold seal */}
          <div className="mt-5 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `radial-gradient(circle at 50% 35%, #e9cf7a, ${GOLD})`, boxShadow: `0 0 0 3px #fffdf6, 0 0 0 5px ${GOLD}` }}>
              <Award className="h-8 w-8" style={{ color: '#fffdf6' }} />
            </div>
          </div>

          <div className="mt-5 flex w-full max-w-md items-end justify-between text-xs" style={{ color: '#5b6b86' }}>
            <div className="text-left">
              <p className="font-semibold" style={{ color: NAVY }}>{issued}</p>
              <div className="mt-0.5 w-28 border-t" style={{ borderColor: '#b9c2d4' }} />
              <p className="mt-0.5">Date issued</p>
            </div>
            <div className="text-right">
              <p className="font-semibold" style={{ color: NAVY }}>{ref}</p>
              <div className="mt-0.5 ml-auto w-28 border-t" style={{ borderColor: '#b9c2d4' }} />
              <p className="mt-0.5">Certificate ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}
