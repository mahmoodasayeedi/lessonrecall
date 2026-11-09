import { useEffect, useState } from 'react'

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    function onToast(e) {
      const item = e.detail
      setItems((list) => [...list, item])
      setTimeout(() => setItems((list) => list.filter((t) => t.id !== item.id)), 3500)
    }
    window.addEventListener('lr-toast', onToast)
    return () => window.removeEventListener('lr-toast', onToast)
  }, [])

  return (
    <div aria-live="polite" style={{ position: 'fixed', right: 20, bottom: 20, display: 'grid', gap: 8, zIndex: 1000 }}>
      {items.map((t) => (
        <div key={t.id} role="status"
             style={{ padding: '10px 16px', borderRadius: 12, fontSize: 14, maxWidth: 360,
                      background: t.type === 'error' ? 'var(--rose-tint)' : 'var(--ink)',
                      color: t.type === 'error' ? 'var(--rose)' : '#fff',
                      border: t.type === 'error' ? '1px solid var(--rose)' : 'none',
                      boxShadow: '0 6px 20px rgba(42, 27, 74, 0.18)' }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}