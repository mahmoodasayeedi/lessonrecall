import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { AvatarCircle } from '../components/avatars'

const serif = { fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }

function Stat({ value, label }) {
  return (
    <div className="card" style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--mint)' }}>{value}</div>
      <div className="muted" style={{ fontSize: 14 }}>{label}</div>
    </div>
  )
}

export default function InsightsPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/courses/${id}/insights`).then(setData).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div style={{ padding: 32 }} className="error">{error}</div>
  if (!data) return <div style={{ padding: 32 }} className="muted">Loading class insights…</div>

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <Link to={`/courses/${id}`} style={{ color: 'var(--ink)' }}>← Back to the course</Link>
        <h1 style={{ ...serif, fontSize: 36 }}>Class insights</h1>
        <p className="muted" style={{ margin: 0 }}>How your learners are doing, and which moments to explain again.</p>
      </div>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Stat value={data.learners} label="learners enrolled" />
        <Stat value={data.questionsAsked} label="questions asked in chat" />
        <Stat value={data.quizAnswers} label="quiz answers" />
        <Stat value={data.correctPercent == null ? '–' : `${data.correctPercent}%`} label="answered correctly" />
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ ...serif, fontSize: 24 }}>Where the class struggles</h2>
        {data.weakMoments.length === 0 && <p className="muted" style={{ margin: 0 }}>No wrong answers yet. 🎉</p>}
        {data.weakMoments.map((w) => (
          <div key={`${w.videoId}-${w.startSeconds}`}
               style={{ display: 'grid', gap: 6, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <strong>{w.videoTitle}</strong>
              {w.url && <a className="chip" href={w.url} target="_blank" rel="noreferrer">▶ {w.location}</a>}
            </div>
            <div className="muted" style={{ fontSize: 14 }}>e.g. “{w.sampleQuestion}”</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--soft)', overflow: 'hidden' }}>
                <div style={{ width: `${(w.wrong / w.total) * 100}%`, height: '100%', background: 'var(--rose)' }} />
              </div>
              <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{w.wrong} of {w.total} answers wrong</span>
            </div>
          </div>
        ))}
      </section>

      <section className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <h2 style={{ ...serif, fontSize: 24, padding: '18px 20px 6px' }}>Learners</h2>
        {data.learnerRows.length === 0 ? (
          <p className="muted" style={{ padding: '0 20px 18px' }}>No learners have joined this course yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--soft)' }}>
                {['Learner', 'Quiz answers', 'Correct', 'Weak spots', 'Last activity'].map((h) => (
                  <th key={h} scope="col" style={{ padding: '10px 16px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.learnerRows.map((l) => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <AvatarCircle avatarId={l.avatar} name={l.name} size={32} />{l.name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{l.answers}</td>
                  <td style={{ padding: '10px 16px' }}>{l.correctPercent == null ? '–' : `${l.correctPercent}%`}</td>
                  <td style={{ padding: '10px 16px', color: l.weakSpots > 0 ? 'var(--rose)' : 'inherit' }}>{l.weakSpots}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {l.lastActivity ? new Date(l.lastActivity).toLocaleDateString() : <span className="muted">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}