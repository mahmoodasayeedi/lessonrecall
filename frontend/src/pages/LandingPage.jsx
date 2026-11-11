import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Orbs, Tilt } from '../components/Scene3D'
import TutorIntro from '../components/TutorIntro'

const serif = { fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }
const wrap = { maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px, 3vw, 32px)' }
const band = { background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }
const btnGhost = { textDecoration: 'none', padding: '11px 18px', borderRadius: 12, border: '1px solid var(--line)',
                   background: '#fff', color: 'var(--ink)', fontWeight: 600 }
const btnMint = { textDecoration: 'none', padding: '11px 18px', borderRadius: 12, background: 'var(--mint)',
                  color: '#fff', fontWeight: 600, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.22)' }

const STEPS = [
  ['Add your course', 'Paste YouTube links or upload videos, recordings and PDFs. LessonRecall transcribes and indexes them.'],
  ['Ask anything', 'Type or speak your question, in any language. Ask about one video or the whole course.'],
  ['Jump to the minute', 'Every answer links to the exact moment or slide page. One click replays it.'],
]
const FEATURES = [
  ['⏱', 'Minute-exact answers', 'Citations point to the exact second of a video or the page of your slides.'],
  ['📍', 'Recall timeline', 'Your questions pin themselves to the video. Missed quiz topics show up as weak zones to replay.'],
  ['✅', 'Quizzes and flashcards', 'Practise any video. Every question links back to where the answer is explained.'],
  ['🏁', 'Final course quiz', 'Instructors review and publish one final quiz with a pass mark. Learners get one attempt.'],
  ['🎤', 'Any language, by voice', 'Ask by voice, get answers in your language, and let the tutor read them aloud.'],
  ['🛡', 'Answer Guard', "If the course doesn't cover a question, LessonRecall says so instead of making something up."],
]
const FAQ = [
  ['Does LessonRecall make things up?', 'No. It answers only from your course material. If a topic is not covered, it says so.'],
  ['Which videos can I add?', 'YouTube links, MP4 and MP3 files up to 25 MB, and PDF slides.'],
  ['Which languages are supported?', 'Ask in any language. Answers can be set to English, German, Spanish, French, Arabic, Urdu or Hindi.'],
  ['Who can see my course?', 'Private courses are only yours. Class courses are visible to the learners who join them.'],
]

