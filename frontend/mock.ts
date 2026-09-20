import type { ActivityLog, Category, Issue, IssueCluster, Status } from '../types'
import { severityFromPriority } from '../utils/format'

/** Change this to re-centre the map and the mock issues on your own city. */
export const MAP_CENTER = { lat: 12.9752, lng: 77.6415 }

export const DEPARTMENTS: Record<Category, string> = {
  Roads: 'Road Maintenance',
  Sanitation: 'Solid Waste Management',
  Water: 'Water Supply Board',
  Lighting: 'Electrical & Streetlights',
  'Municipal Safety': 'Municipal Safety',
  Drainage: 'Storm Water Drains',
  Signage: 'Traffic Engineering',
}

export const ACTIONS: Record<Category, string> = {
  Roads: 'Immediate inspection and temporary barricading.',
  Sanitation: 'Schedule a clean-up crew and inspect the collection route.',
  Water: 'Dispatch a repair crew and isolate the affected line.',
  Lighting: 'Send an electrician to check the fixtures and circuit.',
  'Municipal Safety': 'Cordon off the hazard immediately and fit a cover.',
  Drainage: 'Clear the blockage and inspect the drain outlet.',
  Signage: 'Replace or reinstall the sign and audit nearby signage.',
}

const DETAIL: Record<Category, string> = {
  Roads: 'Reported by several commuters. Two-wheelers are swerving into traffic to avoid it, and it gets worse after rain.',
  Sanitation: 'Waste has been building up for days and is spilling onto the road. Residents report a strong smell and stray animals.',
  Water: 'Clean water has been running onto the road day and night. Nearby households report low pressure.',
  Lighting: 'The stretch is completely dark after sunset, and pedestrians say they no longer feel safe walking here.',
  'Municipal Safety': 'The cover is missing and the opening is hard to see in the dark. Children and cyclists pass here daily.',
  Drainage: 'Water is not draining and pools across the carriageway after even light rain.',
  Signage: 'The sign is missing or unreadable, and drivers have been seen ignoring the crossing.',
}

const at = (days: number, mins = 0) => new Date(Date.now() - days * 864e5 + mins * 6e4).toISOString()

// id, title, category, status, priority, reports, address, lat, lng, days ago, people affected, cluster
type Seed = [string, string, Category, Status, number, number, string, number, number, number, number, string?]

const SEEDS: Seed[] = [
  ['CL-1001', 'Open manhole near school gate', 'Municipal Safety', 'Open', 96, 14, '12th Main Rd, Indiranagar', 12.9784, 77.6408, 1, 1800, 'CLU-01'],
  ['CL-1002', 'Uncovered manhole on footpath', 'Municipal Safety', 'In Progress', 93, 6, '12th Main Rd, opposite Metro', 12.9791, 77.642, 3, 900, 'CLU-01'],
  ['CL-1042', 'Large pothole near bus stop', 'Roads', 'Open', 91, 7, '100 Feet Rd, Bus Stop 14', 12.9716, 77.6412, 2, 2400, 'CLU-02'],
  ['CL-1043', 'Cluster of potholes on flyover approach', 'Roads', 'Open', 86, 5, 'Flyover approach, 100 Feet Rd', 12.9698, 77.639, 4, 3100, 'CLU-02'],
  ['CL-1044', 'Deep pothole at market entrance', 'Roads', 'In Progress', 68, 3, 'Market Rd entrance', 12.9735, 77.6445, 6, 700, 'CLU-02'],
  ['CL-1017', 'Water main leak at junction', 'Water', 'In Progress', 84, 9, '5th Cross Junction', 12.9752, 77.6371, 2, 1500, 'CLU-03'],
  ['CL-1018', 'Clogged storm drain flooding road', 'Drainage', 'Open', 80, 8, '5th Cross, near temple', 12.976, 77.636, 3, 1200, 'CLU-03'],
  ['CL-1019', 'Pipe seepage along lane', 'Water', 'Open', 57, 3, '5th Cross, Lane 2', 12.9745, 77.6385, 5, 400, 'CLU-03'],
  ['CL-1023', 'Streetlights out on service road', 'Lighting', 'Open', 62, 5, 'Service Rd, Block C', 12.9803, 77.6452, 7, 800],
  ['CL-1024', 'Flickering streetlight at park entrance', 'Lighting', 'Resolved', 34, 2, 'Central Park, Gate 2', 12.969, 77.644, 12, 300],
  ['CL-1031', 'Overflowing garbage bins near market', 'Sanitation', 'In Progress', 58, 6, 'Market Rd, Bin Point 3', 12.9727, 77.6459, 5, 900],
  ['CL-1032', 'Illegal dumping behind stadium', 'Sanitation', 'Open', 55, 4, 'Stadium Rd, rear lane', 12.9678, 77.6431, 8, 500],
  ['CL-1035', 'Construction debris dumped on roadside', 'Sanitation', 'Resolved', 30, 2, 'Outer Ring Rd, Sector 4', 12.9812, 77.6398, 15, 250],
  ['CL-1050', 'Missing stop sign at school crossing', 'Signage', 'Open', 78, 4, 'School Rd crossing', 12.9775, 77.6435, 2, 1100],
  ['CL-1051', 'Faded speed-limit sign near school', 'Signage', 'Resolved', 28, 2, 'School Rd, north end', 12.97, 77.647, 20, 600],
]

