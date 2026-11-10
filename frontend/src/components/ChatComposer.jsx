export default function ChatComposer({ value, onChange, onSubmit, busy, listening, onMic, placeholder }) {
  function submit(e) {
    e.preventDefault()
    if (value.trim() && !busy) onSubmit()
  }

  return (
    <form onSubmit={submit}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 18, background: '#fff',
               border: `1.5px solid ${listening ? 'var(--rose)' : 'var(--line)'}`,
               boxShadow: '0 6px 18px rgba(42,27,74,.08)' }}>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={busy}
             placeholder={listening ? 'Listening… speak now' : placeholder} aria-label="Your question"
             style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                      fontFamily: 'inherit', fontSize: 15, padding: '8px 10px', color: 'var(--ink)' }} />

      <button type="button" onClick={onMic} disabled={busy} className={listening ? 'listening' : ''}
              aria-label={listening ? 'Stop voice input' : 'Ask by voice'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
                       border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                       background: listening ? 'var(--rose)' : 'var(--soft)', color: listening ? '#fff' : 'var(--ink)' }}>
        {listening ? '■ Stop' : '🎤 Talk'}
      </button>

      <button type="submit" disabled={busy || !value.trim()} aria-label="Send question"
              style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0, fontSize: 18,
                       cursor: busy || !value.trim() ? 'default' : 'pointer', color: '#fff',
                       background: busy || !value.trim() ? '#B9D9CD' : 'var(--mint)' }}>
        {busy ? '…' : '↑'}
      </button>
    </form>
  )
}