export default function LandingPage() {
  const { user } = useAuth()
  const [evalSummary, setEvalSummary] = useState(null)
  useEffect(() => {
    fetch('/eval-results.json').then((r) => (r.ok ? r.json() : null))
      .then((d) => setEvalSummary(d?.summary ?? null)).catch(() => {})
  }, [])
  if (user) return <Navigate to="/home" replace />

  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* 1. Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(247,245,251,.92)',
                       backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ ...wrap, paddingTop: 14, paddingBottom: 14, display: 'flex', flexWrap: 'wrap',
                      alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link to="/" style={{ ...serif, fontSize: 26, textDecoration: 'none', color: 'var(--ink)' }}>
            Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
          </Link>
          <nav aria-label="Main" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[['#how', 'How it works'], ['#features', 'Features'], ['#instructors', 'For instructors'], ['#faq', 'FAQ']].map(([href, text]) => (
              <a key={href} href={href} style={{ textDecoration: 'none', color: 'var(--ink)', padding: '10px 12px' }}>{text}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={btnGhost}>Log in</Link>
            <Link to="/login?mode=signup" style={btnMint}>Get started</Link>
          </div>
        </div>
      </header>

      {/* 2. Hero */}
      <section style={{ ...wrap, paddingTop: 72, paddingBottom: 56, display: 'grid', gap: 64, alignItems: 'center',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <div style={{ display: 'grid', gap: 22, position: 'relative', zIndex: 1 }}>
          <span className="badge badge-mint" style={{ justifySelf: 'start' }}>AI study assistant for courses</span>
          <h1 style={{ ...serif, fontSize: 'clamp(40px, 5vw, 60px)', lineHeight: 1.04 }}>
            Ask your course.<br /><span style={{ color: 'var(--mint)' }}>Get the exact minute.</span>
          </h1>
          <p className="muted" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 500 }}>
            Answers come only from your course videos and slides, with a link to the exact moment it was explained.
            Ask by typing or by voice, in your own language.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/login?mode=signup" style={{ ...btnMint, padding: '15px 26px', fontSize: 17, borderRadius: 14 }}>Get started free</Link>
            <Link to="/login" style={{ ...btnGhost, padding: '15px 26px', fontSize: 17, borderRadius: 14 }}>Log in</Link>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>Free for your class · No credit card needed</div>
          <TutorIntro />
        </div>

        <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', padding: '40px 0' }}>
          <Orbs />
          <Tilt>
            <div className="card glass" style={{ width: '100%', padding: 22, display: 'grid', gap: 14 }} aria-label="Example answer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/avatar.png" alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mint)' }} />
                <div style={{ ...serif, fontSize: 19 }}>Ask LessonRecall</div>
                <span className="badge badge-soft" style={{ marginLeft: 'auto' }}>This video</span>
              </div>
              <div style={{ justifySelf: 'end', maxWidth: '80%', padding: '10px 14px', borderRadius: '14px 14px 4px 14px',
                            background: 'var(--ink)', color: '#fff', fontSize: 15 }}>What does the bias of a neuron do?</div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', background: '#fff', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span className="badge badge-mint">Grounded in 2 sources</span>
                  <span className="badge badge-soft">Video and slides agree</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                  The bias shifts how high the weighted sum must be before the neuron becomes active. A negative bias makes it harder to activate.{' '}
                  <span className="chip">▶ 10:24</span> <span className="chip-outline">page 6</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="btn" style={{ padding: '4px 12px', fontSize: 13 }}>🔊 Listen</span>
                  <span className="muted" style={{ fontSize: 12 }}>Used: video_search</span>
                </div>
              </div>
              <div style={{ position: 'relative', height: 46, borderRadius: 12, background: 'var(--soft)' }} aria-hidden="true">
                <span style={{ position: 'absolute', left: '12%', top: 18, height: 10, width: '9%', borderRadius: 4,
                               background: 'var(--rose-tint)', border: '1.5px solid var(--rose)' }} />
                <span style={{ position: 'absolute', left: '44%', top: 8, width: 14, height: 14, borderRadius: '50%', background: 'var(--mint)', border: '3px solid #fff' }} />
                <span style={{ position: 'absolute', left: '72%', top: 8, width: 14, height: 14, borderRadius: '50%', background: 'var(--mint)', border: '3px solid #fff' }} />
                <span className="muted" style={{ position: 'absolute', left: 12, bottom: 4, fontSize: 11 }}>Recall timeline</span>
              </div>
            </div>
          </Tilt>
        </div>
      </section>

      {/* 3. Works with */}
      <section aria-label="Works with" style={band}>
        <div className="muted" style={{ ...wrap, paddingTop: 20, paddingBottom: 20, display: 'flex', flexWrap: 'wrap',
                                         justifyContent: 'center', gap: '12px 28px', fontSize: 15 }}>
          <strong style={{ color: 'var(--ink)' }}>Works with</strong>
          {['YouTube links', 'MP4 and MP3', 'PDF slides', '7 answer languages', 'Voice questions', 'Read-aloud answers'].map((t) => <span key={t}>{t}</span>)}
        </div>
      </section>

      {/* 4. Problem → fix */}
      <section style={{ ...wrap, paddingTop: 88, paddingBottom: 88, display: 'grid', gap: 40, alignItems: 'center',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--rose)' }}>THE PROBLEM</span>
          <h2 style={{ ...serif, fontSize: 40, lineHeight: 1.1 }}>You know it was explained. But where?</h2>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 460 }}>
            Two-hour lectures, slide decks and recordings pile up. Finding the one minute that answers your question takes longer than the question itself.
          </p>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--mint)', marginTop: 12 }}>THE FIX</span>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 460 }}>
            LessonRecall turns every course into something you can ask, and every answer into a moment you can replay.
          </p>
        </div>
        <img src="/problem.gif" alt="A student overwhelmed by videos, PDFs and books, wondering how to recall the key points"
             style={{ justifySelf: 'center', width: '100%', maxWidth: 440, aspectRatio: '1 / 1', objectFit: 'cover',
                      borderRadius: 24, border: '1px solid var(--line)', boxShadow: '0 24px 48px rgba(42,27,74,.14)' }} />
      </section>

      {/* 5. How it works */}
      <section id="how" style={band}>
        <div style={{ ...wrap, paddingTop: 80, paddingBottom: 80, display: 'grid', gap: 36 }}>
          <h2 style={{ ...serif, fontSize: 40, textAlign: 'center' }}>How it works</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {STEPS.map(([title, text], i) => (
              <li key={title} style={{ border: '1px solid var(--line)', borderRadius: 20, padding: 26, background: 'var(--paper)', display: 'grid', gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#fff',
                               background: i === 2 ? 'var(--mint)' : 'var(--ink)' }}>{i + 1}</span>
                <h3 style={{ fontSize: 20 }}>{title}</h3>
                <p className="muted" style={{ lineHeight: 1.55 }}>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Features */}
      <section id="features" style={{ ...wrap, paddingTop: 88, paddingBottom: 88, display: 'grid', gap: 36 }}>
        <h2 style={{ ...serif, fontSize: 40, textAlign: 'center' }}>Everything you need to remember a course</h2>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {FEATURES.map(([icon, title, text]) => (
            <article key={title} className="card" style={{ borderRadius: 20, display: 'grid', gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 26 }}>{icon}</span>
              <h3 style={{ fontSize: 19 }}>{title}</h3>
              <p className="muted" style={{ lineHeight: 1.55 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 7. Learners / instructors */}
      <section id="instructors" style={band}>
        <div style={{ ...wrap, paddingTop: 80, paddingBottom: 80, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {[['For learners', 'var(--mint-tint)', ['Join your class course from the catalog', 'Ask questions and replay the exact minute',
                                                  'Practise with quizzes, flashcards and weak topics', 'Take the final quiz when you are ready']],
            ['For instructors', 'var(--soft)', ['Create a class course in minutes from your videos and slides', 'Every answer stays inside your material',
                                                'Generate, review and publish a final quiz', 'See who passed in the class results']]]
            .map(([title, bg, items]) => (
              <div key={title} style={{ borderRadius: 24, padding: 32, background: bg, display: 'grid', gap: 12 }}>
                <h2 style={{ ...serif, fontSize: 30 }}>{title}</h2>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, lineHeight: 1.5 }}>
                  {items.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            ))}
        </div>
      </section>

      {/* 8. Tested – fill in with real LangSmith results */}
      <section aria-label="Tested" style={{ ...wrap, paddingTop: 72, paddingBottom: 72, display: 'grid', justifyItems: 'center', gap: 14, textAlign: 'center' }}>
        <h2 style={{ ...serif, fontSize: 34 }}>Tested on real course questions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          {[[evalSummary ? `${evalSummary.accuracy}%` : '…', 'answers correct'],
            [evalSummary ? `${evalSummary.grounded_rate}%` : '…', 'answers cite the course'],
            [evalSummary ? `${evalSummary.latency_median} s` : '…', 'median answer time']].map(([value, label]) => (
            <div key={label} style={{ minWidth: 200, border: '1px solid var(--line)', borderRadius: 16, padding: 18, background: '#fff' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--mint)' }}>{value}</div>
              <div className="muted" style={{ fontSize: 14 }}>{label}</div>
            </div>
          ))}
        </div>
                <Link to="/evaluation" style={{ color: 'var(--mint)', fontWeight: 600 }}>See all {evalSummary?.questions ?? 30} questions and how we measure →</Link>
      </section>

      {/* 9. FAQ */}
      <section id="faq" style={{ background: '#fff', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '80px clamp(16px, 3vw, 32px)', display: 'grid', gap: 12 }}>
          <h2 style={{ ...serif, fontSize: 40, textAlign: 'center', marginBottom: 12 }}>Questions</h2>
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '16px 20px', background: 'var(--paper)' }}>
              <summary style={{ fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>{q}</summary>
              <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.55 }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Final CTA + footer */}
      <section style={{ background: 'var(--ink)', color: '#fff' }}>
        <div style={{ ...wrap, paddingTop: 72, paddingBottom: 72, display: 'grid', justifyItems: 'center', gap: 18, textAlign: 'center' }}>
          <h2 style={{ ...serif, fontSize: 44, color: '#fff' }}>Never lose a lesson again.</h2>
          <p style={{ fontSize: 17, color: '#D9D2EA' }}>Create your account and ask your first question in two minutes.</p>
          <Link to="/login?mode=signup" style={{ ...btnMint, padding: '15px 28px', fontSize: 17, borderRadius: 14 }}>Get started free</Link>
        </div>
      </section>
      <footer className="muted" style={{ ...wrap, paddingTop: 28, paddingBottom: 28, display: 'flex', flexWrap: 'wrap',
                                         justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
        <span><span style={{ ...serif, color: 'var(--ink)' }}>LessonRecall</span> · Ironhack AI Engineering final project</span>
        <span>React · Spring Boot · FastAPI · LangGraph · Whisper · Pinecone</span>
      </footer>
    </div>
  )
}