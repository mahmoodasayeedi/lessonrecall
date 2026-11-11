import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const serif = { fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }
const wrap = { maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px, 3vw, 32px)' }
const COURSES = { 'neural-networks': 'Neural Networks', 'java-course': 'Java Basics' }

const METRICS = [
  ['Accuracy', 'An LLM judge compares each answer with a reference answer. For questions the course does not cover, the answer counts as correct only if the tutor says so and cites nothing.'],
  ['Grounded', 'The answer cites a course source: a video minute or a slide page.'],
  ['Video found', 'The answer cites the video where the topic is actually explained.'],
  ['Timestamp', 'The cited minute is within 75 seconds (one transcript chunk) of the expected moment.'],
  ['Latency', 'Time from question to full answer, including search and follow-up suggestions.'],
]

const time = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const watch = (id, s) => `https://www.youtube.com/watch?v=${id}&t=${s}s`

function Mark({ value }) {
  if (value == null) return <span className="muted" aria-label="not applicable">–</span>
  return value
    ? <span style={{ color: 'var(--mint)', fontWeight: 700 }} aria-label="yes">✓</span>
    : <span style={{ color: 'var(--rose)', fontWeight: 700 }} aria-label="no">✗</span>
}

function Score({ value, label, hint }) {
  return (
    <div className="card" style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--mint)' }}>{value}</div>
      <div style={{ fontWeight: 600 }}>{label}</div>
      {hint && <div className="muted" style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  )
}

export default function EvaluationPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch('/eval-results.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No evaluation results yet.'))))
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div style={{ ...wrap, padding: 48 }}>{error}</div>
  if (!data) return <div style={{ ...wrap, padding: 48 }} className="muted">Loading results…</div>

  const s = data.summary
  const covered = data.rows.filter((r) => r.expected !== 'NOT_COVERED')
  const correct = data.rows.filter((r) => r.accuracy === 1).length
  const rows = data.rows.filter((r) =>
    filter === 'all' ? true
    : filter === 'not-covered' ? r.expected === 'NOT_COVERED'
    : filter === 'failed' ? r.accuracy !== 1 || r.timestamp_ok === 0
    : r.course === filter && r.expected !== 'NOT_COVERED')

  const filterButton = (value, text) => (
    <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value}
      style={{ padding: '7px 14px', borderRadius: 999, font: 'inherit', fontSize: 14, cursor: 'pointer',
               border: '1px solid var(--line)', background: filter === value ? 'var(--ink)' : '#fff',
               color: filter === value ? '#fff' : 'var(--ink)' }}>{text}</button>
  )

  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{ borderBottom: '1px solid var(--line)', background: '#fff' }}>
        <div style={{ ...wrap, paddingTop: 14, paddingBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ ...serif, fontSize: 26, textDecoration: 'none', color: 'var(--ink)' }}>
            Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
          </Link>
          <Link to="/" style={{ color: 'var(--ink)' }}>← Back to home</Link>
        </div>
      </header>

      <main style={{ ...wrap, display: 'grid', gap: 32, paddingTop: 40 }}>
        <section style={{ display: 'grid', gap: 8 }}>
          <span className="badge badge-mint" style={{ justifySelf: 'start' }}>LangSmith evaluation</span>
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 48px)' }}>How well does LessonRecall answer?</h1>
          <p className="muted" style={{ maxWidth: 720, lineHeight: 1.55 }}>
            {s.questions} questions about two real courses (Neural Networks and Java Basics), including questions in
            German and questions the courses don't cover. Each answer is checked automatically. Run: {s.experiment}, {s.date}.
          </p>
        </section>

        <section aria-label="Scores" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <Score value={`${s.accuracy}%`} label="Accuracy" hint={`${correct} of ${s.questions} answers correct`} />
          <Score value={`${s.grounded_rate}%`} label="Grounded" hint="cites a video or slide" />
          <Score value={`${s.retrieval_hit_rate}%`} label="Video found" hint={`of ${covered.length} covered questions`} />
          <Score value={`${s.timestamp_correct}%`} label="Timestamp" hint="within 75 seconds" />
          <Score value={`${s.latency_median} s`} label="Median latency" hint={`90% under ${s.latency_p90} s`} />
        </section>

        <section aria-label="How we measure" className="card" style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ ...serif, fontSize: 26 }}>How we measure</h2>
          <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
            {METRICS.map(([term, text]) => (
              <div key={term} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 140px) 1fr', gap: 12 }}>
                <dt style={{ fontWeight: 600 }}>{term}</dt>
                <dd className="muted" style={{ margin: 0, lineHeight: 1.5 }}>{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="All questions" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ ...serif, fontSize: 26 }}>Every question</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filterButton('all', 'All')}
            {filterButton('neural-networks', 'Neural Networks')}
            {filterButton('java-course', 'Java Basics')}
            {filterButton('not-covered', 'Not covered')}
            {filterButton('failed', 'Misses')}
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--soft)' }}>
                  {['Question', 'Course', 'Correct', 'Video', 'Time', 'Latency', 'Cited'].map((h) => (
                    <th key={h} scope="col" style={{ padding: '10px 12px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isOpen = open === r.question
                  return (
                    <Fragment key={r.question}>
                      <tr key={r.question} style={{ borderTop: '1px solid var(--line)' }}>
                        <td style={{ padding: '10px 12px', minWidth: 260 }}>
                          <button type="button" onClick={() => setOpen(isOpen ? null : r.question)} aria-expanded={isOpen}
                            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--ink)',
                                     textAlign: 'left', cursor: 'pointer' }}>
                            {isOpen ? '▾' : '▸'} {r.question}
                          </button>
                          {r.expected === 'NOT_COVERED' && <span className="badge badge-soft" style={{ marginLeft: 8 }}>not covered</span>}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{COURSES[r.course] ?? r.course}</td>
                        <td style={{ padding: '10px 12px' }}><Mark value={r.accuracy} /></td>
                        <td style={{ padding: '10px 12px' }}><Mark value={r.retrieval_hit} /></td>
                        <td style={{ padding: '10px 12px' }}><Mark value={r.timestamp_ok} /></td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{r.latency} s</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          {r.citations.length === 0 && <span className="muted">–</span>}
                          {[...new Map(r.citations.map((c) => [c.video_id + c.seconds, c])).values()].map((c) => (
                            <a key={c.video_id + c.seconds} href={watch(c.video_id, c.seconds)} target="_blank" rel="noreferrer"
                               style={{ marginRight: 8, color: 'var(--mint)' }}>{time(c.seconds)}</a>
                          ))}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={r.question + '-detail'}>
                          <td colSpan={7} style={{ padding: '4px 12px 16px', background: 'var(--paper)' }}>
                            <div style={{ display: 'grid', gap: 10, maxWidth: 900 }}>
                              <div><strong>Expected:</strong> {r.expected === 'NOT_COVERED' ? 'The tutor should say the course does not cover this.' : r.expected}
                                {r.expected_video && (
                                  <> (<a href={watch(r.expected_video, r.expected_seconds)} target="_blank" rel="noreferrer"
                                         style={{ color: 'var(--mint)' }}>{time(r.expected_seconds)}</a>)</>
                                )}
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}><strong>Answer:</strong> {r.answer}</div>
                              <div className="muted"><strong>Judge:</strong> {r.judge}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}