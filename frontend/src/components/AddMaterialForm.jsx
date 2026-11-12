import { useState } from 'react'
import { api } from '../api'
import DropZone from './DropZone'

export default function AddMaterialForm({ courseId, onAdded }) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)        // { type: 'error' | 'ok', text }
  const VIDEO_LANGUAGES = [
  ['', 'Auto-detect'], ['en', 'English'], ['de', 'German'], ['es', 'Spanish'],
  ['fr', 'French'], ['ar', 'Arabic'], ['ur', 'Urdu'], ['hi', 'Hindi'],
]
const [language, setLanguage] = useState('')
const [check, setCheck] = useState(null)
const [checking, setChecking] = useState(false)

  function checkVideo() {
    if (!url.trim()) return
    setChecking(true)
    setCheck(null)
    setMessage(null)
    api('/lesson-check', { method: 'POST', body: { url } })
      .then(setCheck)
      .catch((err) => setMessage({ type: 'error', text: err.message }))
      .finally(() => setChecking(false))
  }
  async function run(request) {
    setBusy(true)
    setMessage(null)
    try {
      const m = await request()
      setMessage(m.status === 'READY'
        ? { type: 'ok', text: `Added “${m.title}” (${m.chunkCount} chunks).` }
        : { type: 'error', text: m.errorMessage || 'Processing failed.' })
      onAdded()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  function addYoutube(e) {
    e.preventDefault()
    run(() => api(`/courses/${courseId}/materials/youtube`, { method: 'POST', body: { url, language: language || null } })).then(() => setUrl(''))
  }

  function upload(e) {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    if (language) form.append('language', language)
    run(() => api(`/courses/${courseId}/materials/upload`, { method: 'POST', form })).then(() => setFile(null))
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20 }}>Add material</h2>
      <label className="label">Language spoken in the video
  <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
    {VIDEO_LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
  </select>
</label>

      <form onSubmit={addYoutube} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="label" htmlFor="yt" style={{ width: '100%', marginBottom: 0 }}>YouTube link</label>
        <input id="yt" className="input" style={{ flex: '1 1 260px' }} placeholder="https://www.youtube.com/watch?v=…"
               value={url} onChange={(e) => { setUrl(e.target.value); setCheck(null) }} required disabled={busy} />
        <button type="button" className="btn" onClick={checkVideo} disabled={busy || checking || !url.trim()}>
          {checking ? 'Checking…' : '🔍 Check video'}
        </button>
        <button className="btn btn-primary" disabled={busy}>Add video</button>
      </form>

      {check && <LessonCheckCard check={check} />}

      <form onSubmit={upload} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="label" htmlFor="file" style={{ width: '100%', marginBottom: 0 }}>Or upload MP4, MP3 or PDF (max 25 MB)</label>
  <DropZone file={file} onFile={setFile} accept=".mp4,.mp3,.m4a,.wav,.pdf" disabled={busy} />
        <button className="btn" disabled={busy || !file}>Upload</button>
      </form>

      {busy && <div className="muted" role="status">Processing… transcribing and indexing can take up to a minute.</div>}
      {message && <div role="alert" style={{ color: message.type === 'ok' ? 'var(--mint)' : 'var(--rose)', fontSize: 14 }}>{message.text}</div>}
    </div>
  )
}

function LessonCheckCard({ check }) {
  const stars = '★'.repeat(check.score) + '☆'.repeat(5 - check.score)
  const criteria = [['Clarity', check.criteria.clarity], ['Structure', check.criteria.structure],
                    ['Examples', check.criteria.examples], ['Depth', check.criteria.depth]]
  return (
    <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <strong>{check.title}</strong>
        <span style={{ display: 'flex', gap: 6 }}>
          <span className="badge badge-mint">{check.level}</span>
          <span className="badge badge-soft">{check.minutes} min</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span aria-label={`${check.score} out of 5`} style={{ fontSize: 22, color: '#C98A1A', letterSpacing: 2 }}>{stars}</span>
        <span style={{ fontSize: 14 }}>{check.verdict}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {criteria.map(([label, value]) => (
          <div key={label} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            <span className="muted">{label} · {value}/5</span>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--soft)', overflow: 'hidden' }}>
              <div style={{ width: `${value * 20}%`, height: '100%', background: 'var(--mint)' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 14 }}><b>Teaches:</b> {check.topics.join(' · ')}</div>
      {check.strengths.length > 0 && <div style={{ fontSize: 14 }}>✓ {check.strengths.join(' · ')}</div>}
      {check.weaknesses.length > 0 && <div className="muted" style={{ fontSize: 14 }}>– {check.weaknesses.join(' · ')}</div>}
      {check.outdated.length > 0 && (
        <div style={{ fontSize: 14, padding: '8px 12px', borderRadius: 10, background: '#FBE4EC', color: 'var(--rose)' }}>
          ⚠ Possibly outdated: {check.outdated.join(' · ')}
        </div>
      )}
    </div>
  )
}