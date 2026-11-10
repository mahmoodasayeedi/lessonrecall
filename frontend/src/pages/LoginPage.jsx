import { useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import { Orbs, Tilt } from '../components/Scene3D'
import WelcomeHero from '../components/WelcomeHero'
import {  Link,Navigate, useNavigate, useSearchParams } from 'react-router-dom'

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'LEARNER' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/home" replace />

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const switchMode = (m) => { setMode(m); setError('') }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(`${form.firstName.trim()} ${form.lastName.trim()}`.trim(), form.email, form.password, form.role)
      navigate('/home')
    } catch (err) {
      setError(err.status === 401 ? 'Wrong email or password.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  const roleTile = (value, icon, title, text) => {
    const selected = form.role === value
    return (
      <button type="button" onClick={() => setForm({ ...form, role: value })} aria-pressed={selected}
        style={{ flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                 background: selected ? 'var(--mint-tint)' : '#fff', color: 'var(--ink)',
                 border: `1.5px solid ${selected ? 'var(--mint)' : 'var(--line)'}`, boxShadow: 'inset 0 -2px 0 var(--line)' }}>
        <div style={{ fontSize: 20 }}>{icon}</div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>{text}</div>
      </button>
    )
  }

    return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'grid', placeItems: 'center',
                  padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 1120, display: 'grid', gap: 72, alignItems: 'center',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <WelcomeHero />

        {/* card column: spheres sit behind the card */}
        <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 14, padding: '40px 0' }}>
          <Orbs />
          <Tilt>
            <div className="card glass" style={{ width: '100%', padding: 32 }}>
              <Link to="/" style={{ display: 'block', textDecoration: 'none', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 600, textAlign: 'center' }}>
  Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
</Link>
              <h1 style={{ fontSize: 22, textAlign: 'center', margin: '14px 0 4px' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="muted" style={{ textAlign: 'center', margin: '0 0 22px', fontSize: 14 }}>
                {mode === 'login' ? 'Log in to continue where you left off.' : 'Free for your class. No credit card needed.'}
              </p>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'signup' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label" htmlFor="firstName">First name</label>
                      <input id="firstName" className="input" value={form.firstName} onChange={update('firstName')}
                             autoComplete="given-name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="lastName">Last name</label>
                      <input id="lastName" className="input" value={form.lastName} onChange={update('lastName')}
                             autoComplete="family-name" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="input" value={form.email} onChange={update('email')}
                         placeholder="you@example.com" autoComplete="email" required />
                </div>

                <div>
                  <label className="label" htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="password" type={showPassword ? 'text' : 'password'} className="input"
                           value={form.password} onChange={update('password')} style={{ paddingRight: 48 }}
                           minLength={mode === 'signup' ? 8 : undefined}
                           autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
                    <button type="button" onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                     border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, padding: 6 }}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                  {mode === 'signup' && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>At least 8 characters</div>}
                </div>

                {mode === 'signup' && (
                  <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend className="label">I am a…</legend>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {roleTile('LEARNER', '🎓', 'Learner', 'I study courses')}
                      {roleTile('INSTRUCTOR', '🧑‍🏫', 'Instructor', 'I create class courses')}
                    </div>
                  </fieldset>
                )}

                {error && <div className="error" role="alert">{error}</div>}

                <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: '12px', fontSize: 16 }}>
                  {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>
              </form>

              <p className="muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                                 fontSize: 14, color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </Tilt>
          <p className="muted" style={{ fontSize: 12, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            🔒 Your course data stays private to your class.
          </p>
        </div>
      </div>
    </div>
  )
}