import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import { AvatarCircle } from './avatars'

export default function Sidebar({ courseId, materials = [], selectedId, onSelect }) {
  const { user, logout } = useAuth()
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')

  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    api('/auth/avatar').then((r) => setAvatar(r.avatar)).catch(() => {})
    const onChange = (e) => setAvatar(e.detail)
    window.addEventListener('lr-avatar', onChange)
    return () => window.removeEventListener('lr-avatar', onChange)
  }, [])

  useEffect(() => {
    api('/courses/mine').then(setCourses).catch(() => setCourses([]))
  }, [])

  const visible = materials.filter((m) => (m.title || '').toLowerCase().includes(search.toLowerCase()))
  const linkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
    fontSize: 14, color: 'var(--ink)', fontWeight: isActive ? 600 : 400,
    background: isActive ? 'var(--card)' : 'transparent', border: `1px solid ${isActive ? 'var(--line)' : 'transparent'}`,
  })

  return (
    <aside aria-label="Library" style={{ width: 272, flex: 'none', height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 14px', background: '#F1EEF8',
      borderRight: '1px solid var(--line)', overflowY: 'auto' }}>
      <Link to="/home" style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', padding: '0 4px' }}>
        Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
      </Link>

      <div>
        <label htmlFor="video-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search videos</label>
        <input id="video-search" type="search" className="input" placeholder="Search videos and notes"
               value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: 'var(--card)' }} />
      </div>

      <nav aria-label="Main" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavLink to="/home" style={linkStyle}>My courses</NavLink>
        <NavLink to="/catalog" style={linkStyle}>Catalog</NavLink>
        <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
      </nav>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', padding: '6px 4px 0' }}>
        My courses
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {courses.map((c) => (
          <div key={`${c.id}-${c.myRelation}`}>
            <NavLink to={`/courses/${c.id}`} style={linkStyle}>{c.title}</NavLink>
            {String(c.id) === String(courseId) && visible.map((m) => (
              <button key={m.id} onClick={() => onSelect(m)} disabled={m.status !== 'READY' || m.type === 'PDF'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px 7px 26px',
                         border: 'none', borderRadius: 8, font: 'inherit', fontSize: 13, textAlign: 'left',
                         cursor: m.type === 'PDF' ? 'default' : 'pointer', color: 'var(--ink)',
                         background: m.id === selectedId ? 'var(--mint-tint)' : 'transparent',
                         fontWeight: m.id === selectedId ? 600 : 400 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flex: 'none',
                               background: m.status === 'READY' ? 'var(--mint)' : m.status === 'FAILED' ? 'var(--rose)' : 'var(--muted)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.type === 'PDF' ? 'PDF · ' : ''}{m.title}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <AvatarCircle avatarId={avatar} name={user.name} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{user.role === 'INSTRUCTOR' ? 'Instructor' : 'Learner'}</div>
          </div>
        </div>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={logout}>Log out</button>
      </div>
    </aside>
  )
}