import axios from 'axios'
import type {
  AIAnalysis, Analytics, Category, CreateIssueInput, DashboardStats, Issue, IssueCluster,
  Location, Resolution, SimilarResult,
} from '../types'
import {
  ACTIONS, BASE_CATEGORY, BASE_STATS, DEPARTMENTS, PRIORITY_DIST, TREND,
  clusters as seedClusters, issues as seedIssues,
} from '../data/mock'
import { severityFromPriority } from '../utils/format'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const forceMock = import.meta.env.VITE_USE_MOCK === 'true'
const http = axios.create({ baseURL, timeout: 4000 })

/** Flips to true whenever a call had to fall back to mock data. */
export const apiState = { usingMock: forceMock }

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export function normalizeIssue(raw: any): Issue {
  if (!raw) return raw
  const id = raw.id || raw._id || ''
  const statusMap: Record<string, 'Open' | 'In Progress' | 'Resolved'> = {
    REPORTED: 'Open',
    VERIFIED: 'Open',
    ASSIGNED: 'In Progress',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    REJECTED: 'Resolved',
    Open: 'Open',
    'In Progress': 'In Progress',
    Resolved: 'Resolved',
  }
  const status = statusMap[raw.status] || 'Open'
  const location: Location = typeof raw.location === 'object' && raw.location?.address
    ? raw.location
    : {
        address: typeof raw.location === 'string' ? raw.location : (raw.address || 'Central City'),
        lat: raw.latitude ?? raw.lat ?? 12.9716,
        lng: raw.longitude ?? raw.lng ?? 77.6412,
      }
  const priority = raw.priorityScore ?? raw.priority ?? raw.urgencyScore ?? 50
  const ai: AIAnalysis = raw.ai || {
    title: raw.title || 'Civic Issue',
    category: raw.category || 'Roads',
    severity: raw.severity || 'MEDIUM',
    urgency: raw.urgencyScore || priority,
    safetyRisk: raw.safetyRisk || 'MEDIUM',
    department: raw.department || 'Municipal Administration',
    recommendedAction: raw.recommendedAction || 'Inspect and schedule repair',
    confidence: raw.confidence || 88,
  }
  return {
    id,
    title: raw.title || 'Civic Issue',
    description: raw.description || '',
    category: raw.category || 'Roads',
    severity: raw.severity || 'MEDIUM',
    status,
    priority,
    location,
    reports: raw.reports || (raw.reportIds ? raw.reportIds.length : 1),
    department: raw.department || ai.department,
    createdAt: raw.createdAt || new Date().toISOString(),
    image: raw.imageUrl || raw.image || '',
    ai,
    clusterId: raw.clusterId,
    affectedPeople: raw.affectedPeopleEstimate || raw.affectedPeople || 250,
    reporter: raw.reporter || 'Citizen',
    activity: Array.isArray(raw.activity) ? raw.activity : [],
    resolution: raw.resolution,
  }
}

function normalizeStats(raw: any): DashboardStats {
  if (!raw) return { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0 }
  return {
    total: raw.totalIssues ?? raw.total ?? 0,
    open: raw.openIssues ?? raw.open ?? 0,
    inProgress: raw.inProgress ?? 0,
    resolved: raw.resolvedIssues ?? raw.resolved ?? 0,
    critical: raw.criticalIssues ?? raw.critical ?? 0,
  }
}

function normalizeCluster(raw: any): IssueCluster {
  return {
    id: raw.id || raw._id || '',
    title: raw.title || 'Issue Cluster',
    category: raw.category || 'Roads',
    primaryIssueId: raw.primaryIssueId || (raw.reportIds?.[0]) || '',
    issueIds: raw.issueIds || raw.reportIds || [],
    reports: raw.reportCount || raw.reports || (raw.reportIds?.length ?? 1),
    priority: raw.priorityScore || raw.priority || 75,
    center: {
      lat: raw.latitude ?? raw.center?.lat ?? 12.9752,
      lng: raw.longitude ?? raw.center?.lng ?? 77.6415,
    },
  }
}

// Accepts both `[...]` and `{ issues: [...] }` style backend responses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = <T>(d: any, key: string): T => {
  const root = d && typeof d === 'object' && 'data' in d ? d.data : d
  return (root && typeof root === 'object' && !Array.isArray(root) && key in root ? root[key] : root) as T
}

async function withFallback<T>(remote: () => Promise<T>, mock: () => T | Promise<T>): Promise<T> {
  if (!forceMock) {
    try {
      const out = await remote()
      apiState.usingMock = false
      return out
    } catch {
      /* backend unavailable, use mock data */
    }
  }
  apiState.usingMock = true
  await wait()
  return mock()
}

/* ---------------- in-memory mock backend ---------------- */
const db: Issue[] = clone(seedIssues)
const groups: IssueCluster[] = clone(seedClusters)
let nextId = 1100
const seedCount = db.length
const tally = (l: Issue[]) => ({
  open: l.filter((i) => i.status === 'Open').length,
  inProgress: l.filter((i) => i.status === 'In Progress').length,
  resolved: l.filter((i) => i.status === 'Resolved').length,
  critical: l.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length,
})
const base0 = tally(db)

