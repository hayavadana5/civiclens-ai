import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, AlertCircle, BarChart3, Map, Plus, LogOut, Eye, Bell,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/issues', label: 'Issues', icon: AlertCircle },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Eye size={20} />
          </div>
          <div>
            <div className="brand-name">CivicLens</div>
            <div className="brand-tagline">AI-Powered Civic</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user?.role === 'citizen' && (
            <button
              className="btn-report"
              onClick={() => navigate('/report')}
            >
              <Plus size={16} />
              Report Issue
            </button>
          )}

          <div className="user-card">
            <div className="user-avatar">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'authority' ? 'Authority' : 'Citizen'}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="topbar">
        <div className="topbar-brand">
          <Eye size={18} />
          <span>CivicLens AI</span>
        </div>
        <button className="icon-btn">
          <Bell size={18} />
        </button>
      </header>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
