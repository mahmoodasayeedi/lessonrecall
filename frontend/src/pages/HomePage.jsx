import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import CourseCard from '../components/CourseCard'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isInstructor = user.role === 'INSTRUCTOR'

  const [courses, setCourses] = useState(null)        // null = still loading
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', visibility: isInstructor ? 'CLASS' : 'PRIVATE' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api('/courses/mine').then(setCourses).catch((e) => setError(e.message))
  }, [])

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

  return (
    <div className="page">
      <Header />
      <div style={{ padding: '24px 0 16px' }}>
        <div className="muted" style={{ fontSize: 14 }}>Welcome back, {user.name}</div>
        <h1 style={{ fontSize: 34, marginTop: 4 }}>My courses</h1>
      </div>

      {error && <div className="error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <section style={{ flex: '999 1 600px', minWidth: 0 }}>
          {courses === null && <p className="muted">Loading…</p>}
          {courses?.length === 0 && (
            <div className="card">
              <p style={{ margin: 0 }}>You have no courses yet.</p>
              <p className="muted" style={{ margin: '6px 0 0' }}>Join a class course in the Catalog, or create your own.</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {courses?.map((c) => <CourseCard key={`${c.id}-${c.myRelation}`} course={c} />)}
          </div>
        </section>

        <aside className="card" style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Create a course</h2>
          <form onSubmit={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" className="input" required maxLength={120} value={form.title}
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
            <button className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create course'}</button>
          </form>
        </aside>
      </div>
    </div>
  )
}