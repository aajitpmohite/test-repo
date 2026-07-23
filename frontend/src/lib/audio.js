// Escape-room sound effects, synthesized with the Web Audio API.
// No audio files are bundled — every effect is generated from oscillators, so it
// works fully offline and adds zero assets. Effects fire after a user gesture
// (button clicks), so the AudioContext resumes cleanly under browser autoplay rules.

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const MUTE_KEY = 'dbquest_sfx_muted';
export function isMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}
export function setMuted(muted) {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
}

// One shaped tone: fades in fast, out over `dur`, optionally gliding in pitch.
function tone(ac, { freq, start = 0, dur = 0.2, type = 'sine', gain = 0.18, slideTo }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// name: 'unlock' | 'lock' | 'door' | 'escape'
export function playSound(name) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  switch (name) {
    case 'unlock': // bright rising chime — the lock pops open
      tone(ac, { freq: 660, start: 0, dur: 0.12, type: 'triangle', gain: 0.16 });
      tone(ac, { freq: 880, start: 0.09, dur: 0.16, type: 'triangle', gain: 0.18 });
      tone(ac, { freq: 1320, start: 0.2, dur: 0.28, type: 'sine', gain: 0.14 });
      break;
    case 'lock': // low buzzer thunk — wrong key
      tone(ac, { freq: 200, start: 0, dur: 0.2, type: 'sawtooth', gain: 0.16, slideTo: 80 });
      tone(ac, { freq: 130, start: 0.13, dur: 0.18, type: 'square', gain: 0.1, slideTo: 60 });
      break;
    case 'door': // low-to-high sweep — the door swings open
      tone(ac, { freq: 120, start: 0, dur: 0.5, type: 'sine', gain: 0.14, slideTo: 520 });
      break;
    case 'escape': { // victory arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(ac, { freq: f, start: i * 0.11, dur: 0.24, type: 'triangle', gain: 0.16 }));
      break;
    }
    default:
      break;
  }
}
