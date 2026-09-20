import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAsync } from '../hooks/useAsync'
import { getIssues, getClusters } from '../api'
import { severityStyle, statusStyle, priorityColor, timeAgo, issueImage } from '../utils/format'
import { BANGALORE_CENTER, BANGALORE_ZONES } from '../data/bangalore'
import type { Category, Issue } from '../types'
import { Filter, Layers, MapPin, ArrowRight, Building } from 'lucide-react'

// Fix default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORIES: ('All' | Category)[] = [
  'All', 'Roads', 'Sanitation', 'Water', 'Lighting', 'Municipal Safety', 'Drainage', 'Signage'
]

export default function MapPage() {
  const navigate = useNavigate()
  const { data: issues = [] } = useAsync(getIssues)
  const { data: clusters = [] } = useAsync(getClusters)

  const [category, setCategory] = useState<'All' | Category>('All')
  const [selectedZone, setSelectedZone] = useState<string>('All Bengaluru')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  const filtered = useMemo(() => {
    return (issues ?? []).filter((i) => {
      const hasCoords = i.location && typeof i.location.lat === 'number' && typeof i.location.lng === 'number'
      const matchesCat = category === 'All' || i.category === category
      const matchesZone =
        selectedZone === 'All Bengaluru' ||
        i.location.address.toLowerCase().includes(selectedZone.toLowerCase())
      return hasCoords && matchesCat && matchesZone
    })
  }, [issues, category, selectedZone])

  const center: [number, number] = filtered.length > 0
    ? [filtered[0].location.lat, filtered[0].location.lng]
    : [BANGALORE_CENTER.lat, BANGALORE_CENTER.lng]

  return (
    <div className="page map-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Geospatial Issue Map</h1>
          <p className="page-subtitle">
            Visualizing reported civic hazards, municipal clusters, and regional heatmaps.
          </p>
        </div>

        {/* Filters */}
        <div className="filter-select-group bg-white rounded-xl shadow-soft px-3 py-1.5 border border-navy-200">
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
      </div>

      {/* Map layout */}
      <div className="map-container-wrapper card">
        <div className="map-view">
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', minHeight: '560px', borderRadius: '1rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filtered.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.location.lat, issue.location.lng]}
                eventHandlers={{
                  click: () => setSelectedIssue(issue),
                }}
              >
                <Popup>
                  <div className="map-popup-card">
                    <span className={`badge ${severityStyle[issue.severity]} text-xs`}>
                      {issue.severity}
                    </span>
                    <h4 className="font-bold text-navy-950 text-sm mt-1">{issue.title}</h4>
                    <p className="text-xs text-navy-600 mt-1">{issue.location.address}</p>
                    <button
                      className="text-xs text-cyan-600 font-semibold mt-2 hover:underline inline-flex items-center gap-1"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                    >
                      View Issue <ArrowRight size={12} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Side Panel showing selected or issue summary */}
        <div className="map-side-panel">
          {selectedIssue ? (
            <div className="map-selected-card">
              <div className="flex justify-between items-center mb-3">
                <span className="issue-id-tag">{selectedIssue.id}</span>
                <span className={`badge ${statusStyle[selectedIssue.status]}`}>
                  {selectedIssue.status}
                </span>
              </div>
              <img
                src={issueImage(selectedIssue)}
                alt=""
                className="w-full h-32 object-cover rounded-xl mb-3 border border-navy-100"
              />
              <h3 className="font-bold text-navy-950 text-base">{selectedIssue.title}</h3>
              <p className="text-xs text-navy-600 mt-1 line-clamp-2">{selectedIssue.description}</p>
              
              <div className="mt-3 pt-3 border-t border-navy-100 text-xs text-navy-700 space-y-1">
                <div>📍 {selectedIssue.location.address}</div>
                <div>🏛️ {selectedIssue.department}</div>
                <div>⚡ Priority: <strong>{selectedIssue.priority}/100</strong></div>
              </div>

              <button
                className="btn-primary w-full mt-4 text-xs"
                onClick={() => navigate(`/issues/${selectedIssue.id}`)}
              >
                Inspect Full Diagnostics
              </button>
            </div>
          ) : (
            <div className="map-summary-box">
              <h3 className="font-bold text-navy-900 text-sm mb-3">Geographic Highlights</h3>
              <div className="space-y-2.5">
                <div className="stat-pill">
                  <MapPin size={14} className="text-cyan-500" />
                  <span><strong>{filtered.length}</strong> markers displayed</span>
                </div>
                <div className="stat-pill">
                  <Layers size={14} className="text-amber-500" />
                  <span><strong>{(clusters ?? []).length}</strong> cluster hotspots</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-100">
                <div className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-2">
                  Active Clusters
                </div>
                <div className="space-y-2">
                  {(clusters ?? []).slice(0, 3).map((cl) => (
                    <div key={cl.id} className="cluster-mini-item">
                      <div className="font-medium text-navy-900 text-xs">{cl.title}</div>
                      <div className="text-[11px] text-navy-500">{cl.reports} incident reports</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