const MINE = new Set(['CL-1042', 'CL-1031', 'CL-1024', 'CL-1035'])

function build([id, title, category, status, priority, reports, address, lat, lng, ago, affected, clusterId]: Seed): Issue {
  const department = DEPARTMENTS[category]
  const severity = severityFromPriority(priority)
  const activity: ActivityLog[] = [
    { id: `${id}-1`, at: at(ago), actor: 'Citizen', action: 'Issue reported', detail: `${reports} report${reports > 1 ? 's' : ''} merged` },
    { id: `${id}-2`, at: at(ago, 1), actor: 'CivicLens AI', action: 'AI analysis completed', detail: `Priority ${priority}, routed to ${department}` },
  ]
  if (status !== 'Open') activity.push({ id: `${id}-3`, at: at(ago * 0.6), actor: 'Authority', action: 'Resolution started', detail: 'Crew assigned' })
  if (status === 'Resolved') activity.push({ id: `${id}-4`, at: at(ago * 0.2), actor: 'CivicLens AI', action: 'Resolution verified', detail: '93% confidence' })

  let resolution: Issue['resolution']
  if (status === 'In Progress') resolution = { notes: 'Crew assigned. Work is scheduled.', verified: false, startedAt: at(ago * 0.6) }
  if (status === 'Resolved')
    resolution = {
      notes: 'Repaired and site cleared. Inspected by the ward engineer.',
      verified: true,
      confidence: 93,
      explanation: 'The after-photo shows the hazard removed and the area restored. Background landmarks match the original report.',
      startedAt: at(ago * 0.6),
      resolvedAt: at(ago * 0.2),
    }

  return {
    id, title, category, status, priority, severity, reports, department,
    description: `${title}. ${DETAIL[category]}`,
    location: { address, lat, lng },
    createdAt: at(ago),
    image: '',
    ai: {
      title, category, severity, urgency: priority - 4, safetyRisk: severityFromPriority(priority - 5),
      department, recommendedAction: ACTIONS[category], confidence: 88 + (priority % 9),
    },
    clusterId, affectedPeople: affected,
    reporter: MINE.has(id) ? 'You' : 'Citizen',
    activity, resolution,
  }
}

export const issues: Issue[] = SEEDS.map(build)

export const clusters: IssueCluster[] = [
  { id: 'CLU-01', title: 'Open manholes on 12th Main', category: 'Municipal Safety', primaryIssueId: 'CL-1001', issueIds: ['CL-1001', 'CL-1002'], reports: 20, priority: 96, center: { lat: 12.9787, lng: 77.6414 } },
  { id: 'CLU-02', title: 'Potholes along 100 Feet Road', category: 'Roads', primaryIssueId: 'CL-1042', issueIds: ['CL-1042', 'CL-1043', 'CL-1044'], reports: 15, priority: 91, center: { lat: 12.9716, lng: 77.6416 } },
  { id: 'CLU-03', title: 'Water leak and drain overflow, 5th Cross', category: 'Water', primaryIssueId: 'CL-1017', issueIds: ['CL-1017', 'CL-1018', 'CL-1019'], reports: 20, priority: 84, center: { lat: 12.9752, lng: 77.6372 } },
]

/** City-wide headline numbers (the 15 issues above are a sample of these). */
export const BASE_STATS = { total: 248, open: 76, inProgress: 51, resolved: 121, critical: 12 }

export const BASE_CATEGORY = [
  { name: 'Roads', value: 71 }, { name: 'Sanitation', value: 58 }, { name: 'Water', value: 34 },
  { name: 'Lighting', value: 29 }, { name: 'Drainage', value: 24 }, { name: 'Municipal Safety', value: 19 },
  { name: 'Signage', value: 13 },
]

export const TREND = [
  { month: 'Apr', reported: 24, resolved: 12 }, { month: 'May', reported: 31, resolved: 19 },
  { month: 'Jun', reported: 38, resolved: 22 }, { month: 'Jul', reported: 45, resolved: 25 },
  { month: 'Aug', reported: 52, resolved: 20 }, { month: 'Sep', reported: 58, resolved: 23 },
]

export const PRIORITY_DIST = [
  { range: '0-49', count: 74 }, { range: '50-74', count: 89 }, { range: '75-89', count: 73 }, { range: '90-100', count: 12 },
]