const find = (id: string) => {
  const i = db.find((x) => x.id === id)
  if (!i) throw new Error('Issue not found')
  return i
}
const log = (i: Issue, actor: string, action: string, detail?: string) => {
  i.activity.push({ id: `${i.id}-${i.activity.length + 1}`, at: new Date().toISOString(), actor, action, detail })
}

const RULES: [RegExp, Category, string, number][] = [
  [/manhole/i, 'Municipal Safety', 'manhole', 90],
  [/pothole|crater/i, 'Roads', 'pothole', 77],
  [/dump/i, 'Sanitation', 'illegal dumping', 52],
  [/garbage|trash|waste|litter|\bbins?\b/i, 'Sanitation', 'garbage build-up', 50],
  [/leak|pipe|burst|water supply/i, 'Water', 'water leak', 70],
  [/street ?light|lamp ?post|light (is |are )?(out|broken)/i, 'Lighting', 'streetlight outage', 55],
  [/drain|sewer|flood|clog/i, 'Drainage', 'drain blockage', 68],
  [/\bsigns?\b|signage|signboard/i, 'Signage', 'road sign issue', 42],
]

function classify(description: string): AIAnalysis {
  const hit: [RegExp, Category, string, number] = RULES.find(([re]) => re.test(description)) ?? [/./, 'Roads', 'civic issue', 50]
  const [, category, label, base] = hit
  let urgency = base
  if (/(almost|nearly) (fell|hit)|accident|injur|school|child|dark|danger/i.test(description)) urgency += 6
  if (/\b(huge|large|deep|big|massive)\b/i.test(description)) urgency += 4
  urgency = Math.min(99, urgency)

  const adjRaw = description.match(/\b(huge|large|deep|big|massive)\b/i)?.[1]?.toLowerCase()
  const adj = adjRaw && ['huge', 'big', 'massive'].includes(adjRaw) ? 'large' : adjRaw
  const near = description.match(/\bnear (?:the |a )?([a-z ]{3,24}?)(?=[.,;!]|\band\b|$)/i)?.[1]?.trim()
  const raw = [adj, label, near ? `near ${near}` : ''].filter(Boolean).join(' ')

  const safetyCats: Category[] = ['Roads', 'Municipal Safety', 'Water', 'Drainage']
  return {
    title: raw.charAt(0).toUpperCase() + raw.slice(1),
    category,
    severity: severityFromPriority(urgency),
    urgency,
    safetyRisk: severityFromPriority(safetyCats.includes(category) ? urgency : urgency - 15),
    department: DEPARTMENTS[category],
    recommendedAction: ACTIONS[category],
    confidence: RULES.includes(hit) ? 94 : 71,
  }
}

function findSimilar(p: { issueId?: string; description?: string; category?: Category }): SimilarResult {
  const cluster = p.issueId
    ? groups.find((g) => g.issueIds.includes(p.issueId as string))
    : groups.find((g) => g.category === (p.category ?? classify(p.description ?? '').category))
  if (!cluster) return { cluster: null, issues: [] }
  const ids = p.issueId ? cluster.issueIds.filter((id) => id !== p.issueId) : [cluster.primaryIssueId]
  return { cluster, issues: ids.map(find) }
}

function mockStats(): DashboardStats {
  const t = tally(db)
  return {
    total: BASE_STATS.total + db.length - seedCount,
    open: BASE_STATS.open + t.open - base0.open,
    inProgress: BASE_STATS.inProgress + t.inProgress - base0.inProgress,
    resolved: BASE_STATS.resolved + t.resolved - base0.resolved,
    critical: BASE_STATS.critical + t.critical - base0.critical,
  }
}

/* ---------------- public API ---------------- */
export const getIssues = (): Promise<Issue[]> =>
  withFallback(
    async () => {
      const data = unwrap<any[]>((await http.get('/issues')).data, 'issues')
      return Array.isArray(data) ? data.map(normalizeIssue) : []
    },
    () => clone(db)
  )

export const getIssue = (id: string): Promise<Issue> =>
  withFallback(
    async () => normalizeIssue(unwrap<any>((await http.get(`/issues/${id}`)).data, 'issue')),
    () => clone(find(id))
  )

export const analyzeIssue = (input: { description: string; location: Location }): Promise<AIAnalysis> =>
  withFallback(async () => unwrap<AIAnalysis>((await http.post('/issues/analyze', input)).data, 'analysis'), () => classify(input.description))

export const getSimilarIssues = (p: { issueId?: string; description?: string; category?: Category }): Promise<SimilarResult> =>
  withFallback(async () => (await http.get('/issues/similar', { params: p })).data as SimilarResult, () => clone(findSimilar(p)))

