import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import { toast } from '../components/toast'

const LETTERS = ['A', 'B', 'C', 'D']

export default function FinalQuizPage() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quiz, setQuiz] = useState(undefined)          // undefined = loading, null = none yet
  const [error, setError] = useState('')

  const loadQuiz = useCallback(() => {
    api(`/courses/${id}/final-quiz`).then(setQuiz).catch(() => setQuiz(null))
  }, [id])

  useEffect(() => {
    api(`/courses/${id}`).then(setCourse).catch((e) => setError(e.message))
    api(`/courses/${id}/materials`).then(setMaterials).catch(() => {})
    loadQuiz()
  }, [id, loadQuiz])

  if (error) return <><Header /><div className="page"><p className="error">{error}</p></div></>
  if (!course || quiz === undefined) return <><Header /><div className="page"><p className="muted">Loading…</p></div></>

  const isOwner = course.myRelation === 'OWNER'
  // "Rewatch" link: find the material for a videoId, open the course at that minute
  const rewatchLink = (q) => {
    const m = materials.find((x) => x.externalId === q.videoId)
    return m && q.startSeconds != null ? `/courses/${id}?m=${m.id}&t=${q.startSeconds}` : null
  }

  return (
    <>
      <Header />
      <div className="page" style={{ maxWidth: 860, paddingBottom: 60 }}>
        <Link to={`/courses/${id}`} className="muted" style={{ fontSize: 14 }}>← Back to {course.title}</Link>
        <h1 style={{ fontSize: 32, margin: '8px 0 20px' }}>Final quiz</h1>
        {isOwner
          ? <OwnerView courseId={id} quiz={quiz} setQuiz={setQuiz} rewatchLink={rewatchLink} />
          : <LearnerView courseId={id} quiz={quiz} setQuiz={setQuiz} rewatchLink={rewatchLink} />}
      </div>
    </>
  )
}

/* ---------------- Instructor ---------------- */

