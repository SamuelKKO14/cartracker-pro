import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

export function formatKm(km: number | null | undefined): string {
  if (km == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(km) + ' km'
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function calculateAutoScore(listing: {
  year?: number | null
  km?: number | null
  price?: number | null
  seller?: string | null
  first_owner?: boolean
}): number {
  let score = 50
  const currentYear = new Date().getFullYear()

  if (listing.year && listing.km) {
    const age = currentYear - listing.year
    const kmPerYear = age > 0 ? listing.km / age : listing.km

    if (kmPerYear < 10000) score += 15
    else if (kmPerYear < 15000) score += 8
    else if (kmPerYear > 25000) score -= 10
  }

  if (listing.price && listing.km && listing.km > 0) {
    const pricePerKm = listing.price / listing.km
    if (pricePerKm < 0.15) score += 15
    else if (pricePerKm < 0.25) score += 8
    else if (pricePerKm > 0.5) score -= 10
  }

  if (listing.seller === 'particulier') score += 8
  if (listing.first_owner) score += 10

  if (listing.year) {
    const age = currentYear - listing.year
    if (age <= 3) score += 5
    else if (age >= 10) score -= 5
  }

  return Math.max(0, Math.min(100, score))
}

export function getFinalScore(autoScore: number | null, manualScore: number | null): number | null {
  if (autoScore == null && manualScore == null) return null
  if (autoScore == null) return manualScore
  if (manualScore == null) return autoScore
  return Math.round((autoScore + manualScore) / 2)
}

export function getScoreColor(score: number | null): string {
  if (score == null) return 'text-gray-400'
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreBg(score: number | null): string {
  if (score == null) return 'bg-gray-800'
  if (score >= 70) return 'bg-green-900/30 border-green-700/50'
  if (score >= 50) return 'bg-orange-900/30 border-orange-700/50'
  return 'bg-red-900/30 border-red-700/50'
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  viewed: 'Vu',
  contacted: 'Contacté',
  negotiation: 'Négociation',
  bought: 'Acheté',
  resold: 'Revendu',
  ignored: 'Ignoré',
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  viewed: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  contacted: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  negotiation: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  bought: 'bg-green-900/50 text-green-300 border-green-700/50',
  resold: 'bg-teal-900/50 text-teal-300 border-teal-700/50',
  ignored: 'bg-gray-900/50 text-gray-400 border-gray-700/50',
}

export const COUNTRY_LABELS: Record<string, string> = {
  FR: '🇫🇷 France',
  DE: '🇩🇪 Allemagne',
  BE: '🇧🇪 Belgique',
  ES: '🇪🇸 Espagne',
  IT: '🇮🇹 Italie',
  NL: '🇳🇱 Pays-Bas',
  PT: '🇵🇹 Portugal',
  PL: '🇵🇱 Pologne',
  RO: '🇷🇴 Roumanie',
  AT: '🇦🇹 Autriche',
  CH: '🇨🇭 Suisse',
  SE: '🇸🇪 Suède',
  NO: '🇳🇴 Norvège',
  LT: '🇱🇹 Lituanie',
}

export const IMPORT_COSTS: Record<string, number> = {
  FR: 0,
  BE: 200,
  DE: 500,
  NL: 400,
  AT: 600,
  CH: 800,
  IT: 700,
  ES: 700,
  PT: 900,
  PL: 800,
  RO: 1200,
  SE: 1200,
  NO: 1500,
  LT: 1000,
}

export function getImportCost(country: string | null): number {
  if (!country) return 0
  return IMPORT_COSTS[country] ?? 0
}

export function exportToCSV(listings: Array<Record<string, unknown>>, filename = 'cartracker-export.csv') {
  if (listings.length === 0) return

  const headers = Object.keys(listings[0])
  const rows = listings.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (Array.isArray(val)) return val.join(';')
      const str = String(val)
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
