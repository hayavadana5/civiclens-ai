import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getIssues } from '../api'
import { useAuth } from '../context/AuthContext'
import { timeAgo, severityStyle, statusStyle, issueImage, priorityColor } from '../utils/format'
import type { Category, Status, Severity } from '../types'
import {
  Search, Filter, Plus, AlertCircle, ArrowUpDown, ChevronRight, Layers, ShieldAlert,
} from 'lucide-react'

const CATEGORIES: ('All' | Category)[] = [
  'All', 'Roads', 'Sanitation', 'Water', 'Lighting', 'Municipal Safety', 'Drainage', 'Signage'
]

const STATUSES: ('All' | Status)[] = ['All', 'Open', 'In Progress', 'Resolved']

export default function IssuesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: issues = [], loading } = useAsync(getIssues)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'All' | Category>('All')
  const [status, setStatus] = useState<'All' | Status>('All')
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority')

  const filtered = useMemo(() => {
    return (issues ?? [])
      .filter((i) => {
        const matchesSearch =
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase()) ||
          i.location.address.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === 'All' || i.category === category
        const matchesStatus = status === 'All' || i.status === status
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priority - a.priority
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [issues, search, category, status, sortBy])

  return (
    <div className="page">
      {/* Top action bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Civic Issues</h1>
          <p className="page-subtitle">
            Browse, filter, and track community reports categorized and prioritized by AI.
          </p>
        </div>
        {user?.role === 'citizen' && (
          <button className="btn-primary" onClick={() => navigate('/report')}>
            <Plus size={16} />
            Report Issue
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="toolbar-card">
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search issues by keyword, title, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-filters">
          <div className="filter-select-group">
            <Filter size={15} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="select-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="select-input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <ArrowUpDown size={15} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select-input"
            >
              <option value="priority">Highest Priority</option>
              <option value="date">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results counter */}
      <div className="results-header">
        <span className="results-count">
          Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'issue' : 'issues'}
        </span>
        {(search || category !== 'All' || status !== 'All') && (
          <button
            className="clear-btn"
            onClick={() => {
              setSearch('')
              setCategory('All')
              setStatus('All')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Issues list / grid */}
      {loading ? (
        <div className="card loading-card">
          <div className="spinner" />
          <p>Loading civic issues...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-card">
          <AlertCircle size={40} className="empty-icon text-navy-400" />
          <h3>No issues found</h3>
          <p>Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="issues-grid">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="issue-card"
              onClick={() => navigate(`/issues/${issue.id}`)}
            >
              <div className="issue-card-image-wrap">
                <img src={issueImage(issue)} alt="" className="issue-card-image" />
                <div className="issue-card-badge-overlay">
                  <span className={`badge ${severityStyle[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <span className={`badge ${statusStyle[issue.status]}`}>
                    {issue.status}
                  </span>
                </div>
              </div>

              <div className="issue-card-body">
                <div className="issue-card-header">
                  <span className="issue-card-cat">{issue.category}</span>
                  <span className="issue-card-time">{timeAgo(issue.createdAt)}</span>
                </div>

                <h3 className="issue-card-title">{issue.title}</h3>
                <p className="issue-card-desc">{issue.description}</p>

                <div className="issue-card-location">
                  📍 {issue.location.address}
                </div>

                {issue.clusterId && (
                  <div className="issue-card-cluster">
                    <Layers size={13} />
                    <span>Merged in cluster · {issue.reports} reports</span>
                  </div>
                )}

                {/* Priority bar */}
                <div className="issue-card-priority-row">
                  <div className="priority-label">
                    <ShieldAlert size={14} style={{ color: priorityColor(issue.priority) }} />
                    <span>Priority Score</span>
                  </div>
                  <span className="priority-num" style={{ color: priorityColor(issue.priority) }}>
                    {issue.priority}/100
                  </span>
                </div>
                <div className="priority-track">
                  <div
                    className="priority-fill"
                    style={{
                      width: `${issue.priority}%`,
                      backgroundColor: priorityColor(issue.priority),
                    }}
                  />
                </div>
              </div>

              <div className="issue-card-footer">
                <span className="issue-card-dept">{issue.department}</span>
                <span className="view-link">
                  Details <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
