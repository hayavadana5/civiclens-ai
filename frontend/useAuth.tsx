import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Role, User } from '../types'

const KEY = 'civiclens.user'

const DEMO: Record<Role, User> = {
  citizen: { id: 'u-citizen', name: 'Riya Sharma', email: 'citizen@demo.com', role: 'citizen' },
  authority: { id: 'u-authority', name: 'Arjun Mehta', email: 'authority@demo.com', role: 'authority' },
}

interface AuthCtx {
  user: User | null
  login: (role: Role, email?: string) => User
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  const login = (role: Role, email?: string) => {
    const u = { ...DEMO[role], email: email?.trim() || DEMO[role].email }
    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
    return u
  }
  const logout = () => {
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
