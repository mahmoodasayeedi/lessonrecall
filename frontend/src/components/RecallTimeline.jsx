const toSeconds = (t) => t.split(':').reduce((acc, part) => acc * 60 + Number(part), 0)   // "2:23" → 143
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function RecallTimeline({ duration, chapters, pins, current, onSeek, loading }) {
  if (!duration) return null
  const pct = (s) => `${Math.min(100, (s / duration) * 100)}%`
  const chapterStarts = chapters.map((c) => ({ ...c, start: toSeconds(c.timestamp) }))

  return (
    <section className="card" aria-label="Recall timeline">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Recall timeline</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }} className="muted">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--mint)' }} />Your questions</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 10, borderRadius: 3, background: '#E9E4F2' }} />Chapters</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 2, height: 12, background: 'var(--ink)' }} />Last jump</span>
        </div>
      </div>

      <div style={{ position: 'relative', height: 70 }}>
        {chapterStarts.map((c, i) => {
          const end = chapterStarts[i + 1]?.start ?? duration
          const width = ((end - c.start) / duration) * 100
          return (
            <div key={c.start}>
              <button onClick={() => onSeek(c.start)} title={`${c.title} · ${c.timestamp}`}
                aria-label={`Chapter ${c.title}, at ${c.timestamp}`}
                style={{ position: 'absolute', left: pct(c.start), width: `calc(${width}% - 3px)`, top: 22, height: 12,
                         border: 'none', borderRadius: 4, background: '#E9E4F2', cursor: 'pointer', padding: 0 }} />
              {width > 9 && (
                <div className="muted" style={{ position: 'absolute', left: pct(c.start), top: 42, fontSize: 11,
                                                 maxWidth: `${width}%`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </div>
              )}
            </div>
          )
        })}

        {pins.map((s) => (
          <button key={s} onClick={() => onSeek(s)} aria-label={`Your question, answered at ${fmt(s)}`} title={`Answered at ${fmt(s)}`}
            style={{ position: 'absolute', left: `calc(${pct(s)} - 7px)`, top: 0, width: 14, height: 36, padding: 0,
                     border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--mint)', border: '2px solid #fff',
                           boxShadow: '0 0 0 1px var(--mint)', flex: 'none' }} />
            <span style={{ width: 2, height: 20, background: 'var(--mint)' }} />
          </button>
        ))}

        {current > 0 && <div style={{ position: 'absolute', left: pct(current), top: 14, width: 2, height: 28, background: 'var(--ink)' }} />}
      </div>

      <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
        {loading ? 'Loading chapters…'
          : pins.length > 0 ? `${pins.length} of your questions ${pins.length === 1 ? 'is' : 'are'} answered in this video. Click a pin to replay it.`
          : 'Ask a question. Every answer pins itself onto this timeline.'}
        {' '}<span style={{ fontFamily: 'var(--mono)' }}>· {fmt(duration)}</span>
      </p>
    </section>
  )
}