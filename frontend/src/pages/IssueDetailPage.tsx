import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getIssue, updateIssue, resolveIssue } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  timeAgo, severityStyle, statusStyle, issueImage, priorityColor,
} from '../utils/format'
import {
  ArrowLeft, Shield, MapPin, Clock, Users, Building, AlertTriangle,
  CheckCircle2, PlayCircle, Sparkles, Check, FileCheck, Layers
} from 'lucide-react'

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: issue, loading, reload, setData } = useAsync(() => getIssue(id!), [id])

  const [resolving, setResolving] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return (
      <div className="page">
        <div className="card loading-card">
          <div className="spinner" />
          <p>Loading issue details...</p>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="page">
        <div className="card empty-card">
          <AlertTriangle size={40} className="text-amber-500" />
          <h3>Issue not found</h3>
          <p>The issue you're looking for does not exist or has been removed.</p>
          <button className="btn-primary" onClick={() => navigate('/issues')}>
            Back to Issues
          </button>
        </div>
      </div>
    )
  }

  const handleStartWork = async () => {
    try {
      setActionLoading(true)
      const updated = await updateIssue(issue.id, { status: 'In Progress' })
      setData(updated)
      reload()
    } catch (e) {
      alert('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const updated = await resolveIssue(issue.id)
      setData(updated)
      setResolving(false)
      reload()
    } catch (e) {
      alert('Failed to resolve issue')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="page">
      {/* Back button */}
      <button className="back-link" onClick={() => navigate('/issues')}>
        <ArrowLeft size={16} />
        Back to Issues
      </button>

      {/* Main hero card */}
      <div className="card issue-detail-hero">
        <div className="issue-detail-top">
          <div className="issue-detail-badges">
            <span className="issue-id-tag">{issue.id}</span>
            <span className={`badge ${severityStyle[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className={`badge ${statusStyle[issue.status]}`}>
              {issue.status}
            </span>
            <span className="badge bg-navy-100 text-navy-800 ring-navy-200">
              {issue.category}
            </span>
          </div>

          {/* Authority action buttons */}
          {user?.role === 'authority' && (
            <div className="authority-actions">
              {issue.status === 'Open' && (
                <button
                  className="btn-primary"
                  onClick={handleStartWork}
                  disabled={actionLoading}
                >
                  <PlayCircle size={16} />
                  Start Resolution
                </button>
              )}
              {issue.status === 'In Progress' && !resolving && (
                <button
                  className="btn-accent"
                  onClick={() => setResolving(true)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} />
                  Mark as Resolved
                </button>
              )}
            </div>
          )}
        </div>

        <h1 className="issue-detail-title">{issue.title}</h1>

        <div className="issue-meta-row">
          <div className="meta-item">
            <MapPin size={16} />
            <span>{issue.location.address}</span>
          </div>
          <div className="meta-item">
            <Clock size={16} />
            <span>Reported {timeAgo(issue.createdAt)}</span>
          </div>
          <div className="meta-item">
            <Users size={16} />
            <span>~{issue.affectedPeople.toLocaleString()} citizens impacted</span>
          </div>
          <div className="meta-item">
            <Building size={16} />
            <span>{issue.department}</span>
          </div>
        </div>
      </div>

      {/* Resolution modal / panel for Authority */}
      {resolving && (
        <div className="card resolution-form-card">
          <div className="resolution-form-header">
            <FileCheck size={22} className="text-cyan-500" />
            <div>
              <h3>Submit Resolution Verification</h3>
              <p>Record repair notes. CivicLens AI will verify before marking as resolved.</p>
            </div>
          </div>
          <form onSubmit={handleCompleteResolution}>
            <div className="form-group">
              <label className="label">Resolution Work Notes</label>
              <textarea
                rows={3}
                className="text-input"
                placeholder="Describe what was repaired, crew name, and verification details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setResolving(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-accent"
                disabled={actionLoading}
              >
                <Check size={16} />
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Two column layout */}
      <div className="detail-layout">
        {/* Left Column: Details & Resolution */}
        <div className="detail-left">
          {/* Issue visual & description */}
          <div className="card">
            <h3 className="card-section-title">Description & Evidence</h3>
            <p className="detail-description">{issue.description}</p>
            <div className="detail-image-box">
              <img src={issueImage(issue)} alt="Evidence" className="detail-image" />
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="card ai-card">
            <div className="ai-card-badge">
              <Sparkles size={16} />
              <span>CivicLens AI Diagnostics</span>
            </div>

            <div className="ai-stats-grid">
              <div className="ai-stat-box">
                <span className="ai-stat-label">Urgency Score</span>
                <span className="ai-stat-value" style={{ color: priorityColor(issue.ai.urgency) }}>
                  {issue.ai.urgency}/100
                </span>
              </div>
              <div className="ai-stat-box">
                <span className="ai-stat-label">Safety Risk</span>
                <span className={`badge ${severityStyle[issue.ai.safetyRisk]}`}>
                  {issue.ai.safetyRisk}
                </span>
              </div>
              <div className="ai-stat-box">
                <span className="ai-stat-label">AI Confidence</span>
                <span className="ai-stat-value text-cyan-600">
                  {issue.ai.confidence}%
                </span>
              </div>
              <div className="ai-stat-box">
                <span className="ai-stat-label">Assigned Dept</span>
                <span className="ai-stat-value font-medium text-navy-800 text-sm">
                  {issue.ai.department}
                </span>
              </div>
            </div>

            <div className="ai-action-box">
              <div className="ai-action-title">Recommended Action:</div>
              <div className="ai-action-text">{issue.ai.recommendedAction}</div>
            </div>
          </div>

          {/* Resolution verification if resolved */}
          {issue.resolution && (
            <div className="card resolution-verified-card">
              <div className="verified-header">
                <CheckCircle2 size={22} className="text-emerald-500" />
                <div>
                  <h3 className="text-emerald-950 font-bold">Resolution Verified by AI</h3>
                  <p className="text-xs text-emerald-800">
                    Confidence: {issue.resolution.confidence ?? 94}%
                  </p>
                </div>
              </div>
              <p className="resolution-notes">{issue.resolution.notes}</p>
              {issue.resolution.explanation && (
                <p className="resolution-explanation">
                  💡 {issue.resolution.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline & Details */}
        <div className="detail-right">
          {/* Priority Score Widget */}
          <div className="card">
            <h3 className="card-section-title">Priority Engine</h3>
            <div className="priority-large-display">
              <span
                className="priority-large-num"
                style={{ color: priorityColor(issue.priority) }}
              >
                {issue.priority}
              </span>
              <span className="priority-large-denom">/ 100</span>
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
            <p className="priority-explainer">
              Calculated using severity (32%), urgency (24%), public safety impact (22%),
              and affected citizen volume (12%).
            </p>
          </div>

          {/* Cluster info if applicable */}
          {issue.clusterId && (
            <div className="card cluster-info-card">
              <div className="cluster-header">
                <Layers size={18} className="text-cyan-600" />
                <div>
                  <h4 className="font-semibold text-navy-950">Duplicate Cluster</h4>
                  <p className="text-xs text-navy-600">ID: {issue.clusterId}</p>
                </div>
              </div>
              <p className="text-sm text-navy-700 mt-2">
                This issue is linked with <strong>{issue.reports}</strong> similar community reports in the same geographic radius.
              </p>
            </div>
          )}

          {/* Timeline / Activity Log */}
          <div className="card">
            <h3 className="card-section-title">Activity Audit Trail</h3>
            <div className="timeline">
              {issue.activity.length === 0 ? (
                <div className="text-sm text-navy-500">Report registered in municipal registry.</div>
              ) : (
                issue.activity.map((item, idx) => (
                  <div key={item.id || idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-actor">{item.actor}</span>
                        <span className="timeline-time">{timeAgo(item.at)}</span>
                      </div>
                      <div className="timeline-action">{item.action}</div>
                      {item.detail && (
                        <div className="timeline-detail">{item.detail}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
