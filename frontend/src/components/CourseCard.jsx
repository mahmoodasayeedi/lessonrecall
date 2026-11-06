import { Link } from 'react-router-dom'

const relationBadge = {
  OWNER: <span className="badge badge-mint">Owner</span>,
  ENROLLED: <span className="badge badge-soft">Enrolled</span>,
  NOT_JOINED: null,
}

export default function CourseCard({ course, action }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: 20 }}>
          <Link to={`/courses/${course.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{course.title}</Link>
        </h3>
        {relationBadge[course.myRelation]}
      </div>
      {course.description && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{course.description}</p>}
      <div className="muted" style={{ fontSize: 13 }}>
        {course.visibility === 'CLASS' ? 'Class course' : 'Private course'} · by {course.ownerName}
      </div>
      {action}
    </div>
  )
}