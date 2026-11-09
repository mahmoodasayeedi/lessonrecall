import { CITATION } from './AnswerText'

export const VOICE_LANG = {
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
export function createRecognizer({ language, onText, onEnd, onError }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Recognition) return null                                   // Firefox / unsupported
  const recognizer = new Recognition()
  recognizer.lang = VOICE_LANG[language] || navigator.language || 'en-US'
  recognizer.interimResults = true                                // show words while speaking
  recognizer.continuous = false                                   // stop after one sentence/pause
  recognizer.onresult = (e) => {
    const text = Array.from(e.results).map((r) => r[0].transcript).join('')
    onText(text)
  }
  recognizer.onend = onEnd
  recognizer.onerror = (e) => onError(e.error)
  return recognizer
}