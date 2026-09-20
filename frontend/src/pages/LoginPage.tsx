import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BANGALORE_LOCALITIES } from '../data/bangalore'
import {
  Eye, EyeOff, Shield, User, Lock, Mail, ArrowRight,
  Sparkles, CheckCircle, RefreshCw, KeyRound, MapPin, AlertCircle
} from 'lucide-react'
import type { Role } from '../types'

// Strict email regex
const isValidEmail = (email: string) => {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    email.trim()
  )
}

export default function LoginPage() {
  const { login, sendOtp, registerWithOtp, loading, error: authError } = useAuth()
  const navigate = useNavigate()

  // Mode: 'signin' or 'register'
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  // Register step: 'details' or 'otp'
  const [registerStep, setRegisterStep] = useState<'details' | 'otp'>('details')

  // Form states
  const [role, setRole] = useState<Role>('citizen')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('ananya.rao@example.com')
  const [password, setPassword] = useState('password123')
  const [locality, setLocality] = useState(BANGALORE_LOCALITIES[0].name)
  const [showPassword, setShowPassword] = useState(false)

  // OTP state
  const [otpCode, setOtpCode] = useState('')
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null)
  const [otpSentMsg, setOtpSentMsg] = useState<string | null>(null)

  // Validation message
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Handle Sign In with registered email
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email.trim()) {
      setLocalError('Please enter your email address')
      return
    }
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email format (e.g. name@example.com)')
      return
    }
    if (!password) {
      setLocalError('Please enter your password')
      return
    }

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please verify credentials.')
    }
  }

  // 2. Handle Send OTP for Registration
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Please enter your full name')
      return
    }
    if (!email.trim()) {
      setLocalError('Please enter an email address')
      return
    }
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address (e.g. name@example.com)')
      return
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long')
      return
    }

    try {
      const res = await sendOtp(email, name)
      setReceivedOtp(res.otp || null)
      setOtpSentMsg(`A 6-digit verification code was sent to ${email}`)
      setRegisterStep('otp')
    } catch (err: any) {
      setLocalError(err.message || 'Could not send verification OTP.')
    }
  }

  // 3. Handle Verify OTP and Complete Registration
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setLocalError('Please enter the 6-digit OTP code')
      return
    }

    try {
      await registerWithOtp({
        name,
        email,
        password,
        role,
        locality,
        otp: otpCode.trim(),
      })
      setSuccessMsg('Account registered and verified! Launching dashboard...')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      setLocalError(err.message || 'Invalid or expired OTP code.')
    }
  }

  // Demo accounts helper
  const fillDemoAccount = (demoEmail: string, demoRole: Role) => {
    setMode('signin')
    setRole(demoRole)
    setEmail(demoEmail)
    setPassword('password123')
    setLocalError(null)
  }

  return (
    <div className="login-page-clean">
      {/* Background Ambience */}
      <div className="login-ambient-mesh">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      <div className="login-wrapper">
        {/* Logo & Headline */}
        <div className="login-branding">
          <div className="login-icon-badge">
            <Eye size={28} />
          </div>
          <h1 className="login-main-title">CivicLens AI</h1>
          <p className="login-main-subtitle">
            Bengaluru Civic Governance & AI Resolution Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="clean-auth-card">
          {/* Tabs: Sign In vs Register */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin')
                setLocalError(null)
                setSuccessMsg(null)
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register')
                setRegisterStep('details')
                setLocalError(null)
                setSuccessMsg(null)
                if (email === 'ananya.rao@example.com') setEmail('')
              }}
            >
              Register (First Time)
            </button>
          </div>

          {/* Feedback messages */}
          {(localError || authError) && (
            <div className="auth-alert-error">
              <AlertCircle size={16} className="shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert-success">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= MODE 1: SIGN IN ================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="auth-form-body">
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="signin-email">
                  Registered Email Address
                </label>
                <div className="auth-input-container">
                  <Mail size={16} className="auth-field-icon" />
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLocalError(null)
                    }}
                    placeholder="e.g. name@example.com"
                    className="auth-text-input"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="signin-password">
                  Password
                </label>
                <div className="auth-input-container">
                  <Lock size={16} className="auth-field-icon" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setLocalError(null)
                    }}
                    placeholder="Enter your password"
                    className="auth-text-input pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Sign In to Portal <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Fast 1-click demo logins */}
              <div className="auth-demo-box">
                <div className="auth-demo-label">Quick Sign-in (Demo Accounts):</div>
                <div className="auth-demo-grid">
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => fillDemoAccount('ananya.rao@example.com', 'citizen')}
                  >
                    <span className="font-bold text-xs">Ananya Rao</span>
                    <span className="text-[11px] text-cyan-300">Citizen · Indiranagar</span>
                  </button>
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => fillDemoAccount('roads.dept@civiclens.gov', 'authority')}
                  >
                    <span className="font-bold text-xs">Roads Engineer</span>
                    <span className="text-[11px] text-emerald-300">BBMP Authority</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= MODE 2: REGISTER WITH OTP ================= */}
          {mode === 'register' && registerStep === 'details' && (
            <form onSubmit={handleRequestOtp} className="auth-form-body">
              {/* Role Picker */}
              <div className="auth-role-selector">
                <button
                  type="button"
                  className={`role-select-chip ${role === 'citizen' ? 'active' : ''}`}
                  onClick={() => setRole('citizen')}
                >
                  <User size={15} />
                  <span>Citizen</span>
                </button>
                <button
                  type="button"
                  className={`role-select-chip ${role === 'authority' ? 'active' : ''}`}
                  onClick={() => setRole('authority')}
                >
                  <Shield size={15} />
                  <span>BBMP Authority</span>
                </button>
              </div>

              {/* Full Name */}
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="auth-input-container">
                  <User size={16} className="auth-field-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="auth-text-input"
                    required
                  />
                </div>
              </div>

              {/* Valid Email Address */}
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="reg-email">
                  Valid Email Address (for OTP Verification)
                </label>
                <div className="auth-input-container">
                  <Mail size={16} className="auth-field-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLocalError(null)
                    }}
                    placeholder="e.g. ramesh.kumar@gmail.com"
                    className="auth-text-input"
                    required
                  />
                </div>
                {email && !isValidEmail(email) && (
                  <p className="auth-field-tip text-amber-300">
                    * Format must be a valid email: name@domain.com
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="reg-password">
                  Create Password (min. 6 chars)
                </label>
                <div className="auth-input-container">
                  <Lock size={16} className="auth-field-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="auth-text-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Locality in Bangalore */}
              <div className="auth-field-group">
                <label className="auth-field-label">Bengaluru Ward / Area</label>
                <div className="auth-input-container">
                  <MapPin size={16} className="auth-field-icon" />
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="auth-text-input auth-select-input"
                  >
                    {BANGALORE_LOCALITIES.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name} ({l.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Generating Code...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} /> Send Verification OTP
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: ENTER OTP ================= */}
          {mode === 'register' && registerStep === 'otp' && (
            <form onSubmit={handleVerifyOtpAndRegister} className="auth-form-body">
              <div className="otp-intro-card">
                <KeyRound size={22} className="text-cyan-400 mb-1" />
                <h3 className="font-bold text-white text-sm">Verify Email Address</h3>
                <p className="text-xs text-navy-200 mt-1">
                  We've sent a 6-digit OTP verification code to <strong>{email}</strong>
                </p>

                {receivedOtp && (
                  <div className="otp-demo-badge">
                    <span className="text-[11px] text-cyan-200">Generated Code:</span>
                    <strong className="text-sm text-cyan-300 font-mono tracking-wider">
                      {receivedOtp}
                    </strong>
                    <button
                      type="button"
                      className="otp-autofill-btn"
                      onClick={() => setOtpCode(receivedOtp)}
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}
              </div>

              <div className="auth-field-group mt-3">
                <label className="auth-field-label text-center" htmlFor="otp-input">
                  Enter 6-Digit OTP Code
                </label>
                <div className="auth-input-container">
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="auth-text-input text-center text-xl font-mono tracking-widest font-bold"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Verify & Complete Registration
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-xs mt-2">
                <button
                  type="button"
                  className="text-navy-400 hover:text-white underline cursor-pointer"
                  onClick={() => setRegisterStep('details')}
                >
                  ← Edit registration details
                </button>
                <button
                  type="button"
                  className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  onClick={handleRequestOtp}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="auth-footer-tag">
          <span>Official Greater Bengaluru Civic Resolution Portal</span>
        </div>
      </div>
    </div>
  )
}