export const createIssue = (input: CreateIssueInput): Promise<Issue> =>
  withFallback(
    async () => {
      const fd = new FormData()
      fd.append('description', input.description)
      fd.append('location', JSON.stringify(input.location))
      if (input.analysis) fd.append('analysis', JSON.stringify(input.analysis))
      if (input.image) fd.append('image', input.image)
      return unwrap<Issue>((await http.post('/issues', fd)).data, 'issue')
    },
    () => {
      const ai = input.analysis ?? classify(input.description)
      const sim = findSimilar({ category: ai.category })
      const id = `CL-${++nextId}`
      const issue: Issue = {
        id, title: ai.title, description: input.description, category: ai.category, severity: ai.severity,
        status: 'Open', priority: ai.urgency, location: input.location, reports: 1, department: ai.department,
        createdAt: new Date().toISOString(), image: input.image ? URL.createObjectURL(input.image) : '',
        ai, clusterId: sim.cluster?.id, affectedPeople: 250, reporter: 'You', activity: [],
      }
      log(issue, 'You', 'Issue reported')
      log(issue, 'CivicLens AI', 'AI analysis completed', `Priority ${ai.urgency}, routed to ${ai.department}`)
      if (sim.cluster && sim.issues[0]) {
        sim.cluster.reports += 1
        sim.cluster.issueIds.push(id)
        sim.issues[0].reports += 1
        log(sim.issues[0], 'CivicLens AI', 'Similar report merged', `Now ${sim.issues[0].reports} reports`)
        log(issue, 'CivicLens AI', 'Linked to community issue', sim.issues[0].id)
      }
      db.unshift(issue)
      return clone(issue)
    },
  )

export const updateIssue = (id: string, patch: Partial<Issue>): Promise<Issue> =>
  withFallback(
    async () => unwrap<Issue>((await http.patch(`/issues/${id}`, patch)).data, 'issue'),
    () => {
      const i = find(id)
      if (patch.status && patch.status !== i.status) {
        log(i, 'Authority', patch.status === 'In Progress' ? 'Resolution started' : `Status changed to ${patch.status}`)
        if (patch.status === 'In Progress')
          i.resolution = { ...(i.resolution ?? { notes: '', verified: false }), startedAt: new Date().toISOString() }
      }
      Object.assign(i, patch)
      return clone(i)
    },
  )

export const verifyResolution = (id: string, input: { notes: string; image?: File | null }): Promise<Resolution> =>
  withFallback(
    async () => {
      const fd = new FormData()
      fd.append('notes', input.notes)
      if (input.image) fd.append('image', input.image)
      return unwrap<Resolution>((await http.post(`/issues/${id}/verify`, fd)).data, 'resolution')
    },
    () => {
      const i = find(id)
      const res: Resolution = {
        ...(i.resolution ?? {}),
        notes: input.notes,
        image: input.image ? URL.createObjectURL(input.image) : i.resolution?.image,
        verified: true,
        confidence: 94,
        explanation:
          'The after-photo shows the same location with the hazard removed and the surface restored. Background landmarks match the original report, and no new damage is visible.',
      }
      i.resolution = res
      log(i, 'CivicLens AI', 'Resolution verified', '94% confidence')
      return clone(res)
    },
  )

export const resolveIssue = (id: string): Promise<Issue> =>
  withFallback(
    async () => unwrap<Issue>((await http.post(`/issues/${id}/resolve`)).data, 'issue'),
    () => {
      const i = find(id)
      i.status = 'Resolved'
      i.resolution = { ...(i.resolution ?? { notes: '', verified: false }), resolvedAt: new Date().toISOString() }
      log(i, 'Authority', 'Marked as resolved', `${i.affectedPeople.toLocaleString()} residents benefit`)
      return clone(i)
    },
  )

export const getClusters = (): Promise<IssueCluster[]> =>
  withFallback(
    async () => {
      const data = unwrap<any[]>((await http.get('/clusters')).data, 'clusters')
      return Array.isArray(data) ? data.map(normalizeCluster) : []
    },
    () => clone(groups)
  )

export const getDashboardStats = (): Promise<DashboardStats> =>
  withFallback(
    async () => normalizeStats(unwrap<any>((await http.get('/dashboard/stats')).data, 'stats')),
    () => mockStats()
  )

export const getAnalytics = (): Promise<Analytics> =>
  withFallback(
    async () => unwrap<Analytics>((await http.get('/analytics')).data, 'analytics'),
    () => {
      const s = mockStats()
      return {
        reported: s.total,
        resolvedCount: s.resolved,
        resolutionRate: Math.round((s.resolved / s.total) * 100),
        citizensImpacted: 18400,
        criticalResolved: 9 + db.filter((i) => i.severity === 'CRITICAL' && i.status === 'Resolved').length,
        byCategory: BASE_CATEGORY,
        byStatus: [
          { name: 'Open', value: s.open },
          { name: 'In Progress', value: s.inProgress },
          { name: 'Resolved', value: s.resolved },
        ],
        trend: TREND,
        priorityDistribution: PRIORITY_DIST,
      }
    },
  )
