import type { Category, Severity, Status } from '../types'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const steps: [number, string][] = [[86400, 'd'], [3600, 'h'], [60, 'm']]
  for (const [n, u] of steps) if (s >= n) return `${Math.floor(s / n)}${u} ago`
  return 'just now'
}

export const severityStyle: Record<Severity, string> = {
  CRITICAL: 'bg-red-50 text-red-700 ring-red-200',
  HIGH: 'bg-orange-50 text-orange-700 ring-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export const statusStyle: Record<Status, string> = {
  Open: 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export const priorityColor = (p: number) =>
  p >= 90 ? '#dc2626' : p >= 75 ? '#ea580c' : p >= 50 ? '#d97706' : '#059669'

export const severityFromPriority = (p: number): Severity =>
  p >= 90 ? 'CRITICAL' : p >= 75 ? 'HIGH' : p >= 50 ? 'MEDIUM' : 'LOW'

const CAT_TINT: Record<Category, string> = {
  Roads: '#334155', Sanitation: '#3f6212', Water: '#0e7490', Lighting: '#a16207',
  'Municipal Safety': '#991b1b', Drainage: '#1d4ed8', Signage: '#6d28d9',
}

/** Inline SVG placeholder so mock issues need no remote images. */
export function placeholderImage(category: Category, label = ''): string {
  const c = CAT_TINT[category]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c}'/><stop offset='1' stop-color='#0a1224'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><circle cx='400' cy='230' r='70' fill='none' stroke='rgba(255,255,255,.35)' stroke-width='6'/><circle cx='400' cy='230' r='16' fill='rgba(255,255,255,.5)'/><text x='400' y='390' font-family='sans-serif' font-size='30' fill='rgba(255,255,255,.75)' text-anchor='middle'>${category}${label ? ' · ' + label : ''}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const issueImage = (i: { image: string; category: Category }) => i.image || placeholderImage(i.category)
