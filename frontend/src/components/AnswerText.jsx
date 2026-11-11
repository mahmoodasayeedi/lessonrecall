import { useState } from 'react'

// Finds "(10:17, https://www.youtube.com/watch?v=ID&t=617s)" and "(page 6)" in the answer
export const CITATION = /\(\s*(?:CITE AS:\s*)?(\d+:\d{2}(?::\d{2})?),\s*https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&t=(\d+)s\s*\)|\(\s*(?:CITE AS:\s*)?page (\d+)\s*\)/g

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

// ▶ chip that plays the video on click and shows the transcript text behind it on hover / keyboard focus
function CitationChip({ videoId, seconds, label, onPlay, peek }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState(null)      // { title, text } | 'error' | null (loading)

  function show() {
    console.log('peek?', typeof peek)
    setOpen(true)
    if (!peek || source) return
    peek(videoId, seconds)
      .then((s) => setSource(s ?? 'error'))
      .catch(() => setSource('error'))
  }

  const snippet = source && source !== 'error'
    ? (source.text.length > 280 ? source.text.slice(0, 280) + '…' : source.text)
    : null

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
          onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button className="chip" onClick={() => onPlay(seconds, videoId)} onFocus={show} onBlur={() => setOpen(false)}
              aria-label={`Play video at ${label}`}>▶ {label}</button>
      {open && peek && (
        <span role="tooltip"
          style={{ position: 'absolute', left: 0, bottom: 'calc(100% + 8px)', zIndex: 20, width: 320, display: 'grid', gap: 6,
                   padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
                   boxShadow: '0 10px 28px rgba(42,27,74,.16)', whiteSpace: 'normal', fontSize: 13, lineHeight: 1.5,
                   color: 'var(--ink)', textAlign: 'left' }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mint)' }}>
            Source · {label}
          </span>
          {source === null && <span className="muted">Loading the transcript…</span>}
          {source === 'error' && <span className="muted">Source text not available.</span>}
          {snippet && (
            <>
              <span style={{ fontWeight: 600 }}>{source.title}</span>
              <span className="muted">“{snippet}”</span>
            </>
          )}
        </span>
      )}
    </span>
  )
}

export default function AnswerText({ text: raw, onPlay, peek }) {
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
        <CitationChip key={`c${m.index}`} videoId={videoId} seconds={s} label={label} onPlay={onPlay} peek={peek} />)
    } else {
      parts.push(<span key={`p${m.index}`} className="chip chip-outline">page {m[4]}</span>)
    }
    last = m.index + m[0].length
  }
  parts.push(...withBold(text.slice(last), `t${last}`))
  return <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: '23px' }}>{parts}</div>
}