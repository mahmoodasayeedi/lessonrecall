import { Link } from 'react-router-dom'
import CourseActions from './CourseActions'

const relationBadge = {
  OWNER: <span className="badge badge-mint">Owner</span>,
  ENROLLED: <span className="badge badge-soft">Enrolled</span>,
  NOT_JOINED: null,
}

// Plum & mint palette: each course gets its own colour, always the same one
const BANDS = [
  ['#2A1B4A', '#4B2E83'], ['#0F7A5C', '#13996F'], ['#B4235A', '#D2487C'],
  ['#4B3FA0', '#7262C9'], ['#1E6F8C', '#2E93B5'],
]

function initials(title) {
  return title.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function CourseCard({ course, action, onChanged }) {
  const [from, to] = BANDS[course.id % BANDS.length]
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* coloured band with initials */}
      <Link to={`/courses/${course.id}`} aria-label={`Open ${course.title}`}
            style={{ position: 'relative', height: 86, background: `linear-gradient(135deg, ${from}, ${to})`, display: 'block' }}>
        <span style={{ position: 'absolute', left: 18, bottom: -22, width: 48, height: 48, borderRadius: '50%',
                       display: 'grid', placeItems: 'center', background: '#fff', color: from, fontWeight: 700,
                       fontSize: 17, border: `3px solid #fff`, boxShadow: '0 6px 16px rgba(42,27,74,.18)' }}>
          {initials(course.title)}
        </span>
        <span style={{ position: 'absolute', right: 14, top: 12 }}>{relationBadge[course.myRelation]}</span>
      </Link>

      <div style={{ padding: '30px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontSize: 20 }}>
          <Link to={`/courses/${course.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{course.title}</Link>
        </h3>
        {course.description && (
          <p className="muted" style={{ margin: 0, fontSize: 14, display: '-webkit-box', WebkitLineClamp: 2,
                                         WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
        )}
        <div className="muted" style={{ fontSize: 13 }}>
          {course.visibility === 'CLASS' ? 'Class course' : 'Private course'} · by {course.ownerName}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <CourseActions course={course} isOwner={course.myRelation === 'OWNER'} onChanged={onChanged} />
        </div>
        {action}
      </div>
    </div>
  )
}