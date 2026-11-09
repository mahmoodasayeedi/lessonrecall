import { CITATION } from './AnswerText'

const VOICE_LANG = {
  English: 'en-US', German: 'de-DE', Spanish: 'es-ES', French: 'fr-FR',
  Arabic: 'ar-SA', Urdu: 'ur-PK', Hindi: 'hi-IN',
}

export function speak(text, language, onEnd) {
  window.speechSynthesis.cancel()
  const clean = text.replace(CITATION, '').replace(/\s+/g, ' ').trim()   // don't read the links aloud
  const utterance = new SpeechSynthesisUtterance(clean)
  if (VOICE_LANG[language]) utterance.lang = VOICE_LANG[language]
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
}