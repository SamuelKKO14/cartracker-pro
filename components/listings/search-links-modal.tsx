'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExternalLink } from 'lucide-react'
import type { Listing } from '@/types/database'

interface SearchLinksModalProps {
  open: boolean
  onClose: () => void
  listing: Listing
}

function buildAutoscout24FR(l: Listing): string {
  const params = new URLSearchParams()
  if (l.brand) params.set('mmvmk0', l.brand.toLowerCase())
  if (l.year) params.set('fregfrom', l.year.toString())
  if (l.price) params.set('priceto', l.price.toString())
  if (l.km) params.set('kmto', l.km.toString())
  if (l.fuel) {
    const fuelMap: Record<string, string> = { Essence: 'B', Diesel: 'D', Hybride: 'H', Électrique: 'E', GPL: 'L' }
    const f = fuelMap[l.fuel]
    if (f) params.set('fuel', f)
  }
  if (l.gearbox === 'Automatique') params.set('gear', 'A')
  return `https://www.autoscout24.fr/lst?${params.toString()}`
}

function buildAutoscout24DE(l: Listing): string {
  const params = new URLSearchParams()
  if (l.brand) params.set('mmvmk0', l.brand.toLowerCase())
  if (l.year) params.set('fregfrom', l.year.toString())
  if (l.price) params.set('priceto', l.price.toString())
  if (l.km) params.set('kmto', l.km.toString())
  return `https://www.autoscout24.de/lst?${params.toString()}`
}

function buildLaCentrale(l: Listing): string {
  const params = new URLSearchParams()
  if (l.brand) params.set('make', l.brand.toUpperCase())
  if (l.model) params.set('model', l.model.toUpperCase())
  if (l.price) params.set('pricemax', l.price.toString())
  if (l.year) params.set('yearmin', l.year.toString())
  if (l.km) params.set('kmmax', l.km.toString())
  return `https://www.lacentrale.fr/listing?${params.toString()}`
}

function buildLeBonCoin(l: Listing): string {
  const parts = ['voitures/occasions']
  if (l.brand) parts.push(l.brand.toLowerCase().replace(/\s/g, '-'))
  const params = new URLSearchParams()
  if (l.price) params.set('price', `0-${l.price}`)
  if (l.year) params.set('regdate', `${l.year}-max`)
  if (l.km) params.set('mileage', `0-${l.km}`)
  return `https://www.leboncoin.fr/${parts.join('/')}?${params.toString()}`
}

function buildLeParking(l: Listing): string {
  const params = new URLSearchParams()
  if (l.brand) params.set('make', l.brand)
  if (l.model) params.set('model', l.model)
  if (l.price) params.set('maxPrice', l.price.toString())
  if (l.year) params.set('minYear', l.year.toString())
  return `https://www.leparking.fr/voiture-occasion/?${params.toString()}`
}

function buildMobileDe(l: Listing): string {
  const params = new URLSearchParams()
  if (l.brand) params.set('makeModelVariant1.makeName', l.brand)
  if (l.model) params.set('makeModelVariant1.modelName', l.model)
  if (l.price) params.set('maxPrice', l.price.toString())
  if (l.year) params.set('minFirstRegistrationDate', `${l.year}-01-01`)
  if (l.km) params.set('maxMileage', l.km.toString())
  return `https://suchen.mobile.de/fahrzeuge/search.html?${params.toString()}`
}

const SITES = [
  { name: 'AutoScout24 FR', flag: '🇫🇷', fn: buildAutoscout24FR },
  { name: 'AutoScout24 DE', flag: '🇩🇪', fn: buildAutoscout24DE },
  { name: 'La Centrale', flag: '🇫🇷', fn: buildLaCentrale },
  { name: 'LeBonCoin', flag: '🇫🇷', fn: buildLeBonCoin },
  { name: 'Le Parking', flag: '🇫🇷', fn: buildLeParking },
  { name: 'mobile.de', flag: '🇩🇪', fn: buildMobileDe },
]

export function SearchLinksModal({ open, onClose, listing }: SearchLinksModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rechercher des similaires</DialogTitle>
          <p className="text-sm text-gray-400">
            {listing.brand} {listing.model} {listing.year} — {listing.price ? `max ${listing.price?.toLocaleString('fr-FR')}€` : ''}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          {SITES.map(site => (
            <a
              key={site.name}
              href={site.fn(listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-[#2a2f3e] bg-[#0d1117] hover:border-orange-500/40 hover:bg-orange-900/10 transition-colors group"
            >
              <span className="flex items-center gap-2 text-sm text-gray-200">
                <span className="text-lg">{site.flag}</span>
                {site.name}
              </span>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" />
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
