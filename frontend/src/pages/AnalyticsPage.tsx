import { useAsync } from '../hooks/useAsync'
import { getAnalytics } from '../api'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import {
  TrendingUp, Users, CheckCircle, AlertTriangle, BarChart3, Activity
} from 'lucide-react'

const COLORS = ['#0e7490', '#3f6212', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#475569']
const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#10b981']

export default function AnalyticsPage() {
  const { data: analytics, loading } = useAsync(getAnalytics)

  if (loading || !analytics) {
    return (
      <div className="page">
        <div className="card loading-card">
          <div className="spinner" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Citywide Analytics & Impact</h1>
          <p className="page-subtitle">
            AI-driven resolution metrics, regional volume trends, and municipal triage performance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card card-blue">
          <div className="stat-icon"><Activity size={20} /></div>
          <div className="stat-value">{analytics.reported}</div>
          <div className="stat-label">Total Reported</div>
        </div>
        <div className="stat-card card-green">
          <div className="stat-icon"><CheckCircle size={20} /></div>
          <div className="stat-value">{analytics.resolvedCount}</div>
          <div className="stat-label">Resolved Issues</div>
        </div>
        <div className="stat-card card-amber">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-value">{analytics.resolutionRate}%</div>
          <div className="stat-label">Resolution Rate</div>
        </div>
        <div className="stat-card card-cyan">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{analytics.citizensImpacted.toLocaleString()}</div>
          <div className="stat-label">Citizens Impacted</div>
        </div>
      </div>

      {/* Charts 2x2 grid */}
      <div className="analytics-grid">
        {/* Monthly Trend */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Reporting & Resolution Trend</h3>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="reported" name="Reported" stroke="#0e7490" strokeWidth={2.5} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Category */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Issues by Civic Category</h3>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byCategory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" name="Volume" fill="#0e7490" radius={[6, 6, 0, 0]}>
                  {analytics.byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Status Donut */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Current Status Distribution</h3>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.byStatus.map((_, index) => (
                    <Cell key={`status-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Score Distribution */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">AI Priority Engine Distribution</h3>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.priorityDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" name="Count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
