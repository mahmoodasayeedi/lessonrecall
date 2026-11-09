// Finds "(10:17, https://www.youtube.com/watch?v=ID&t=617s)" and "(page 6)" in the answer
const CITATION = /\(\s*(?:CITE AS:\s*)?(\d+:\d{2}(?::\d{2})?),\s*https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&t=(\d+)s\s*\)|\(\s*(?:CITE AS:\s*)?page (\d+)\s*\)/g

export function analyse(text) {
  const videoMoments = new Set()
  const pdfPages = new Set()
  for (const m of text.matchAll(CITATION)) {
    if (m[2]) videoMoments.add(`${m[2]}-${m[3]}`)   // videoId + seconds
    else if (m[4]) pdfPages.add(m[4])              // page number
  }
  const sources = videoMoments.size + pdfPages.size
  return {
    sources,
    hasVideo: videoMoments.size > 0,
    hasPdf: pdfPages.size > 0,
    // works in every language: no citation and just one short sentence = "not covered"
    notCovered: sources === 0 && text.trim().length < 160,
  }
}

// **bold** → <b>
function withBold(text, keyPrefix) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={`${keyPrefix}-${i}`}>{part}</b> : part))
}
// All video moments cited in a text: [{ videoId, seconds }]
export function citedMoments(text) {
  return [...text.matchAll(CITATION)].filter((m) => m[2]).map((m) => ({ videoId: m[2], seconds: Number(m[3]) }))
}

export default function AnswerText({  text: raw, onPlay}) {
  const text = raw.replace(/CITE AS:\s*/g, '')
  const parts = []
  let last = 0
  for (const m of text.matchAll(CITATION)) {
    parts.push(...withBold(text.slice(last, m.index), `t${last}`))
    if (m[2]) {
      const [, , videoId, seconds] = m
      const s = Number(seconds)
      const label = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

      parts.push(
        <button key={`c${m.index}`} className="chip" onClick={() => onPlay(Number(seconds), videoId)}
                aria-label={`Play video at ${label}`}>▶ {label}</button>)
    } else {
      parts.push(<span key={`p${m.index}`} className="chip chip-outline">page {m[4]}</span>)
    }
    last = m.index + m[0].length
  }
  parts.push(...withBold(text.slice(last), `t${last}`))
  return <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: '23px' }}>{parts}</div>
}
