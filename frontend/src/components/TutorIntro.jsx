import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// "Meet your tutor" button: opens the intro video in a pop-up (plays with sound because the user clicked)
export default function TutorIntro() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, justifySelf: 'start', padding: '8px 20px 8px 8px',
                 borderRadius: 999, border: '1px solid var(--line)', background: '#fff', font: 'inherit', fontSize: 16,
                 fontWeight: 600, color: 'var(--ink)', cursor: 'pointer', boxShadow: '0 4px 14px rgba(42,27,74,.08)' }}>
        <img src="/tutor-closeup.png" alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                                                     border: '2px solid var(--mint)' }} />
        ▶ Meet your tutor
        <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>19 s</span>
      </button>

      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Meet your LessonRecall tutor" onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(42,27,74,.6)', display: 'grid',
                   placeItems: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: 'min(560px, 100%)', borderRadius: 20, overflow: 'hidden',
                     background: 'var(--paper)', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
            <video src="/tutor-intro.mp4" autoPlay controls playsInline onEnded={() => setOpen(false)}
              style={{ display: 'block', width: '100%' }} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close video"
              style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%', border: 'none',
                       background: 'rgba(255,255,255,.9)', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}