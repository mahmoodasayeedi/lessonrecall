import { useState } from 'react'
import { api } from '../api'

export default function AddMaterialForm({ courseId, onAdded }) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)        // { type: 'error' | 'ok', text }

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
    run(() => api(`/courses/${courseId}/materials/youtube`, { method: 'POST', body: { url } })).then(() => setUrl(''))
  }

  function upload(e) {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    run(() => api(`/courses/${courseId}/materials/upload`, { method: 'POST', form })).then(() => setFile(null))
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20 }}>Add material</h2>

      <form onSubmit={addYoutube} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="label" htmlFor="yt" style={{ width: '100%', marginBottom: 0 }}>YouTube link</label>
        <input id="yt" className="input" style={{ flex: '1 1 260px' }} placeholder="https://www.youtube.com/watch?v=…"
               value={url} onChange={(e) => setUrl(e.target.value)} required disabled={busy} />
        <button className="btn btn-primary" disabled={busy}>Add video</button>
      </form>

      <form onSubmit={upload} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="label" htmlFor="file" style={{ width: '100%', marginBottom: 0 }}>Or upload MP4, MP3 or PDF (max 25 MB)</label>
        <input id="file" type="file" accept=".mp4,.mp3,.m4a,.wav,.pdf" style={{ flex: '1 1 260px' }}
               onChange={(e) => setFile(e.target.files[0] || null)} disabled={busy} />
        <button className="btn" disabled={busy || !file}>Upload</button>
      </form>

      {busy && <div className="muted" role="status">Processing… transcribing and indexing can take up to a minute.</div>}
      {message && <div role="alert" style={{ color: message.type === 'ok' ? 'var(--mint)' : 'var(--rose)', fontSize: 14 }}>{message.text}</div>}
    </div>
  )
}