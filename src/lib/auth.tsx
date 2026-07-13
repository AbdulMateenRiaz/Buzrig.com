import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

interface Org {
  id: string
  name: string
  slug: string
  plan?: string
}

interface AuthContextType {
  user: User | null
  org: Org | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: { email: string; password: string; firstName: string; lastName: string; company?: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      api.getMe().then((res) => {
        if (res.success && res.data) {
          setUser(res.data)
          if (res.data.memberships?.[0]?.org) {
            setOrg(res.data.memberships[0].org)
          }
        } else {
          api.logout()
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password })
    if (res.success && res.data) {
      api.setToken(res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      setUser(res.data.user)
      setOrg(res.data.org)
      return { success: true }
    }
    return { success: false, error: res.error?.message || 'Login failed' }
  }

  const signup = async (data: { email: string; password: string; firstName: string; lastName: string; company?: string }) => {
    const res = await api.signup(data)
    if (res.success && res.data) {
      api.setToken(res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      setUser(res.data.user)
      setOrg(res.data.org)
      return { success: true }
    }
    return { success: false, error: res.error?.message || 'Signup failed' }
  }

  const logout = () => {
    api.logout()
    setUser(null)
    setOrg(null)
  }

  return (
    <AuthContext.Provider value={{ user, org, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
