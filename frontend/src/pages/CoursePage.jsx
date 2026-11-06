import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import YouTubePlayer from '../components/YouTubePlayer'
import AddMaterialForm from '../components/AddMaterialForm'
import ChatPanel from '../components/ChatPanel'
import RecallTimeline from '../components/RecallTimeline'
import { citedMoments } from '../components/AnswerText'

const statusBadge = {
  READY: <span className="badge badge-mint">Ready</span>,
  PROCESSING: <span className="badge badge-soft">Processing</span>,
  FAILED: <span className="badge badge-rose">Failed</span>,
}

export default function CoursePage() {
  const { id } = useParams()                                  // the :id from the URL
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [selected, setSelected] = useState(null)             // the material shown in the player
  const [seek, setSeek] = useState({ start: 0, key: 0 })     // where the player should start
  const [error, setError] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chapters, setChapters] = useState({})          // cache: materialId → chapters
  const [loadingChapters, setLoadingChapters] = useState(false)

  const loadMaterials = useCallback(() => {
    api(`/courses/${id}/materials`).then((list) => {
      setMaterials(list)
      setSelected((current) => current ?? list.find((m) => m.type === 'YOUTUBE' && m.status === 'READY') ?? null)
    }).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    api(`/courses/${id}`).then(setCourse).catch((e) => setError(e.message))
    loadMaterials()
  }, [id, loadMaterials])
    useEffect(() => {
    if (!selected || selected.type !== 'YOUTUBE' || chapters[selected.id]) return
    setLoadingChapters(true)
    api(`/courses/${id}/materials/${selected.id}/summary`)
      .then((s) => setChapters((c) => ({ ...c, [selected.id]: s.chapters })))
      .catch(() => setChapters((c) => ({ ...c, [selected.id]: [] })))
      .finally(() => setLoadingChapters(false))
  }, [id, selected, chapters])

  // The chat (Step 6) calls this: jump to a moment in a video
  function playAt(seconds, videoId) {
    const target = materials.find((m) => m.externalId === videoId)
    if (target) setSelected(target)
    setSeek((s) => ({ start: Math.floor(seconds), key: s.key + 1 }))
  }

  if (error) return <div className="page"><Header /><p className="error" style={{ paddingTop: 24 }}>{error}</p></div>
  if (!course) return <div className="page"><Header /><p className="muted" style={{ paddingTop: 24 }}>Loading…</p></div>

  const isOwner = course.myRelation === 'OWNER'
    const pins = [...new Set(
    chatMessages.filter((m) => m.role === 'assistant')
      .flatMap((m) => citedMoments(m.content))
      .filter((c) => c.videoId === selected?.externalId)
      .map((c) => c.seconds)
  )]
    console.log('chat messages:', chatMessages.length, 'pins:', pins, 'video:', selected?.externalId)
  return (
    <div className="page">
      <Header />
      <div style={{ padding: '20px 0 16px' }}>
        <div className="muted" style={{ fontSize: 13 }}>
          {course.title} · {course.visibility === 'CLASS' ? 'Class course' : 'Private course'} by {course.ownerName}
        </div>
        <h1 style={{ fontSize: 34, marginTop: 4 }}>{selected?.title || course.title}</h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '999 1 640px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <YouTubePlayer
            videoId={selected?.type === 'YOUTUBE' ? selected.externalId : null}
            start={seek.start} seekKey={seek.key} title={selected?.title} />

            <RecallTimeline
            duration={selected?.durationSeconds}
            chapters={chapters[selected?.id] || []}
            pins={pins}
            current={seek.start}
            loading={loadingChapters}
            onSeek={(s) => playAt(s, selected.externalId)} />
            

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>Course materials</h2>
            {materials.length === 0 && <p className="muted">No materials yet.</p>}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {materials.map((m) => (
                <li key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                                        padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ minWidth: 0 }}>
                    {m.type === 'YOUTUBE' && m.status === 'READY' ? (
                      <button onClick={() => { setSelected(m); setSeek({ start: 0, key: 0 }) }}
                        style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left',
                                 color: 'var(--ink)', fontWeight: selected?.id === m.id ? 600 : 400 }}>
                        ▶ {m.title}
                      </button>
                    ) : (
                      <span>{m.type === 'PDF' ? '📄 ' : ''}{m.title}</span>
                    )}
                    {m.status === 'FAILED' && <div className="error" style={{ fontSize: 13 }}>{m.errorMessage}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                    {m.chunkCount != null && <span className="muted" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                      {m.type === 'PDF' ? `${m.chunkCount} pages` : `${m.chunkCount} chunks`}</span>}
                    {statusBadge[m.status]}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {isOwner && <AddMaterialForm courseId={id} onAdded={loadMaterials} />}
        </div>

        <aside style={{ flex: '1 1 400px', minWidth: 0 }}>
                    <ChatPanel courseId={id} videoId={selected?.externalId} onPlay={playAt} onMessagesChange={setChatMessages} />
        </aside>
      </div>
    </div>
  )
}