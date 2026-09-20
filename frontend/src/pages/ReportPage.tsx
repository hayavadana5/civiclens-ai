import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeIssue, createIssue, getSimilarIssues } from '../api'
import { severityStyle, priorityColor } from '../utils/format'
import { BANGALORE_LOCALITIES, BANGALORE_ZONES, type BangaloreLocality } from '../data/bangalore'
import type { AIAnalysis, SimilarResult } from '../types'
import {
  Upload, Sparkles, AlertTriangle, CheckCircle, MapPin, Send,
  Layers, ArrowRight, Camera, RefreshCw, Crosshair, Building2
} from 'lucide-react'

export default function ReportPage() {
  const navigate = useNavigate()

  const [selectedLocalityId, setSelectedLocalityId] = useState<string>(BANGALORE_LOCALITIES[0].id)
  const [address, setAddress] = useState(BANGALORE_LOCALITIES[0].name + ', ' + BANGALORE_LOCALITIES[0].ward)
  const [lat, setLat] = useState(BANGALORE_LOCALITIES[0].lat)
  const [lng, setLng] = useState(BANGALORE_LOCALITIES[0].lng)
  const [zoneFilter, setZoneFilter] = useState<string>('All Bengaluru')

  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [similar, setSimilar] = useState<SimilarResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const handleLocalitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value
    setSelectedLocalityId(locId)
    const found = BANGALORE_LOCALITIES.find((l) => l.id === locId)
    if (found) {
      setAddress(`${found.name}, ${found.ward} (${found.landmark})`)
      setLat(found.lat)
      setLng(found.lng)
    }
  }

  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)))
          setLng(Number(pos.coords.longitude.toFixed(4)))
          setAddress(`GPS Location (Bengaluru): ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        },
        () => {
          // Fallback to central Bangalore
          setLat(12.9716)
          setLng(77.5946)
          setAddress('Vidhana Soudha, Bengaluru Central (12.9716, 77.5946)')
        }
      )
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAnalyze = async () => {
    if (!description.trim()) return
    try {
      setAnalyzing(true)
      const loc = { address, lat, lng }
      const [aiRes, simRes] = await Promise.all([
        analyzeIssue({ description, location: loc }),
        getSimilarIssues({ description, category: undefined }),
      ])
      setAnalysis(aiRes)
      setSimilar(simRes)
    } catch (err) {
      console.error('AI analysis error:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    try {
      setSubmitting(true)
      const loc = { address, lat, lng }
      const created = await createIssue({
        description,
        location: loc,
        image: imageFile,
        analysis: analysis ?? undefined,
      })
      setSubmittedId(created.id)
      setTimeout(() => {
        navigate(`/issues/${created.id}`)
      }, 1000)
    } catch (err) {
      console.error('Submit error:', err)
      alert('Could not submit report. Please try again.')
      setSubmitting(false)
    }
  }

  const availableLocalities = BANGALORE_LOCALITIES.filter(
    (l) => zoneFilter === 'All Bengaluru' || l.zone === zoneFilter
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report a Civic Hazard in Bengaluru</h1>
          <p className="page-subtitle">
            Capture or describe issues across BBMP zones. CivicLens AI automatically diagnoses severity and dispatches to municipal engineers.
          </p>
        </div>
      </div>

      <div className="report-grid">
        {/* Left column: input form */}
        <form className="report-form card" onSubmit={handleSubmit}>
          <h3 className="card-section-title flex items-center gap-2">
            <Building2 size={18} className="text-cyan-600" />
            Issue Location & Evidence
          </h3>

          {/* Bangalore Locality Quick Picker */}
          <div className="form-group bg-navy-50/60 p-3.5 rounded-xl border border-navy-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-cyan-600" />
                Select Bengaluru Ward / Locality
              </label>
              <button
                type="button"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
                onClick={handleDetectGPS}
              >
                <Crosshair size={13} /> Detect GPS
              </button>
            </div>

            {/* Zone Filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {BANGALORE_ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                    zoneFilter === z
                      ? 'bg-navy-900 text-white font-semibold'
                      : 'bg-white text-navy-700 hover:bg-navy-100 border border-navy-200'
                  }`}
                  onClick={() => setZoneFilter(z)}
                >
                  {z}
                </button>
              ))}
            </div>

            {/* Locality Dropdown */}
            <select
              className="select-input w-full bg-white font-medium"
              value={selectedLocalityId}
              onChange={handleLocalitySelect}
            >
              {availableLocalities.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.zone}] {loc.name} · {loc.ward}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Street Address */}
          <div className="form-group">
            <label className="label">Street / Landmark Detail</label>
            <div className="location-input-group">
              <MapPin size={17} className="location-icon" />
              <input
                type="text"
                className="text-input pl-10 text-sm font-medium"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Specific cross, landmark or building number"
                required
              />
            </div>
            <div className="text-[11px] text-navy-500 mt-1 flex gap-3">
              <span>Latitude: <strong>{lat}</strong></span>
              <span>Longitude: <strong>{lng}</strong></span>
            </div>
          </div>

          {/* Photo upload */}
          <div className="form-group">
            <label className="label">Hazard Photo Evidence</label>
            <div className="upload-dropzone">
              {imagePreview ? (
                <div className="preview-container">
                  <img src={imagePreview} alt="Preview" className="upload-preview" />
                  <button
                    type="button"
                    className="change-image-btn"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                  >
                    Change photo
                  </button>
                </div>
              ) : (
                <label className="upload-label">
                  <Camera size={30} className="text-cyan-500 mb-1.5" />
                  <span className="font-semibold text-navy-800 text-sm">
                    Upload or snap hazard photo
                  </span>
                  <span className="text-xs text-navy-500 mt-0.5">
                    JPG, PNG, WebP
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">Problem Description</label>
            <textarea
              rows={3}
              className="text-input text-sm"
              placeholder="e.g. Deep pothole right outside Indiranagar Metro entrance. Water is pooling after rain and two-wheelers are swerving into oncoming traffic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description.length > 8 && !analysis) handleAnalyze()
              }}
              required
            />
            <div className="form-hint">
              Mention depth, water leakage, or traffic hazard to help the AI calculate accurate priority.
            </div>
          </div>

          {/* Actions */}
          <div className="report-form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={handleAnalyze}
              disabled={analyzing || !description.trim()}
            >
              {analyzing ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Analyze with AI
            </button>

            <button
              type="submit"
              className="btn-primary flex-1 font-bold"
              disabled={submitting || !description.trim()}
            >
              {submitting ? (
                <>Submitting to BBMP...</>
              ) : submittedId ? (
                <>
                  <CheckCircle size={16} /> Created {submittedId}!
                </>
              ) : (
                <>
                  <Send size={16} /> Submit to BBMP
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right column: AI analysis preview */}
        <div className="report-preview-column">
          {analysis ? (
            <div className="card ai-card">
              <div className="ai-card-badge">
                <Sparkles size={16} />
                <span>CivicLens AI Diagnostics</span>
              </div>

              <h2 className="ai-title-preview">{analysis.title}</h2>

              <div className="ai-stats-grid mt-3">
                <div className="ai-stat-box">
                  <span className="ai-stat-label">Category</span>
                  <span className="font-semibold text-navy-900 text-sm">{analysis.category}</span>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-label">Severity</span>
                  <span className={`badge ${severityStyle[analysis.severity]}`}>
                    {analysis.severity}
                  </span>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-label">Urgency Score</span>
                  <span className="ai-stat-value" style={{ color: priorityColor(analysis.urgency) }}>
                    {analysis.urgency}/100
                  </span>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-label">AI Confidence</span>
                  <span className="ai-stat-value text-cyan-600">
                    {analysis.confidence}%
                  </span>
                </div>
              </div>

              <div className="ai-action-box mt-3">
                <div className="ai-action-title">Target Municipal Department:</div>
                <div className="font-bold text-navy-900 text-sm">{analysis.department}</div>
                <div className="ai-action-title mt-2">Recommended Action:</div>
                <div className="ai-action-text">{analysis.recommendedAction}</div>
              </div>

              {/* Similar reports warning if cluster detected */}
              {similar?.cluster && (
                <div className="cluster-alert-box">
                  <div className="cluster-alert-title">
                    <Layers size={16} />
                    <span>Existing Bengaluru Cluster Linked</span>
                  </div>
                  <p className="cluster-alert-desc">
                    <strong>{similar.cluster.title}</strong> already has {similar.cluster.reports} reports.
                    Your report will be clustered together to escalate repair urgency!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-ai-card">
              <Sparkles size={34} className="text-cyan-500 mb-2" />
              <h3 className="font-bold text-navy-950">AI Urban Triage Engine</h3>
              <p className="text-xs text-navy-600">
                CivicLens AI instantly maps complaints to responsible departments (BBMP, BWSSB, BESCOM) and calculates urgency scores.
              </p>
              <div className="sample-chips mt-3">
                <span className="chip-label">Try sample Bengaluru complaints:</span>
                {[
                  'Open manhole overflowing near Indiranagar school crossing',
                  'Water main burst on Koramangala 80ft road flooding lane',
                  'Garbage pile blocking footpath near Jayanagar 4th Block market',
                  'Streetlights completely out on HSR Layout 27th Main',
                ].map((text) => (
                  <button
                    key={text}
                    type="button"
                    className="sample-chip text-xs"
                    onClick={() => {
                      setDescription(text)
                      setTimeout(handleAnalyze, 100)
                    }}
                  >
                    "{text}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
