
import { api } from '../api'
import Header from '../components/Header'
import { useEffect, useState } from 'react'
import { AVATARS, AvatarCircle, announceAvatar } from '../components/avatars'
import { toast } from '../components/toast'

export default function SettingsPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

const LANGUAGES = ['', 'English', 'German', 'Spanish', 'French', 'Arabic', 'Urdu', 'Hindi']
const [language, setLanguage] = useState('')
const [langMessage, setLangMessage] = useState('')

const [avatar, setAvatar] = useState(null)

useEffect(() => {
  api('/auth/avatar').then((r) => setAvatar(r.avatar)).catch(() => {})
}, [])

async function chooseAvatar(id) {
  await api('/auth/avatar', { method: 'PUT', body: { avatar: id ?? '' } })
  setAvatar(id)
  announceAvatar(id)
  toast('Avatar updated')
}
useEffect(() => {
  api('/auth/language').then((r) => setLanguage(r.language ?? '')).catch(() => {})
}, [])

async function saveLanguage(e) {
  e.preventDefault()
  await api('/auth/language', { method: 'PUT', body: { language } })
  setLangMessage('Saved. New answers will use this language.')
}

  async function submit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    if (next !== repeat) return setError('The new passwords do not match')
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword: current, newPassword: next } })
      setMessage('Password changed.')
      setCurrent(''); setNext(''); setRepeat('')
    } catch (err) { setError(err.message) }
  }

  return (
    <>
      <Header />
      <div className="page">
        <h1 style={{ margin: '24px 0 16px' }}>Settings</h1>
        <div className="card" style={{ maxWidth: 420, display: 'grid', gap: 12, marginBottom: 16 }}>
  <h2 style={{ fontSize: 20 }}>Your avatar</h2>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
    {AVATARS.map((a) => (
      <button key={a.id} onClick={() => chooseAvatar(a.id)} aria-label={`Choose ${a.id}`} aria-pressed={avatar === a.id}
        style={{ padding: 3, borderRadius: '50%', cursor: 'pointer', background: 'none',
                 border: `2px solid ${avatar === a.id ? 'var(--mint)' : 'transparent'}` }}>
        <AvatarCircle avatarId={a.id} size={48} />
      </button>
    ))}
    <button className="btn" style={{ fontSize: 13 }} onClick={() => chooseAvatar(null)}>Use initials</button>
  </div>
</div>
        <form className="card" onSubmit={submit} style={{ maxWidth: 420, display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20 }}>Change password</h2>
          <label className="label">Current password
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <label className="label">New password (min. 8 characters)
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
          </label>
          <label className="label">Repeat new password
            <input className="input" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
          </label>
          <button className="btn btn-primary">Save new password</button>
          {message && <p style={{ color: 'var(--mint)' }}>{message}</p>}
          {error && <p className="error">{error}</p>}
        </form>
        <form className="card" onSubmit={saveLanguage} style={{ maxWidth: 420, display: 'grid', gap: 12, marginTop: 16 }}>
  <h2 style={{ fontSize: 20 }}>Answer language</h2>
  <label className="label">Answer me in
    <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
      {LANGUAGES.map((l) => <option key={l} value={l}>{l || 'Same language as my question'}</option>)}
    </select>
  </label>
  <button className="btn btn-primary">Save language</button>
  {langMessage && <p style={{ color: 'var(--mint)' }}>{langMessage}</p>}
</form>
      </div>
    </>
  )
}