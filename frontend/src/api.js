// One place for all calls to Spring Boot. The token is added automatically.
const TOKEN_KEY = 'lr_token'
const BASE = import.meta.env.VITE_API_URL || ''

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),   // form = FormData for file uploads
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Spring sends {message} or ProblemDetail {detail, title}
    const msg = data?.message || data?.detail || data?.title || `Request failed (${res.status})`
    const error = new Error(msg)
    error.status = res.status
    throw error
  }
  return data
}

export async function apiStream(path, body, onEvent) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')       // a blank line ends one event
    buffer = events.pop()                      // keep the unfinished part for the next round
    for (const e of events) {
      const line = e.split('\n').find((l) => l.startsWith('data:'))
      if (line) onEvent(JSON.parse(line.slice(5)))
    }
  }
}