function OwnerView({ courseId, quiz, setQuiz, rewatchLink }) {
  const [count, setCount] = useState(10)
  const [passMark, setPassMark] = useState(quiz?.passMark ?? 70)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (quiz?.status === 'PUBLISHED') api(`/courses/${courseId}/final-quiz/results`).then(setResults).catch(() => {})
  }, [courseId, quiz?.status])

  async function generate() {
    setBusy(true)
    try {
      setQuiz(await api(`/courses/${courseId}/final-quiz/generate?count=${count}`, { method: 'POST' }))
      toast('Draft quiz generated. Please review it.')
    } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }

  async function remove(qid) {
    try { setQuiz(await api(`/courses/${courseId}/final-quiz/questions/${qid}`, { method: 'DELETE' })) }
    catch (e) { toast(e.message, 'error') }
  }

  async function publish() {
    if (!window.confirm(`Publish ${quiz.questions.length} questions with a pass mark of ${passMark}%? It can't be changed afterwards.`)) return
    try {
      setQuiz(await api(`/courses/${courseId}/final-quiz/publish`, { method: 'POST', body: { passMark: Number(passMark) } }))
      toast('Final quiz published for your class')
    } catch (e) { toast(e.message, 'error') }
  }

  if (!quiz || quiz.status === 'DRAFT') {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20 }}>{quiz ? 'Review the draft' : 'Create the final quiz'}</h2>
          <p className="muted">AI writes questions across all videos and PDFs of this course. You review them, set a pass mark and publish. Learners get one attempt.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <select className="input" style={{ width: 160 }} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
            </select>
            <button className="btn btn-primary" onClick={generate} disabled={busy}>
              {busy ? 'Generating… (about 30 s)' : quiz ? 'Regenerate' : 'Generate quiz'}
            </button>
          </div>
        </div>

        {quiz && (
          <>
            {quiz.questions.map((q, i) => (
              <QuestionCard key={q.id} q={q} index={i} rewatch={rewatchLink(q)}
                            action={<button className="btn" style={{ color: 'var(--rose)', padding: '4px 10px', fontSize: 13 }}
                                            onClick={() => remove(q.id)}>Remove</button>} />
            ))}
            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                Pass mark
                <input className="input" type="number" min={1} max={100} value={passMark} style={{ width: 90 }}
                       onChange={(e) => setPassMark(e.target.value)} /> %
              </label>
              <button className="btn btn-primary" onClick={publish}>Publish to class ({quiz.questions.length} questions)</button>
            </div>
          </>
        )}
      </div>
    )
  }

  // PUBLISHED: show class results
  const passed = results.filter((r) => r.passed).length
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <Stat label="Questions" value={quiz.questions.length} />
        <Stat label="Pass mark" value={`${quiz.passMark}%`} />
        <Stat label="Attempts" value={results.length} />
        <Stat label="Passed" value={`${passed} / ${results.length}`} />
      </div>
      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Class results</h2>
        {results.length === 0 ? <p className="muted">No learner has taken the quiz yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={th}>Learner</th><th style={th}>Score</th><th style={th}>Result</th><th style={th}>Taken</th>
            </tr></thead>
            <tbody>{results.map((r) => (
              <tr key={r.email} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={td}><div>{r.learnerName}</div><div className="muted" style={{ fontSize: 12 }}>{r.email}</div></td>
                <td style={td}>{r.score} / {r.total} ({r.percent}%)</td>
                <td style={td}><span className={`badge ${r.passed ? 'badge-mint' : 'badge-rose'}`}>{r.passed ? 'Passed' : 'Not yet'}</span></td>
                <td style={td}>{new Date(r.takenAt).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <h2 style={{ fontSize: 20 }}>Questions</h2>
      {quiz.questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} rewatch={rewatchLink(q)} />)}
    </div>
  )
}

/* ---------------- Learner ---------------- */

function LearnerView({ courseId, quiz, setQuiz, rewatchLink }) {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [busy, setBusy] = useState(false)

  if (!quiz) return <div className="card"><p className="muted">Your instructor hasn't published a final quiz for this course yet.</p></div>

  // Already taken: show result + review
  if (quiz.myAttempt) {
    const a = quiz.myAttempt
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 40, fontFamily: 'Newsreader, serif' }}>{a.score} / {a.total}</div>
          <span className={`badge ${a.passed ? 'badge-mint' : 'badge-rose'}`} style={{ fontSize: 15 }}>
            {a.passed ? 'Passed 🎉' : 'Not yet'}
          </span>
          <span className="muted">Pass mark {quiz.passMark}%</span>
        </div>
        {quiz.questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} index={i} chosen={a.answers[i]} rewatch={rewatchLink(q)} />
        ))}
      </div>
    )
  }

  if (!started) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <h2 style={{ fontSize: 22 }}>Ready for the final quiz?</h2>
        <p className="muted">{quiz.questions.length} questions · pass mark {quiz.passMark}% · <strong>one attempt</strong>. You can go back and change answers before submitting.</p>
        <button className="btn btn-primary" onClick={() => { setAnswers(Array(quiz.questions.length).fill(null)); setStarted(true) }}>
          Start quiz
        </button>
      </div>
    )
  }

  const q = quiz.questions[index]
  const total = quiz.questions.length
  const answered = answers.filter((x) => x !== null).length
  const choose = (opt) => setAnswers((list) => list.map((v, i) => (i === index ? opt : v)))

  async function submit() {
    if (answered < total) return toast(`Please answer all questions (${answered}/${total})`, 'error')
    if (!window.confirm('Submit your answers? You have only one attempt.')) return
    setBusy(true)
    try {
      setQuiz(await api(`/courses/${courseId}/final-quiz/attempt`, { method: 'POST', body: { answers } }))
    } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true">🏁</span>
        <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--soft)', overflow: 'hidden' }}>
          <div style={{ width: `${(answered / total) * 100}%`, height: '100%', background: 'var(--mint)', transition: 'width .2s' }} />
        </div>
        <span className="badge badge-soft">{answered} / {total}</span>
      </div>

      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 4, height: 26, borderRadius: 2, background: 'var(--mint)' }} />
          <span className="badge badge-soft">Question {index + 1}</span>
          <span className="badge badge-mint">{q.topic}</span>
        </div>
        <p style={{ fontSize: 18, lineHeight: 1.5 }}>{q.question}</p>
        <div style={{ display: 'grid', gap: 10 }} role="radiogroup" aria-label="Answer options">
          {q.options.map((opt, i) => {
            const selected = answers[index] === i
            return (
              <button key={i} role="radio" aria-checked={selected} onClick={() => choose(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: '14px 16px',
                         borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
                         background: selected ? 'var(--mint-tint)' : '#fff', color: 'var(--ink)',
                         border: `1.5px solid ${selected ? 'var(--mint)' : 'var(--line)'}`,
                         boxShadow: 'inset 0 -2px 0 var(--line)' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                               border: `1.5px solid ${selected ? 'var(--mint)' : 'var(--line)'}`, fontWeight: 600,
                               background: selected ? 'var(--mint)' : '#fff', color: selected ? '#fff' : 'var(--ink)' }}>
                  {LETTERS[i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>‹ Previous</button>
          {index + 1 < total
            ? <button className="btn" onClick={() => setIndex((i) => i + 1)}>Next ›</button>
            : <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit answers'}</button>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Shared ---------------- */

function QuestionCard({ q, index, chosen, rewatch, action }) {
  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span className="badge badge-soft">Q{index + 1}</span>
        <span className="badge badge-mint">{q.topic}</span>
        <span className="muted" style={{ fontSize: 13 }}>{q.difficulty}</span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      <p style={{ fontWeight: 600 }}>{q.question}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {q.options.map((opt, i) => {
          const correct = i === q.correctOption
          const wrongPick = chosen === i && !correct
          return (
            <li key={i} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 14,
                                 background: correct ? 'var(--mint-tint)' : wrongPick ? 'var(--rose-tint)' : 'transparent',
                                 color: correct ? 'var(--mint)' : wrongPick ? 'var(--rose)' : 'var(--ink)' }}>
              <strong>{LETTERS[i]}.</strong> {opt}
              {correct && ' ✓'}{wrongPick && ' ✗ your answer'}{chosen === i && correct && ' (your answer)'}
            </li>
          )
        })}
      </ul>
      {q.explanation && <p className="muted" style={{ fontSize: 14 }}>{q.explanation}</p>}
      {q.location && (
        rewatch
          ? <Link to={rewatch} className="chip" style={{ justifySelf: 'start' }}>▶ Rewatch at {q.location}</Link>
          : <span className="badge badge-soft" style={{ justifySelf: 'start' }}>Source: {q.location}</span>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return <div><div className="muted" style={{ fontSize: 13 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 600 }}>{value}</div></div>
}

const th = { padding: '8px 6px', fontWeight: 500 }
const td = { padding: '10px 6px', verticalAlign: 'top' }