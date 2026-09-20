import { createContext, useContext, useState, type ReactNode } from 'react'
import axios from 'axios'
import type { Role, User } from '../types'

const KEY = 'civiclens.user'
const API_URL =
   import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AuthCtx {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password?: string) => Promise<User>
  sendOtp: (email: string, name?: string) => Promise<{ success: boolean; message: string; otp?: string }>
  registerWithOtp: (payload: {
    name: string
    email: string
    password: string
    role: Role
    locality?: string
    otp: string
  }) => Promise<User>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOtp = async (email: string, name?: string) => {
    setLoading(true)
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()
    try {
      const res = await axios.post(`${API_URL}/auth/send-otp`, {
        email: normalizedEmail,
        name,
      })
      setLoading(false)
      return {
        success: true,
        message: res.data?.message || 'OTP sent successfully',
        otp: res.data?.data?.otp,
      }
    } catch (err: any) {
      setLoading(false)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP. Please check the email.'
      setError(msg)
      throw new Error(msg)
    }
  }

  const registerWithOtp = async (payload: {
    name: string
    email: string
    password: string
    role: Role
    locality?: string
    otp: string
  }): Promise<User> => {
    setLoading(true)
    setError(null)
    const normalizedEmail = payload.email.trim().toLowerCase()

    try {
      const res = await axios.post(`${API_URL}/auth/register-with-otp`, {
        ...payload,
        email: normalizedEmail,
      })

      if (res.data?.success && res.data?.data?.user) {
        const u: User = {
          id: res.data.data.user.id,
          name: res.data.data.user.name,
          email: res.data.data.user.email,
          role: res.data.data.user.role === 'authority' ? 'authority' : 'citizen',
        }
        localStorage.setItem(KEY, JSON.stringify(u))
        setUser(u)
        setLoading(false)
        return u
      }
      throw new Error(res.data?.message || 'Registration failed')
    } catch (err: any) {
      setLoading(false)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Verification failed. Please check OTP code.'
      setError(msg)
      throw new Error(msg)
    }
  }

  const login = async (email: string, password = 'password123'): Promise<User> => {
    setLoading(true)
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: normalizedEmail,
        password,
      })

      if (res.data?.success && res.data?.data?.user) {
        const u: User = {
          id: res.data.data.user.id,
          name: res.data.data.user.name,
          email: res.data.data.user.email,
          role: res.data.data.user.role === 'authority' ? 'authority' : 'citizen',
        }
        localStorage.setItem(KEY, JSON.stringify(u))
        setUser(u)
        setLoading(false)
        return u
      }
      throw new Error(res.data?.message || 'Authentication failed')
    } catch (err: any) {
      setLoading(false)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Could not log in. Check your email & password.'
      setError(msg)
      throw new Error(msg)
    }
  }

  const logout = () => {
    localStorage.removeItem(KEY)
    setUser(null)
    setError(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, error, login, sendOtp, registerWithOtp, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
