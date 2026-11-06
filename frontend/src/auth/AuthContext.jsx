import { createContext, useContext, useState } from 'react'
import { api, setToken } from '../api'

const AuthContext = createContext(null)
const USER_KEY = 'lr_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  function saveSession(data) {
    setToken(data.token)
    const u = { id: data.userId, name: data.name, email: data.email, role: data.role }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  async function login(email, password) {
    saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }))
  }

  async function register(name, email, password, role) {
    saveSession(await api('/auth/register', { method: 'POST', body: { name, email, password, role } }))
  }

  function logout() {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)