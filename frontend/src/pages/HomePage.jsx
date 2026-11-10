import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import CourseCard from '../components/CourseCard'
import ContinueCard from '../components/ContinueCard'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isInstructor = user.role === 'INSTRUCTOR'
  const firstName = user.name.split(' ')[0]

  const [courses, setCourses] = useState(null)        // null = still loading
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', visibility: isInstructor ? 'CLASS' : 'PRIVATE' })
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadCourses = useCallback(() => {
    api('/courses/mine').then(setCourses).catch((e) => setError(e.message))
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  // close the pop-up with Escape
  useEffect(() => {
    if (!showCreate) return
    const onKey = (e) => e.key === 'Escape' && setShowCreate(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCreate])

  async function createCourse(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const course = await api('/courses', { method: 'POST', body: form })
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  const newCourseLabel = isInstructor ? 'New course' : 'New private course'

  return (
    <div className="page">
      <Header />
      {/* greeting + continue, side by side */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                    gap: 20, padding: '28px 0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/avatar.png" alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
                                                 border: '3px solid var(--mint)' }} />
          <div>
            <h1 style={{ fontSize: 30 }}>{greeting()}, {firstName}!</h1>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 16 }}>What would you like to recall today?</p>
          </div>
        </div>
        <div style={{ flex: '1 1 380px', maxWidth: 560 }}>
          <ContinueCard />
        </div>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {/* heading row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '8px 0 16px' }}>
        <h2 style={{ fontSize: 26 }}>My courses</h2>
        <Link to="/catalog" className="btn" style={{ textDecoration: 'none' }}>Explore catalog →</Link>
      </div>

      {courses === null && <p className="muted">Loading…</p>}

      {/* empty state */}
      {courses?.length === 0 && (
        <div className="card" style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center', padding: '40px 24px' }}>
          <img src="/avatar.png" alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          <h3 style={{ fontSize: 22 }}>No courses yet</h3>
          <p className="muted" style={{ margin: 0, maxWidth: 420 }}>
            Join a class course from the catalog, or create your own course from YouTube videos, recordings and PDFs.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <Link to="/catalog" className="btn" style={{ textDecoration: 'none' }}>Explore catalog</Link>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{newCourseLabel}</button>
          </div>
        </div>
      )}

      {/* course grid + "new course" tile */}
      {courses?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18, paddingBottom: 40 }}>
          {courses.map((c) => <CourseCard key={c.id} course={c} onChanged={loadCourses} />)}
          <button onClick={() => setShowCreate(true)}
            style={{ minHeight: 220, borderRadius: 16, border: '2px dashed var(--line)', background: 'transparent',
                     cursor: 'pointer', fontFamily: 'inherit', color: 'var(--muted)', display: 'grid', placeItems: 'center',
                     alignContent: 'center', gap: 8 }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center',
                           background: 'var(--mint-tint)', color: 'var(--mint)', fontSize: 28 }}>+</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{newCourseLabel}</span>
            <span style={{ fontSize: 13 }}>Videos, recordings and PDFs</span>
          </button>
        </div>
      )}

      {/* create course pop-up */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(42, 27, 74, 0.45)',
                      display: 'grid', placeItems: 'center', padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="create-title" onClick={(e) => e.stopPropagation()}
               className="card" style={{ width: '100%', maxWidth: 460, padding: 28, borderRadius: 20,
                                         boxShadow: '0 30px 60px rgba(42,27,74,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 id="create-title" style={{ fontSize: 22 }}>Create a course</h2>
              <button onClick={() => setShowCreate(false)} aria-label="Close"
                      style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <form onSubmit={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" className="input" required maxLength={120} value={form.title} autoFocus
                       onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="desc">Description (optional)</label>
                <textarea id="desc" className="input" rows={3} maxLength={1000} value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="vis">Visibility</label>
                <select id="vis" className="input" value={form.visibility}
                        onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="PRIVATE">Private: only me</option>
                  {isInstructor && <option value="CLASS">Class: learners can join</option>}
                </select>
              </div>
              {error && <div className="error" role="alert">{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}