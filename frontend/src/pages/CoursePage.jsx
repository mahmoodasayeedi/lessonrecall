import { useCallback, useEffect, useState } from 'react'

import { api } from '../api'
import Sidebar from '../components/Sidebar'
import YouTubePlayer from '../components/YouTubePlayer'
import RecallTimeline from '../components/RecallTimeline'
import ChatPanel from '../components/ChatPanel'
import CourseTabs from '../components/CourseTabs'
import { citedMoments } from '../components/AnswerText'
import TranscriptPanel from '../components/TranscriptPanel'
import QuizPanel from '../components/QuizPanel'
import FlashcardsPanel from '../components/FlashcardsPanel'
import AddMaterialForm from '../components/AddMaterialForm'
import { toast } from '../components/toast'
import { useParams, useSearchParams } from 'react-router-dom'

const toSeconds = (t) => t.split(':').reduce((acc, p) => acc * 60 + Number(p), 0)

export default function CoursePage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [seek, setSeek] = useState({ start: Number(searchParams.get('t')) || 0, key: 0 })
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [selected, setSelected] = useState(null)
  
  const [chatMessages, setChatMessages] = useState([])
  const [chapters, setChapters] = useState({})
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [tab, setTab] = useState('Transcript')
  const [error, setError] = useState('')
  const [quizzes, setQuizzes] = useState({})          // cache: materialId → questions
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [weakTopics, setWeakTopics] = useState([])
  const [materialsLoaded, setMaterialsLoaded] = useState(false)

