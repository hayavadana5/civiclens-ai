export type Role = 'citizen' | 'authority'
export type Category = 'Roads' | 'Sanitation' | 'Water' | 'Lighting' | 'Municipal Safety' | 'Drainage' | 'Signage'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type Status = 'Open' | 'In Progress' | 'Resolved'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Location {
  address: string
  lat: number
  lng: number
}

export interface AIAnalysis {
  title: string
  category: Category
  severity: Severity
  urgency: number
  safetyRisk: Severity
  department: string
  recommendedAction: string
  confidence: number
}

export interface ActivityLog {
  id: string
  at: string
  actor: string
  action: string
  detail?: string
}

export interface Resolution {
  notes: string
  image?: string
  verified: boolean
  confidence?: number
  explanation?: string
  startedAt?: string
  resolvedAt?: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: Category
  severity: Severity
  status: Status
  priority: number
  location: Location
  reports: number
  department: string
  createdAt: string
  image: string
  ai: AIAnalysis
  clusterId?: string
  affectedPeople: number
  reporter: string
  activity: ActivityLog[]
  resolution?: Resolution
}

export interface IssueCluster {
  id: string
  title: string
  category: Category
  primaryIssueId: string
  issueIds: string[]
  reports: number
  priority: number
  center: { lat: number; lng: number }
}

export interface DashboardStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  critical: number
}

export interface Analytics {
  reported: number
  resolvedCount: number
  resolutionRate: number
  citizensImpacted: number
  criticalResolved: number
  byCategory: { name: string; value: number }[]
  byStatus: { name: string; value: number }[]
  trend: { month: string; reported: number; resolved: number }[]
  priorityDistribution: { range: string; count: number }[]
}

export interface CreateIssueInput {
  description: string
  location: Location
  image?: File | null
  analysis?: AIAnalysis
}

export interface SimilarResult {
  cluster: IssueCluster | null
  issues: Issue[]
}
