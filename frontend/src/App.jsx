import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import CoursePage from './pages/CoursePage'
import RequireAuth from './auth/RequireAuth'
import SettingsPage from './pages/SettingsPage'
import Toaster from './components/Toaster'
import FinalQuizPage from './pages/FinalQuizPage'
import LandingPage from './pages/LandingPage'
import EvaluationPage from './pages/EvaluationPage'
import InsightsPage from './pages/InsightsPage'

function Placeholder({ title }) {
  return (
    <div className="page">
      <Header />
      <h1 style={{ fontSize: 34, padding: '24px 0' }}>{title}</h1>
    </div>
  )
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
      <Route path="/courses/:id" element={<RequireAuth><CoursePage /></RequireAuth>} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/courses/:id/final-quiz" element={<RequireAuth><FinalQuizPage /></RequireAuth>} />
      <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/courses/:id/insights" element={<RequireAuth><InsightsPage /></RequireAuth>} />
    </Routes>
    <Toaster />
    </>
  )
}