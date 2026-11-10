import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import { toast } from '../components/toast'
import { AVATARS, AvatarCircle, announceAvatar } from '../components/avatars'

const LANGUAGES = ['', 'English', 'German', 'Spanish', 'French', 'Arabic', 'Urdu', 'Hindi']

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [avatar, setAvatar] = useState(null)
  const [language, setLanguage] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    api('/auth/avatar').then((r) => setAvatar(r.avatar)).catch(() => {})
    api('/auth/language').then((r) => setLanguage(r.language ?? '')).catch(() => {})
  }, [])

  async function chooseAvatar(id) {
    try {
      await api('/auth/avatar', { method: 'PUT', body: { avatar: id ?? '' } })
      setAvatar(id)
      announceAvatar(id)
      toast('Avatar updated')
    } catch (e) { toast(e.message, 'error') }
  }

  async function saveLanguage(e) {
    e.preventDefault()
    try {
      await api('/auth/language', { method: 'PUT', body: { language } })
      toast('Answer language saved')
    } catch (err) { toast(err.message, 'error') }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwError('')
    if (next !== repeat) return setPwError('The new passwords do not match')
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword: current, newPassword: next } })
      toast('Password changed')
      setCurrent(''); setNext(''); setRepeat('')
    } catch (err) { setPwError(err.message) }
  }

  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
                border: '1px solid var(--line)', background: '#fff' }

  return (
    <div className="page">
      <Header />
      <div style={{ padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: 34 }}>Settings</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Manage your profile, password and answer language.</p>
      </div>

      <div style={{ display: 'grid', gap: 24, alignItems: 'start', padding: '16px 0 48px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* ---------- left: profile card ---------- */}
        <aside className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: 420, width: '100%' }}>
          <div style={{ height: 110, background: 'linear-gradient(135deg, #2A1B4A, #4B2E83)' }} />
          <div style={{ display: 'grid', justifyItems: 'center', gap: 6, padding: '0 22px 22px', marginTop: -52, textAlign: 'center' }}>
            <span style={{ borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 8px 20px rgba(42,27,74,.18)', lineHeight: 0 }}>
              <AvatarCircle avatarId={avatar} name={user.name} size={96} />
            </span>
            <h2 style={{ fontSize: 24, marginTop: 6 }}>{user.name}</h2>
            <span className="badge badge-soft">{user.role === 'INSTRUCTOR' ? 'Instructor' : 'Learner'}</span>
          </div>
          <div style={{ display: 'grid', gap: 10, padding: '0 22px 22px' }}>
            <div style={row}>
              <span aria-hidden="true">✉️</span>
              <div style={{ minWidth: 0 }}>
                <div className="muted" style={{ fontSize: 12 }}>Email</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
            <div style={row}>
              <span aria-hidden="true">🌐</span>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Answer language</div>
                <div>{language || 'Same as my question'}</div>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/login') }}
                    style={{ ...row, justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
                             fontWeight: 600, background: 'var(--rose-tint)', color: 'var(--rose)', border: '1px solid var(--rose-tint)' }}>
              ↪ Log out
            </button>
          </div>
        </aside>

        {/* ---------- right: section cards ---------- */}
        <div style={{ display: 'grid', gap: 20, gridColumn: 'span 2', minWidth: 0 }}>

          <section className="card" style={{ display: 'grid', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20 }}>Your avatar</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>Shown in the top-right menu and on your profile.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => chooseAvatar(a.id)} aria-label={`Choose ${a.id}`} aria-pressed={avatar === a.id}
                  style={{ padding: 3, borderRadius: '50%', cursor: 'pointer', background: 'none',
                           border: `2px solid ${avatar === a.id ? 'var(--mint)' : 'transparent'}` }}>
                  <AvatarCircle avatarId={a.id} size={52} />
                </button>
              ))}
              <button className="btn" style={{ fontSize: 13 }} onClick={() => chooseAvatar(null)}>Use initials</button>
            </div>
          </section>

          <section className="card">
            <form onSubmit={changePassword} style={{ display: 'grid', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20 }}>Change password</h2>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>Use at least 8 characters.</p>
              </div>
              <div>
                <label className="label" htmlFor="current">Current password</label>
                <input id="current" className="input" type="password" autoComplete="current-password"
                       value={current} onChange={(e) => setCurrent(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div>
                  <label className="label" htmlFor="next">New password</label>
                  <input id="next" className="input" type="password" autoComplete="new-password" minLength={8}
                         value={next} onChange={(e) => setNext(e.target.value)} required />
                </div>
                <div>
                  <label className="label" htmlFor="repeat">Repeat new password</label>
                  <input id="repeat" className="input" type="password" autoComplete="new-password"
                         value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
                </div>
              </div>
              {pwError && <p className="error" role="alert">{pwError}</p>}
              <button className="btn btn-primary" style={{ justifySelf: 'start' }}>Save new password</button>
            </form>
          </section>

          <section className="card">
            <form onSubmit={saveLanguage} style={{ display: 'grid', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20 }}>Answer language</h2>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>
                  Ask in any language. Answers, suggestions and the read-aloud voice use this language.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                <label className="label" style={{ flex: '1 1 240px', margin: 0 }}>Answer me in
                  <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l || 'Same language as my question'}</option>)}
                  </select>
                </label>
                <button className="btn btn-primary">Save language</button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}