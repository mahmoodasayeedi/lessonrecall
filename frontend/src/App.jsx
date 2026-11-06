import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import RequireAuth from './auth/RequireAuth'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import CoursePage from './pages/CoursePage'

function Placeholder({ title }) {
  return (
    <div className="page">
      <Header />
      <h1 style={{ fontSize: 34, padding: '24px 0' }}>{title}</h1>
      <div className="card">
        Coming soon. Here is the signature chip: <button className="chip">▶ 2:23</button>{' '}
        <span className="badge badge-mint">Grounded in 2 sources</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
      <Route path="/courses/:id" element={<RequireAuth><CoursePage /></RequireAuth>} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  )
}