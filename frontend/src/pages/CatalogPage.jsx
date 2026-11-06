import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import CourseCard from '../components/CourseCard'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/courses/catalog').then(setCourses).catch((e) => setError(e.message))
  }, [])

  async function join(id) {
    try {
      await api(`/courses/${id}/join`, { method: 'POST' })
      navigate(`/courses/${id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <Header />
      <h1 style={{ fontSize: 34, padding: '24px 0 16px' }}>Class courses</h1>
      {error && <div className="error" role="alert">{error}</div>}
      {courses === null && <p className="muted">Loading…</p>}
      {courses?.length === 0 && <p className="muted">No class courses yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {courses?.map((c) => (
          <CourseCard key={c.id} course={c} action={
            c.myRelation === 'NOT_JOINED'
              ? <button className="btn btn-primary" onClick={() => join(c.id)}>Join course</button>
              : <button className="btn" onClick={() => navigate(`/courses/${c.id}`)}>Open</button>
          } />
        ))}
      </div>
    </div>
  )
}