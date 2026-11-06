// Finds "(10:17, https://www.youtube.com/watch?v=ID&t=617s)" and "(page 6)" in the answer
const CITATION = /\((\d+:\d{2}(?::\d{2})?),\s*https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&t=(\d+)s\)|\(page (\d+)\)/g

export function analyse(text) {
  const videos = new Set(), pages = new Set()
  for (const m of text.matchAll(CITATION)) {
    if (m[2]) videos.add(`${m[2]}-${m[3]}`)
    else pages.add(m[4])
  }
  const notCovered = videos.size + pages.size === 0 && /(not cover|doesn't cover|does not cover|not covered)/i.test(text)
  return { sources: videos.size + pages.size, hasVideo: videos.size > 0, hasPdf: pages.size > 0, notCovered }
}

// **bold** → <b>
function withBold(text, keyPrefix) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={`${keyPrefix}-${i}`}>{part}</b> : part))
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