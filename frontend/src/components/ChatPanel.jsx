import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import AnswerText, { analyse } from './AnswerText'

export default function ChatPanel({ courseId, videoId, onPlay, onMessagesChange }) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [scope, setScope] = useState('video')          // 'video' or 'course'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])
    // Continue the newest chat of this course, if there is one
  useEffect(() => {
    async function loadLatestChat() {
      try {
        const sessions = await api(`/courses/${courseId}/chats`)
        if (sessions.length > 0) {
          setSessionId(sessions[0].id)
          setMessages(await api(`/chats/${sessions[0].id}/messages`))
        }
      } catch (e) {
        setError(e.message)
      }
    }
    loadLatestChat()
  }, [courseId])

  // Scroll to the newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, busy])
  async function send(text) {
    if (!text.trim() || busy) return
    setError('')
    setSuggestions([])
    setBusy(true)
    setInput('')
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', content: text }])   // show it immediately
    try {
      let sid = sessionId
      if (!sid) {
        sid = (await api(`/courses/${courseId}/chats`, { method: 'POST' })).id
        setSessionId(sid)
      }
      const reply = await api(`/chats/${sid}/messages`, {
        method: 'POST',
        body: { message: text, videoId: scope === 'video' ? videoId : null },
      })
      setMessages((m) => [...m.slice(0, -1), reply.userMessage, { ...reply.assistantMessage, toolsUsed: reply.toolsUsed }])
      setSuggestions(reply.suggestions || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  // Tell the course page about the messages (for the Recall timeline pins)   ← NEW
  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])
  
  async function newChat() {
    const s = await api(`/courses/${courseId}/chats`, { method: 'POST' })
    setSessionId(s.id)
    setMessages([])
  }

  const scopeButton = (value, text) => (
    <button type="button" onClick={() => setScope(value)} aria-pressed={scope === value}
      style={{ padding: '6px 12px', border: 'none', borderRadius: 8, font: 'inherit', fontSize: 13, cursor: 'pointer',
               background: scope === value ? '#fff' : 'transparent', color: scope === value ? 'var(--ink)' : 'var(--muted)',
               fontWeight: scope === value ? 600 : 400 }}>{text}</button>
  )

  return (
    <section aria-label="Ask LessonRecall" className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 , height: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h2 style={{ fontSize: 20 }}>Ask LessonRecall</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div role="group" aria-label="Search scope" style={{ display: 'inline-flex', padding: 3, borderRadius: 10, background: 'var(--soft)' }}>
            {scopeButton('video', 'This video')}
            {scopeButton('course', 'Whole course')}
          </div>
          <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={newChat}>New chat</button>
        </div>
      </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {messages.length === 0 && <p className="muted" style={{ margin: 0 }}>Ask anything about this course. Every answer links to the exact minute.</p>}
        {messages.map((m) => m.role === 'user' ? (
          <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--ink)', color: '#fff',
                                   padding: '10px 14px', borderRadius: '14px 14px 4px 14px', fontSize: 14 }}>{m.content}</div>
        ) : (
          <AnswerCard key={m.id} message={m} onPlay={onPlay} />
        ))}
        {busy && <div className="muted" role="status">Thinking… searching the course</div>}
        <div ref={endRef} />
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.length > 0 && !busy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Ask next</div>
          {suggestions.map((q) => (
            <button key={q} onClick={() => send(q)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px',
                       borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', font: 'inherit',
                       fontSize: 15, color: 'var(--ink)', cursor: 'pointer' }}>
              <span style={{ color: 'var(--mint)', fontWeight: 600 }}>→</span>{q}
            </button>
          ))}
        </div>
      )}
        {['Explain that more simply', 'Give me an example', 'Quiz me on this'].map((q) => (
          <button key={q} className="btn" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 400, borderRadius: 999 }}
                  disabled={busy || messages.length === 0} onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: 8 }}>
        <label htmlFor="question" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Your question</label>
        <input id="question" className="input" placeholder="Ask about this lesson…" value={input}
               onChange={(e) => setInput(e.target.value)} disabled={busy} />
        <button className="btn btn-primary" disabled={busy || !input.trim()}>Ask</button>
      </form>
    </section>
  )
}

function AnswerCard({ message, onPlay }) {
  const info = analyse(message.content)
  if (info.notCovered) {
    return (
      <div style={{ border: '1px dashed #BDB3D3', borderRadius: 14, padding: '14px 16px', background: 'var(--paper)' }}>
        <span className="badge badge-soft">Not covered in this course</span>
        <div className="muted" style={{ marginTop: 8 }}><AnswerText text={message.content} onPlay={onPlay} /></div>
      </div>
    )
  }
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: '#fff' }}>
      {info.sources > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <span className="badge badge-mint">Grounded in {info.sources} source{info.sources > 1 ? 's' : ''}</span>
          {info.hasVideo && info.hasPdf && <span className="badge badge-soft">Video and slides agree</span>}
        </div>
      )}
      <AnswerText text={message.content} onPlay={onPlay} />
      {message.toolsUsed?.length > 0 && (
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Used: {message.toolsUsed.join(', ')}</div>
      )}
    </div>
  )
}