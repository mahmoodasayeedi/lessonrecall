import { useState } from 'react'

export default function FlashcardsPanel({ quiz, loading, onGenerate, onSeek }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (loading) return <p className="muted">Creating flashcards…</p>
  if (!quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <p style={{ margin: 0 }}>Review this video with flip cards: question on the front, answer and the minute on the back.</p>
        <button className="btn btn-primary" onClick={onGenerate}>Create flashcards</button>
      </div>
    )
  }

  const card = quiz[index]
  const go = (step) => { setFlipped(false); setIndex((i) => (i + step + quiz.length) % quiz.length) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span className="muted" style={{ fontSize: 13 }}>Card {index + 1} of {quiz.length} · click the card to flip</span>

      <button onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show question' : 'Show answer'}
        style={{ minHeight: 200, padding: 24, borderRadius: 16, font: 'inherit', cursor: 'pointer', textAlign: 'center',
                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                 border: `1.5px solid ${flipped ? 'var(--mint)' : 'var(--line)'}`,
                 background: flipped ? 'var(--mint-tint)' : 'var(--card)', color: 'var(--ink)' }}>
        {!flipped ? (
          <>
            <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question</span>
            <span style={{ fontSize: 19, fontWeight: 600, lineHeight: '27px' }}>{card.question}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mint)' }}>Answer</span>
            <span style={{ fontSize: 19, fontWeight: 600, lineHeight: '27px' }}>{card.options[card.correct_option]}</span>
            <span style={{ fontSize: 14 }}>{card.explanation}</span>
          </>
        )}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button className="btn" onClick={() => go(-1)}>← Previous</button>
        <button className="chip" onClick={() => onSeek(card.start_seconds)}>▶ Watch at {card.timestamp}</button>
        <button className="btn" onClick={() => go(1)}>Next →</button>
      </div>
    </div>
  )
}