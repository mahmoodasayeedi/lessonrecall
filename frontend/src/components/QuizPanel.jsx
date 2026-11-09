import { useState } from 'react'

const level = { easy: 'badge-mint', medium: 'badge-soft', hard: 'badge-rose' }

export default function QuizPanel({ quiz, loading, error, onGenerate, onSeek, onFinish }) {
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)       // option the learner picked for the current question
  const [answers, setAnswers] = useState([])       // [{ question, correct }]

  if (loading) return <p className="muted">Writing your quiz… this takes a few seconds.</p>
  if (!quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <p style={{ margin: 0 }}>Test yourself on this video. Every question links to the minute where it's explained.</p>
        {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
        <button className="btn btn-primary" onClick={onGenerate}>Start a 5-question quiz</button>
      </div>
    )
  }

  const finished = index >= quiz.length
  if (finished) {
    const score = answers.filter((a) => a.correct).length
    const wrong = answers.filter((a) => !a.correct)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 600 }}>
          {score} / {quiz.length} correct
        </div>
        {wrong.length > 0 ? (
          <>
            <div className="muted" style={{ fontSize: 14 }}>Rewatch what you missed:</div>
            {wrong.map((a) => (
              <div key={a.question.question} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <button className="chip" onClick={() => onSeek(a.question.start_seconds)}>▶ {a.question.timestamp}</button>
                <span style={{ fontSize: 14 }}>{a.question.question}</span>
              </div>
            ))}
          </>
        ) : <p style={{ margin: 0, color: 'var(--mint)' }}>Perfect score. Nothing to rewatch.</p>}
        <button className="btn" style={{ alignSelf: 'flex-start' }}
                onClick={() => { setIndex(0); setChosen(null); setAnswers([]); onGenerate() }}>
          Try a new quiz
        </button>
      </div>
    )
  }

  const q = quiz[index]
  const answered = chosen !== null

  function choose(i) {
    if (answered) return
    setChosen(i)
    setAnswers((a) => [...a, { question: q, correct: i === q.correct_option }])
  }

  function next() {
    const nextIndex = index + 1
    setChosen(null)
    setIndex(nextIndex)
    if (nextIndex >= quiz.length) onFinish?.(answers)     // Part D saves the results here
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 13 }}>Question {index + 1} of {quiz.length}</span>
        <span className={`badge ${level[q.difficulty] || 'badge-soft'}`}>{q.difficulty}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: '25px' }}>{q.question}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          const isRight = answered && i === q.correct_option
          const isWrongPick = answered && i === chosen && i !== q.correct_option
          return (
            <button key={i} onClick={() => choose(i)} disabled={answered}
              style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, font: 'inherit', fontSize: 15,
                       cursor: answered ? 'default' : 'pointer', color: 'var(--ink)',
                       border: `1.5px solid ${isRight ? 'var(--mint)' : isWrongPick ? 'var(--rose)' : 'var(--line)'}`,
                       background: isRight ? 'var(--mint-tint)' : isWrongPick ? 'var(--rose-tint)' : 'var(--card)' }}>
              <b style={{ marginRight: 8 }}>{'ABCD'[i]}.</b>{opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{ padding: 14, borderRadius: 12, background: 'var(--paper)', border: '1px solid var(--line)',
                      display: 'flex', flexDirection: 'column', gap: 8 }}>
          <b style={{ color: chosen === q.correct_option ? 'var(--mint)' : 'var(--rose)' }}>
            {chosen === q.correct_option ? 'Correct!' : 'Not quite.'}
          </b>
          <span style={{ fontSize: 14 }}>{q.explanation}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }} className="muted">
            Explained at <button className="chip" onClick={() => onSeek(q.start_seconds)}>▶ {q.timestamp}</button>
          </div>
        </div>
      )}

      {answered && (
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={next}>
          {index + 1 < quiz.length ? 'Next question' : 'See my score'}
        </button>
      )}
    </div>
  )
}