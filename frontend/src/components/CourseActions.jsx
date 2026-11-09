import { useState } from 'react'
import { api } from '../api'          // use the same import as your other components

export default function CourseActions({ course, isOwner, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? '')
  const [error, setError] = useState('')

  // the card is a link: stop clicks here from opening the course
  const stop = (e) => { e.preventDefault(); e.stopPropagation() }

  async function save(e) {
    stop(e)
    try {
      await api(`/courses/${course.id}`, { method: 'PUT', body: { title, description } })
      setEditing(false)
      onChanged()
    } catch (err) { setError(err.message) }
  }

  async function remove(e) {
    stop(e)
    if (!window.confirm(`Delete "${course.title}"?\nAll materials, chats and quiz results will be removed. This cannot be undone.`)) return
    try {
      await api(`/courses/${course.id}`, { method: 'DELETE' })
      onChanged()
    } catch (err) { setError(err.message) }
  }

  async function leave(e) {
    stop(e)
    if (!window.confirm(`Leave "${course.title}"? You can join again from the Catalog.`)) return
    try {
      await api(`/courses/${course.id}/enrollment`, { method: 'DELETE' })
      onChanged()
    } catch (err) { setError(err.message) }
  }

  if (editing) {
    return (
      <div onClick={stop} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" value={description} placeholder="Description"
               onChange={(e) => setDescription(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>Save</button>
          <button className="btn" onClick={(e) => { stop(e); setEditing(false) }}>Cancel</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {isOwner ? (
        <>
          <button className="btn" onClick={(e) => { stop(e); setEditing(true) }}>Edit</button>
          <button className="btn" style={{ color: 'var(--rose)' }} onClick={remove}>Delete</button>
        </>
      ) : (
        <button className="btn" onClick={leave}>Leave</button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}