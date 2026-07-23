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
