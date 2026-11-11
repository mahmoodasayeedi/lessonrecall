import { useState } from 'react'

// Flip cards from the video's quiz questions, with "I knew it" / "Review again".
export default function FlashcardsPanel({ quiz, loading, onGenerate, onSeek }) {
  const [deck, setDeck] = useState(null)        // order of card indexes; "review again" cards are added at the end
  const [pos, setPos] = useState(0)             // position in the deck
  const [flipped, setFlipped] = useState(false)
  const [firstTry, setFirstTry] = useState({})  // card index → true (knew it) / false (needed review)

  if (loading) return <p className="muted">Creating flashcards…</p>
  if (!quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <p style={{ margin: 0 }}>Review this video with flip cards: question on the front, answer and the minute on the back.</p>
        <button className="btn btn-primary" onClick={onGenerate}>Create flashcards</button>
      </div>
    )
  }

  const order = deck ?? quiz.map((_, i) => i)
  const finished = pos >= order.length
  const restart = () => { setDeck(null); setPos(0); setFlipped(false); setFirstTry({}) }

  // ---------- End of the deck: score + cards to rewatch ----------
  if (finished) {
    const known = Object.values(firstTry).filter(Boolean).length
    const toReview = Object.keys(firstTry).filter((i) => !firstTry[i]).map(Number)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--mint)' }}>{known} / {quiz.length}</div>
          <div style={{ fontWeight: 600 }}>{known === quiz.length ? 'You knew every card! 🎉' : 'cards known on the first try'}</div>
        </div>
        {toReview.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Worth rewatching</div>
            {toReview.map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                    padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--card)' }}>
                <span style={{ fontSize: 14 }}>{quiz[i].question}</span>
                <button className="chip" onClick={() => onSeek(quiz[i].start_seconds)}>▶ {quiz[i].timestamp}</button>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={restart}>Practice again</button>
      </div>
    )
  }

  // ---------- One card ----------
  const cardIndex = order[pos]
  const card = quiz[cardIndex]

  function answer(knew) {
    setFirstTry((f) => (cardIndex in f ? f : { ...f, [cardIndex]: knew }))   // count only the first try
    setDeck(knew ? order : [...order, cardIndex])                             // "review again" → back of the deck
    setFlipped(false)
    setPos((p) => p + 1)
  }

  const face = { position: 'absolute', inset: 0, padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column',
                 alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', overflowY: 'auto',
                 backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 13 }}>Card {pos + 1} of {order.length} · click the card to flip</span>
        <span className="muted" style={{ fontSize: 13 }}>{Object.values(firstTry).filter(Boolean).length} known</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--soft)', overflow: 'hidden' }}>
        <div style={{ width: `${(pos / order.length) * 100}%`, height: '100%', background: 'var(--mint)', transition: 'width .3s' }} />
      </div>

      {/* key={pos}: every new card starts face-up without animating, so the next answer never flashes */}
      <div key={pos} style={{ perspective: 1000 }}>
        <button onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show question' : 'Show answer'}
          style={{ position: 'relative', width: '100%', height: 260, padding: 0, border: 'none', background: 'none',
                   font: 'inherit', color: 'var(--ink)', cursor: 'pointer', transformStyle: 'preserve-3d',
                   transition: 'transform .5s ease', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div aria-hidden={flipped} style={{ ...face, background: 'var(--card)', border: '1.5px solid var(--line)' }}>
            <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question</span>
            <span style={{ fontSize: 19, fontWeight: 600, lineHeight: '27px' }}>{card.question}</span>
          </div>
          <div aria-hidden={!flipped} style={{ ...face, transform: 'rotateY(180deg)', background: 'var(--mint-tint)',
                                               border: '1.5px solid var(--mint)' }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mint)' }}>Answer</span>
            <span style={{ fontSize: 19, fontWeight: 600, lineHeight: '27px' }}>{card.options[card.correct_option]}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>{card.explanation}</span>
          </div>
        </button>
      </div>

      {flipped ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={() => answer(false)}>↻ Review again</button>
          <button className="chip" onClick={() => onSeek(card.start_seconds)}>▶ Watch at {card.timestamp}</button>
          <button className="btn btn-primary" onClick={() => answer(true)}>✓ I knew it</button>
        </div>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: 13, textAlign: 'center' }}>Think of the answer, then flip the card.</p>
      )}
    </div>
  )
}