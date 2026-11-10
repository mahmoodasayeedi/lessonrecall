import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import UserMenu from './UserMenu'

export default function Header() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    background: isActive ? 'var(--ink)' : 'transparent',
    color: isActive ? '#fff' : 'var(--ink)',
  })
 const { user, logout } = useAuth()
  return (
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                     gap: 16, padding: '16px 0 20px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600 }}>
        Lesson<span style={{ color: 'var(--mint)' }}>Recall</span>
      </div>
      <nav aria-label="Main" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <NavLink to="/home" style={linkStyle}>My courses</NavLink>
        <NavLink to="/catalog" style={linkStyle}>Catalog</NavLink>
        <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
      </nav>
    {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
            <UserMenu />
          </div>
      )}
    </header>
  )
}