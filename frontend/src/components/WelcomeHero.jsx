export default function WelcomeHero() {
  const steps = [
    ['1', 'Add your course', 'Videos, recordings and PDFs'],
    ['2', 'Ask anything', 'By typing or by voice, in any language'],
    ['3', 'Jump to the minute', 'Every answer links to the exact moment'],
  ]
  return (
    <section style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 22, alignContent: 'center' }}>
      <span className="badge badge-mint" style={{ justifySelf: 'start' }}>AI study assistant</span>
      <h1 style={{ fontSize: 44, lineHeight: 1.08 }}>
        Ask your course.<br /><span style={{ color: 'var(--mint)' }}>Get the exact minute.</span>
      </h1>
      <img src="/problem.gif" alt="A student overwhelmed by videos, PDFs and books, wondering how to recall the key points"
           onError={(e) => { e.currentTarget.style.display = 'none' }}
           style={{ width: '100%', maxWidth: 460, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 24,
                    border: '1px solid var(--line)', boxShadow: '0 24px 48px rgba(42, 27, 74, 0.14)' }} />
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, maxWidth: 480 }}>
        {steps.map(([n, title, text]) => (
          <li key={n} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                           background: 'var(--ink)', color: '#fff', fontWeight: 700, fontSize: 14 }}>{n}</span>
            <span><strong>{title}</strong> <span className="muted">· {text}</span></span>
          </li>
        ))}
      </ol>
    </section>
  )
}