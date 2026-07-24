// Text-to-speech via the browser's Web Speech API (speechSynthesis).
// Built into modern browsers — no API key, no network, works offline. Used to read
// the Game Master's guidance and the mission briefing aloud for accessibility and
// a more immersive, narrated escape-room feel.

export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

// Strip markdown/emoji-image syntax the Game Master occasionally includes so the
// narrator reads clean prose instead of URLs and punctuation.
function clean(text) {
  return String(text || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // ![alt](url) image tags
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) links -> text
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Speak `text`, cancelling anything currently being spoken.
export function speak(text) {
  if (!speechSupported) return;
  const said = clean(text);
  if (!said) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(said);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}

// ---- Speech-to-text (dictation) via the Web Speech Recognition API ----
// Lets a player *talk* to the Game Master instead of typing. Chromium-based
// browsers support this (webkit-prefixed); unsupported browsers just hide the mic.
const Recognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export const recognitionSupported = Boolean(Recognition);

// Start listening. Calls onResult(transcript, isFinal) as speech is recognised,
// then onEnd() when it stops. Returns a handle with .stop() — or null if unsupported.
export function startDictation({ onResult, onEnd, onError } = {}) {
  if (!Recognition) return null;
  const rec = new Recognition();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
    const isFinal = event.results[event.results.length - 1].isFinal;
    onResult?.(transcript.trim(), isFinal);
  };
  rec.onerror = (event) => onError?.(event.error);
  rec.onend = () => onEnd?.();
  try {
    rec.start();
  } catch {
    return null;
  }
  return rec;
}
