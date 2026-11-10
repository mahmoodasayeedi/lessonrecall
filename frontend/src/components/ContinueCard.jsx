import { Link } from 'react-router-dom'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function ContinueCard() {
  let last = null
  try { last = JSON.parse(localStorage.getItem('lr_last')) } catch { /* ignore */ }
  if (!last) return null

  return (
    <Link to={`/courses/${last.courseId}?m=${last.materialId}&t=${last.seconds}`}
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit',
                   border: '1px solid var(--line)', borderLeft: '4px solid var(--mint)', borderRadius: 16, marginBottom: 20 }}>
     <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center',
                                  flexShrink: 0, background: 'var(--mint-tint)', color: 'var(--mint)', fontSize: 18 }}>▶</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="muted" style={{ fontSize: 13 }}>Continue where you left off · {last.courseTitle}</div>
        <div style={{ fontWeight: 600, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {last.materialTitle}
        </div>
      </div>
      <span className="chip">▶ {fmt(last.seconds)}</span>
    </Link>
  )
}