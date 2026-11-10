import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'      // ← use the same import your Header uses
import { api } from '../api'
import { AvatarCircle } from './avatars'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const [avatar, setAvatar] = useState(null)
  
  useEffect(() => {
  api('/auth/avatar').then((r) => setAvatar(r.avatar)).catch(() => {})
  const onChange = (e) => setAvatar(e.detail)
  window.addEventListener('lr-avatar', onChange)
  return () => window.removeEventListener('lr-avatar', onChange)
}, [])
 
  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!user) return null
  
  const item = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10,
                 background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)',
                 cursor: 'pointer', textDecoration: 'none', textAlign: 'left' }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
     <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
        style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%' }}>
  <AvatarCircle avatarId={avatar} name={user.name} size={40} />
</button>

      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 48, width: 260, zIndex: 50, padding: 6,
                                  background: '#fff', border: '1px solid var(--line)', borderRadius: 16,
                                  boxShadow: '0 12px 32px rgba(42, 27, 74, 0.15)' }}>
          <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{user.email}</div>
            <span className="badge badge-soft" style={{ marginTop: 6, display: 'inline-block' }}>
              {user.role === 'INSTRUCTOR' ? 'Instructor' : 'Learner'}
            </span>
          </div>
          <Link to="/home" role="menuitem" style={item} onClick={() => setOpen(false)}>📚 My courses</Link>
          <Link to="/settings" role="menuitem" style={item} onClick={() => setOpen(false)}>⚙️ Settings</Link>
          <button role="menuitem" style={{ ...item, color: 'var(--rose)' }}
                  onClick={() => { logout(); navigate('/login') }}>↪ Log out</button>
        </div>
      )}
    </div>
  )
}