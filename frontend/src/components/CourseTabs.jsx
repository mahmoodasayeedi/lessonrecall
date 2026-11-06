import AddMaterialForm from './AddMaterialForm'

const TABS = ['Transcript', 'Chapters', 'Materials']

export default function CourseTabs({ tab, setTab, chapters, onSeek, materials, isOwner, courseId, onAdded, transcriptSlot }) {
  return (
    <section className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div role="tablist" aria-label="Video tools" style={{ display: 'flex', gap: 18, padding: '0 20px', borderBottom: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            style={{ padding: '12px 2px', border: 'none', background: 'none', font: 'inherit', fontSize: 14, cursor: 'pointer',
                     color: tab === t ? 'var(--ink)' : 'var(--muted)', fontWeight: tab === t ? 600 : 400,
                     borderBottom: `2px solid ${tab === t ? 'var(--mint)' : 'transparent'}` }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
        {tab === 'Transcript' && transcriptSlot}

        {tab === 'Chapters' && (
          chapters.length === 0 ? <p className="muted">Loading chapters…</p> : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chapters.map((c) => (
                <li key={c.timestamp} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderBottom: '1px solid var(--line)' }}>
                  <button className="chip" onClick={() => onSeek(c.timestamp)}>▶ {c.timestamp}</button>
                  <span>{c.title}</span>
                </li>
              ))}
            </ol>
          )
        )}

        {tab === 'Materials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {materials.map((m) => (
                <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div>{m.type === 'PDF' ? 'PDF · ' : ''}{m.title}</div>
                    {m.status === 'FAILED' && <div className="error" style={{ fontSize: 13 }}>{m.errorMessage}</div>}
                  </div>
                  <span className={`badge ${m.status === 'READY' ? 'badge-mint' : m.status === 'FAILED' ? 'badge-rose' : 'badge-soft'}`}>
                    {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
            {isOwner && <AddMaterialForm courseId={courseId} onAdded={onAdded} />}
          </div>
        )}
      </div>
    </section>
  )
}