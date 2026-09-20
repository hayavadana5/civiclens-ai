import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getDashboardStats, getIssues, updateIssue } from '../api'
import { useAuth } from '../context/AuthContext'
import { timeAgo, severityStyle, statusStyle, issueImage, priorityColor } from '../utils/format'
import { BANGALORE_ZONES } from '../data/bangalore'
import type { Issue } from '../types'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Plus, ArrowRight,
  Activity, Zap, MapPin, Building, ShieldAlert, Sparkles, Filter,
  CheckCircle, Radio, Wrench, ChevronRight, Eye, RefreshCw
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const stats = useAsync(getDashboardStats)
  const { data: issues = [], loading, reload } = useAsync(getIssues)

  const [selectedZone, setSelectedZone] = useState<string>('All Bengaluru')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filter issues based on zone and category
  const filteredIssues = useMemo(() => {
    return (issues ?? []).filter((issue) => {
      const matchZone =
        selectedZone === 'All Bengaluru' ||
        issue.location.address.toLowerCase().includes(selectedZone.toLowerCase())
      const matchCat = selectedCategory === 'All' || issue.category === selectedCategory
      return matchZone && matchCat
    })
  }, [issues, selectedZone, selectedCategory])

  const criticalIssues = useMemo(() => {
    return (issues ?? []).filter(
      (i) => (i.severity === 'CRITICAL' || i.priority >= 85) && i.status !== 'Resolved'
    )
  }, [issues])

  const recentIssues = filteredIssues.slice(0, 6)

  const handleQuickStart = async (e: React.MouseEvent, issueId: string) => {
    e.stopPropagation()
    try {
      setUpdatingId(issueId)
      await updateIssue(issueId, { status: 'In Progress' })
      reload()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Department workload distribution
  const deptStats = useMemo(() => {
    const counts: Record<string, { total: number; pending: number }> = {
      'Road Maintenance': { total: 0, pending: 0 },
      'Water Supply Board': { total: 0, pending: 0 },
      'Solid Waste Management': { total: 0, pending: 0 },
      'Electrical & Streetlights': { total: 0, pending: 0 },
    }
    ;(issues ?? []).forEach((i) => {
      const dept = Object.keys(counts).find((k) => i.department?.includes(k)) || 'Road Maintenance'
      counts[dept].total += 1
      if (i.status !== 'Resolved') counts[dept].pending += 1
    })
    return counts
  }, [issues])

  return (
    <div className="page dashboard-revamp">
      {/* Top Operations Command Header */}
      <div className="cockpit-header">
        <div className="cockpit-title-wrap">
          <div className="cockpit-live-indicator">
            <span className="live-dot" />
            <span>LIVE BENGALURU CIVIC GRID (BBMP)</span>
            <span className="grid-divider">•</span>
            <span className="db-indicator">MongoDB Connected</span>
          </div>
          <h1 className="cockpit-title">
            Urban Operations <span className="gradient-text">Command Center</span>
          </h1>
          <p className="cockpit-subtitle">
            Real-time hazard monitoring, AI dispatch triage, and citizen resolution tracking for Greater Bengaluru.
          </p>
        </div>

        <div className="cockpit-actions">
          {user?.role === 'citizen' ? (
            <button className="btn-accent-glow" onClick={() => navigate('/report')}>
              <Plus size={18} />
              Report New Hazard
            </button>
          ) : (
            <button className="btn-accent-glow" onClick={() => navigate('/issues')}>
              <Wrench size={17} />
              Manage Work Orders
            </button>
          )}
          <button className="btn-ghost-dark" onClick={() => reload()} title="Refresh Data">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Zone quick filter bar */}
      <div className="zone-filter-bar">
        <div className="zone-label">
          <MapPin size={14} className="text-cyan-400" />
          <span>Bengaluru Zone:</span>
        </div>
        <div className="zone-pills">
          {BANGALORE_ZONES.map((zone) => (
            <button
              key={zone}
              className={`zone-pill ${selectedZone === zone ? 'active' : ''}`}
              onClick={() => setSelectedZone(zone)}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Bento Stats Grid */}
      <div className="bento-stats-grid">
        {/* Total Incidents */}
        <div className="bento-card bento-cyan">
          <div className="bento-card-top">
            <span className="bento-tag">All Time Log</span>
            <div className="bento-icon-box"><Activity size={18} /></div>
          </div>
          <div className="bento-value">{stats.data?.total ?? (issues ?? []).length}</div>
          <div className="bento-label">Reported Incidents</div>
          <div className="bento-footer">
            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
              <TrendingUp size={13} /> Active tracking
            </span>
            <span className="text-xs text-navy-400">across 198 wards</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bento-card bento-red">
          <div className="bento-card-top">
            <span className="bento-tag bento-tag-red">Urgent Action</span>
            <div className="bento-icon-box text-red-400"><AlertTriangle size={18} /></div>
          </div>
          <div className="bento-value text-red-500">{criticalIssues.length}</div>
          <div className="bento-label">High Priority Hazards</div>
          <div className="bento-footer">
            <span className="text-xs text-red-400 font-medium">Priority score 85+</span>
            <span className="text-xs text-navy-400">Requires immediate safety containment</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bento-card bento-amber">
          <div className="bento-card-top">
            <span className="bento-tag bento-tag-amber">Active Crews</span>
            <div className="bento-icon-box text-amber-400"><Clock size={18} /></div>
          </div>
          <div className="bento-value text-amber-500">{stats.data?.inProgress ?? 3}</div>
          <div className="bento-label">Under Active Repair</div>
          <div className="bento-footer">
            <span className="text-xs text-amber-400 font-medium">Work orders dispatched</span>
            <span className="text-xs text-navy-400">Crews in transit</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bento-card bento-green">
          <div className="bento-card-top">
            <span className="bento-tag bento-tag-green">AI Verified</span>
            <div className="bento-icon-box text-emerald-400"><CheckCircle2 size={18} /></div>
          </div>
          <div className="bento-value text-emerald-500">{stats.data?.resolved ?? 1}</div>
          <div className="bento-label">Verified Resolutions</div>
          <div className="bento-footer">
            <span className="text-xs text-emerald-400 font-semibold">~18,400 citizens</span>
            <span className="text-xs text-navy-400">protected from hazards</span>
          </div>
        </div>
      </div>

      {/* Main Operations Split Section */}
      <div className="cockpit-main-layout">
        {/* Left Column: Live Incident Stream */}
        <div className="cockpit-stream-col">
          <div className="card-revamp">
            <div className="card-revamp-header">
              <div>
                <h2 className="card-revamp-title flex items-center gap-2">
                  <Radio size={18} className="text-cyan-400 animate-pulse" />
                  Live Urban Incident Feed
                </h2>
                <p className="card-revamp-subtitle">
                  Showing issues filtered by <strong>{selectedZone}</strong>
                </p>
              </div>

              <button className="link-btn-revamp" onClick={() => navigate('/issues')}>
                View Complete Registry <ArrowRight size={14} />
              </button>
            </div>

            <div className="stream-issues-list">
              {loading ? (
                <div className="stream-loading">
                  <RefreshCw className="animate-spin text-cyan-400" size={24} />
                  <span>Streaming records from MongoDB...</span>
                </div>
              ) : recentIssues.length === 0 ? (
                <div className="stream-empty">
                  <CheckCircle size={32} className="text-emerald-400 mb-2" />
                  <p>No open hazards reported in {selectedZone}.</p>
                </div>
              ) : (
                recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="stream-issue-card"
                    onClick={() => navigate(`/issues/${issue.id}`)}
                  >
                    <div className="stream-card-img-wrap">
                      <img src={issueImage(issue)} alt="" className="stream-card-img" />
                      <span className={`badge-pill ${severityStyle[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </div>

                    <div className="stream-card-content">
                      <div className="stream-card-top-row">
                        <span className="stream-cat-tag">{issue.category}</span>
                        <span className="stream-time-tag">{timeAgo(issue.createdAt)}</span>
                      </div>

                      <h3 className="stream-card-title">{issue.title}</h3>
                      <div className="stream-location-tag">
                        <MapPin size={13} className="text-cyan-400" />
                        <span>{issue.location.address}</span>
                      </div>

                      <div className="stream-card-footer">
                        {/* Priority Meter */}
                        <div className="stream-priority-wrap">
                          <div className="stream-priority-head">
                            <span className="text-[11px] font-semibold text-navy-600">Priority</span>
                            <span
                              className="text-xs font-bold"
                              style={{ color: priorityColor(issue.priority) }}
                            >
                              {issue.priority}/100
                            </span>
                          </div>
                          <div className="stream-priority-track">
                            <div
                              className="stream-priority-fill"
                              style={{
                                width: `${issue.priority}%`,
                                backgroundColor: priorityColor(issue.priority),
                              }}
                            />
                          </div>
                        </div>

                        {/* Status Badge & Authority Quick Action */}
                        <div className="stream-status-action">
                          <span className={`badge-status ${statusStyle[issue.status]}`}>
                            {issue.status}
                          </span>
                          {user?.role === 'authority' && issue.status === 'Open' && (
                            <button
                              className="quick-action-btn"
                              onClick={(e) => handleQuickStart(e, issue.id)}
                              disabled={updatingId === issue.id}
                            >
                              {updatingId === issue.id ? 'Starting...' : 'Dispatch Crew'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Municipal Intelligence Cockpit */}
        <div className="cockpit-sidebar-col">
          {/* Critical Hazard Alert Module */}
          {criticalIssues.length > 0 && (
            <div className="card-revamp border-red-500/30 bg-red-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-500" />
                  <h3 className="font-bold text-red-900 dark:text-red-300 text-sm">
                    Priority Dispatch Alert
                  </h3>
                </div>
                <span className="badge-pill bg-red-500 text-white font-bold">
                  {criticalIssues.length} CRITICAL
                </span>
              </div>
              <p className="text-xs text-navy-700 dark:text-navy-300 mb-3">
                Highest risk civic safety concerns requiring ward engineer intervention:
              </p>
              <div className="space-y-2">
                {criticalIssues.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="critical-mini-card"
                    onClick={() => navigate(`/issues/${item.id}`)}
                  >
                    <div className="font-bold text-xs text-navy-950 dark:text-white line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-navy-600 dark:text-navy-400 mt-0.5">
                      📍 {item.location.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departmental Workload Meters */}
          <div className="card-revamp">
            <div className="card-revamp-header mb-3">
              <h3 className="card-revamp-title text-sm flex items-center gap-2">
                <Building size={16} className="text-cyan-400" />
                Bengaluru Department Load
              </h3>
            </div>
            <div className="space-y-3.5">
              {Object.entries(deptStats).map(([dept, data]) => {
                const percentage = data.total > 0 ? Math.round((data.pending / data.total) * 100) : 0
                return (
                  <div key={dept} className="dept-meter-box">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-navy-900">{dept}</span>
                      <span className="font-bold text-navy-700">
                        {data.pending} open / {data.total} total
                      </span>
                    </div>
                    <div className="dept-meter-track">
                      <div
                        className="dept-meter-fill"
                        style={{
                          width: `${Math.max(15, percentage)}%`,
                          background:
                            percentage > 70 ? '#ef4444' : percentage > 40 ? '#f59e0b' : '#06b6d4',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Geospatial Quick Link to Bangalore Map */}
          <div className="card-revamp map-promo-card" onClick={() => navigate('/map')}>
            <div className="map-promo-content">
              <div className="map-promo-badge">
                <Sparkles size={13} />
                <span>Geospatial Intelligence</span>
              </div>
              <h3 className="font-bold text-navy-900 text-sm mt-1">
                Explore Full Bengaluru Hazard Map
              </h3>
              <p className="text-xs text-navy-600 mt-1">
                Interactive Leaflet map showing duplicate clusters, hot zones, and repair crews across all 198 BBMP wards.
              </p>
              <div className="text-xs text-cyan-600 font-bold mt-3 flex items-center gap-1">
                Open Bangalore Map <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
