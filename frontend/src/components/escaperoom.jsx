// Escape-room theme primitives used ONLY by the mission zone.
// Warm, dim, atmospheric — a room lit by a single overhead lamp. Explicit dark
// palette so the look is identical regardless of the app's light/dark theme.
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export const ER = {
  amber: '#f59e0b',
  gold: '#fbbf24',
  ember: '#fb923c',
  emerald: '#34d399',
  teal: '#2dd4bf',
  rust: '#ef4444',
  paper: '#e7e5e4',
};

// Topic -> door/accent colour.
export const ROOM_COLOR = {
  Cybersecurity: '#ef4444',
  'Data Privacy': '#a78bfa',
  'Operational Risk': '#f59e0b',
  'Responsible AI': '#2dd4bf',
};

// Full-bleed dim room: warm lamp glow up top, paper grain, heavy vignette.
export function EscapeRoom({ children, className = '' }) {
  return (
    <div className={`escape er-bg er-grain er-vignette relative -mx-4 -my-6 min-h-[calc(100vh-3.5rem)] overflow-hidden px-4 py-6 md:-mx-8 md:-my-8 md:px-8 md:py-8 ${className}`}>
      {/* hanging lamp cone */}
      <div className="er-lamp pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2"
        style={{ background: 'radial-gradient(50% 60% at 50% 0%, rgba(245,158,11,0.18), transparent 70%)' }} />
      <div className="relative z-10 mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

// Aged panel with warm corner rivets.
export function Panel({ children, className = '', glow, as = 'div' }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp className={`clue-frame rounded-lg ${className}`}
      style={glow ? { boxShadow: `inset 0 0 40px rgba(0,0,0,0.4), 0 0 0 1px ${glow}22, 0 0 44px -14px ${glow}88` } : undefined}>
      {children}
    </Comp>
  );
}

// Typewriter "stamp" tag.
export function Tag({ children, color = ER.amber, className = '' }) {
  return (
    <span className={`stamp-label inline-flex items-center gap-1.5 rounded border px-2 py-1 ${className}`}
      style={{ color, borderColor: `${color}55`, background: `${color}12` }}>
      {children}
    </span>
  );
}

// Animated count-up number (fires when scrolled into view).
export function CountUp({ to = 0, duration = 1.4, className = '', style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} className={className} style={style}>{val}</span>;
}
