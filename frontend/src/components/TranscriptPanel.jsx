import { useEffect, useState } from 'react'
import { api } from '../api'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function TranscriptPanel({ courseId, material, onSeek, pins = [], current = 0 }) {
  const [sections, setSections] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!material || material.type === 'PDF') return
    setSections(null)
    setError('')
    api(`/courses/${courseId}/materials/${material.id}/transcript`)
      .then((t) => setSections(t.sections))
      .catch((e) => setError(e.message))
  }, [courseId, material])

  if (!material || material.type === 'PDF') return <p className="muted">Select a video to see its transcript.</p>
  if (error) return <p className="error">{error}</p>
  if (!sections) return <p className="muted">Loading transcript…</p>

  // Save the transcript as a .txt file in the browser, no server needed
  function download() {
    const text = sections.map((s) => `[${fmt(s.start_seconds)}] ${s.text}`).join('\n\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${material.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>{sections.length} sections · click a time to jump</span>
        <button className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={download}>Download transcript</button>
      </div>
      {sections.map((s) => {
        const isCurrent = current >= s.start_seconds && current < s.end_seconds
        const asked = pins.some((p) => p >= s.start_seconds && p < s.end_seconds)
        return (
          <div key={s.start_seconds} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10,
                 background: isCurrent ? 'var(--mint-tint)' : 'transparent',
                 border: `1px solid ${isCurrent ? '#BFE3D6' : 'transparent'}` }}>
            <div style={{ flex: 'none' }}>
              <button className="chip" onClick={() => onSeek(s.start_seconds)}>▶ {fmt(s.start_seconds)}</button>
            </div>
            <div style={{ fontSize: 14, lineHeight: '21px' }}>
              {s.text}
              {asked && <div style={{ marginTop: 6 }}><span className="badge badge-mint">You asked about this</span></div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}