const loadMaterials = useCallback(() => {
  api(`/courses/${id}/materials`).then((list) => {
    setMaterials(list)
    setMaterialsLoaded(true)
    setSelected((cur) => cur
      ?? list.find((m) => String(m.id) === searchParams.get('m'))
      ?? list.find((m) => m.type === 'YOUTUBE' && m.status === 'READY')
      ?? null)
  }).catch((e) => setError(e.message))
}, [id, searchParams])        // ← searchParams added here

  useEffect(() => {
    setSelected(null)
    api(`/courses/${id}`).then(setCourse).catch((e) => setError(e.message))
    api(`/courses/${id}/weak-topics`).then(setWeakTopics).catch(() => setWeakTopics([]))
    loadMaterials()
  }, [id, loadMaterials])

  useEffect(() => {
  if (!course || !selected) return
  try {
    localStorage.setItem('lr_last', JSON.stringify({
      courseId: id, courseTitle: course.title,
      materialId: selected.id, materialTitle: selected.title,
      seconds: seek.start, at: Date.now(),
    }))
  } catch { /* storage not available: ignore */ }
}, [id, course, selected, seek.start])

  useEffect(() => {
    if (!selected || selected.type !== 'YOUTUBE' || chapters[selected.id]) return
    setLoadingChapters(true)
    api(`/courses/${id}/materials/${selected.id}/summary`)
      .then((s) => setChapters((c) => ({ ...c, [selected.id]: s.chapters })))
      .catch(() => setChapters((c) => ({ ...c, [selected.id]: [] })))
      .finally(() => setLoadingChapters(false))
  }, [id, selected, chapters])

  function playAt(seconds, videoId) {
    const target = materials.find((m) => m.externalId === videoId)
    if (target && target.id !== selected?.id) setSelected(target)
    setSeek((s) => ({ start: Math.floor(seconds), key: s.key + 1 }))
  }
  function generateQuiz() {
    if (!selected) return
    setQuizLoading(true)
    setQuizError('')
    api(`/courses/${id}/materials/${selected.id}/quiz?count=5`)
      .then((q) => setQuizzes((all) => ({ ...all, [selected.id]: q.questions })))
      .catch((e) => setQuizError(e.message))
      .finally(() => setQuizLoading(false))
  }
    async function saveQuizResults(answers) {
    try {
      await api(`/courses/${id}/quiz-results`, {
        method: 'POST',
        body: {
          results: answers.map((a) => ({
            question: a.question.question,
            correct: a.correct,
            videoId: selected.externalId,
            startSeconds: a.question.start_seconds,
            timestamp: a.question.timestamp,
            url: a.question.url,
          })),
        },
      })
      setWeakTopics(await api(`/courses/${id}/weak-topics`))
    } catch (e) {
      console.error('Could not save quiz results', e)
    }
  }
 async function deleteMaterial(m) {
  if (!window.confirm(`Delete "${m.title}"? Its chunks and quiz results are removed too.`)) return
  try {
    await api(`/courses/${id}/materials/${m.id}`, { method: 'DELETE' })
    setSelected(null)                                       // stop showing the deleted video
    setSeek({ start: 0, key: 0 })
    setWeakTopics(await api(`/courses/${id}/weak-topics`))  // remove its rose zones
    loadMaterials()
    toast('Material deleted')                                       // picks the next video, or none
  } catch (e) {
   toast(e.message, 'error')
  }
}
  function selectMaterial(m) {
    setSelected(m)
    setSeek({ start: 0, key: 0 })
  }

  if (error) return <div className="page"><p className="error" style={{ paddingTop: 24 }}>{error}</p></div>
  if (!course) return <div className="page"><p className="muted" style={{ paddingTop: 24 }}>Loading…</p></div>

  const isOwner = course.myRelation === 'OWNER'
  if (materialsLoaded && materials.length === 0) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar courseId={id} materials={materials} selectedId={null} onSelect={selectMaterial} />
      <main style={{ flex: 1, padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', display: 'grid', gap: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>{course.title}</div>
          <h1 style={{ fontSize: 26 }}>No materials yet</h1>
          {isOwner ? (
            <>
              <p className="muted">Add a YouTube link, a video/audio file or a PDF to start learning with LessonRecall.</p>
              <AddMaterialForm courseId={id} onAdded={loadMaterials} />
            </>
          ) : (
            <p className="muted">Your instructor hasn't added any materials to this course yet.</p>
          )}
        </div>
      </main>
    </div>
  )
}

  const pins = [...new Set(chatMessages.filter((m) => m.role === 'assistant')
    .flatMap((m) => citedMoments(m.content))
    .filter((c) => c.videoId === selected?.externalId)
    .map((c) => c.seconds))]
  const weakZones = [...new Set(weakTopics.filter((w) => w.videoId === selected?.externalId).map((w) => w.startSeconds))]
  const tabs = (
    <CourseTabs tab={tab} setTab={setTab}
      chapters={chapters[selected?.id] || []}
      onSeek={(t) => playAt(toSeconds(t), selected.externalId)}
      materials={materials} isOwner={isOwner} courseId={id} onAdded={loadMaterials} onDeleteMaterial={deleteMaterial}
      transcriptSlot={<TranscriptPanel courseId={id} material={selected} pins={pins} current={seek.start}
                                       onSeek={(s) => playAt(s, selected.externalId)} />} 
    
     quizSlot={<QuizPanel key={`quiz-${selected?.id}-${quizzes[selected?.id]?.[0]?.question}`}
                           quiz={quizzes[selected?.id]} loading={quizLoading} error={quizError}
                           onGenerate={generateQuiz} onSeek={(s) => playAt(s, selected.externalId)} onFinish={saveQuizResults} />}
      flashcardsSlot={<FlashcardsPanel key={`cards-${selected?.id}`}
                                       quiz={quizzes[selected?.id]} loading={quizLoading}
                                       onGenerate={generateQuiz} onSeek={(s) => playAt(s, selected.externalId)} />} /> )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar courseId={id} materials={materials} selectedId={selected?.id} onSelect={selectMaterial} />

      <main style={{ flex: 1, minWidth: 0, padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="muted" style={{ fontSize: 13 }}>
              {course.title} · {course.visibility === 'CLASS' ? 'Class course' : 'Private course'} by {course.ownerName}
            </div>
            <h1 style={{ fontSize: 26, marginTop: 2 }}>{selected?.title || course.title}</h1>
          </div>
          <button className="btn" onClick={() => setChatOpen((o) => !o)} aria-pressed={!chatOpen}>
            {chatOpen ? 'Hide chat' : 'Show chat'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', flex: 1 }}>
          {/* Left: the video (smaller) */}
          <div style={{ flex: '2 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <YouTubePlayer videoId={selected?.type === 'YOUTUBE' ? selected.externalId : null}
                           start={seek.start} seekKey={seek.key} title={selected?.title} />
            <RecallTimeline duration={selected?.durationSeconds} chapters={chapters[selected?.id] || []}
                            pins={pins} weak={weakZones} current={seek.start} loading={loadingChapters}
                            onSeek={(s) => playAt(s, selected.externalId)} />
            {chatOpen && <div style={{ flex: 1, minHeight: 320 }}>{tabs}</div>}
          </div>

          {/* Right: the chat (bigger), or the tabs when the chat is hidden */}
          <div style={{ flex: '3 1 480px', minWidth: 0, height: 'calc(100vh - 110px)', position: 'sticky', top: 18 }}>
            {chatOpen
              ? <ChatPanel courseId={id} videoId={selected?.externalId} onPlay={playAt} onMessagesChange={setChatMessages} />
              : tabs}
          </div>
        </div>
      </main>
    </div>
  )
}