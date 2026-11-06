import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')                 // 'login' or 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LEARNER' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/home" replace />

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password, form.role)
      navigate('/home')
    } catch (err) {
      setError(err.status === 401 ? 'Wrong email or password.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  const tab = (value, text) => (
    <button type="button" onClick={() => { setMode(value); setError('') }}
      style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, font: 'inherit', fontWeight: 600, cursor: 'pointer',
               background: mode === value ? '#fff' : 'transparent', color: mode === value ? 'var(--ink)' : 'var(--muted)' }}>
      {text}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 600, textAlign: 'center' }}>
          Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
        </div>
        <p className="muted" style={{ textAlign: 'center', margin: '6px 0 24px' }}>
          Ask your course videos. Get the exact minute.
        </p>

        <div style={{ display: 'flex', padding: 3, borderRadius: 10, background: 'var(--soft)', marginBottom: 20 }}>
          {tab('login', 'Log in')}
          {tab('signup', 'Sign up')}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" value={form.name} onChange={update('name')} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={update('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password} onChange={update('password')}
                   minLength={mode === 'signup' ? 8 : undefined} required />
          </div>
          {mode === 'signup' && (
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="label">I am a…</legend>
              <div style={{ display: 'flex', gap: 16 }}>
                <label><input type="radio" name="role" value="LEARNER" checked={form.role === 'LEARNER'} onChange={update('role')} /> Learner</label>
                <label><input type="radio" name="role" value="INSTRUCTOR" checked={form.role === 'INSTRUCTOR'} onChange={update('role')} /> Instructor</label>
              </div>
            </fieldset>
          )}

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}