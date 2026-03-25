'use client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatKm, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { Users, Car, TrendingUp, Clock, Euro, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ListingFormModal } from '@/components/listings/listing-form-modal'

interface KPIs {
  activeClients: number
  totalListings: number
  todayListings: number
  negotiationCount: number
  totalMargin: number
}

interface DashboardClientProps {
  kpis: KPIs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  negotiationListings: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeClients: any[]
}

export function DashboardClient({ kpis, negotiationListings, activeClients }: DashboardClientProps) {
  const [showNewListing, setShowNewListing] = useState(false)
  const router = useRouter()

  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <>
      <KeyboardShortcuts onNewListing={() => setShowNewListing(true)} />
      <Header title="Ma journée" onNewListing={() => setShowNewListing(true)} />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Date */}
          <div>
            <p className="text-sm text-gray-500 capitalize">{today}</p>
            <h2 className="text-xl font-semibold text-gray-100">Bonjour 👋</h2>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard
              icon={<Users className="w-4 h-4" />}
              label="Clients actifs"
              value={kpis.activeClients}
              color="blue"
            />
            <KPICard
              icon={<Car className="w-4 h-4" />}
              label="Annonces totales"
              value={kpis.totalListings}
              color="purple"
            />
            <KPICard
              icon={<Clock className="w-4 h-4" />}
              label="Ajoutées aujourd'hui"
              value={kpis.todayListings}
              color="green"
            />
            <KPICard
              icon={<TrendingUp className="w-4 h-4" />}
              label="En négociation"
              value={kpis.negotiationCount}
              color="orange"
            />
            <KPICard
              icon={<Euro className="w-4 h-4" />}
              label="Marge potentielle"
              value={formatPrice(kpis.totalMargin)}
              color="teal"
              isText
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Négociations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  En négociation — à suivre
                </h3>
                <Link href="/annonces?status=negotiation">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir tout <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {negotiationListings.length === 0 ? (
                <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-6 text-center">
                  <p className="text-gray-500 text-sm">Aucune annonce en négociation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {negotiationListings.slice(0, 6).map((listing) => {
                    const margin = listing.listing_margins?.[0]?.margin
                    return (
                      <Link key={listing.id} href={`/annonces?id=${listing.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors cursor-pointer">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {listing.brand} {listing.model} {listing.year}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {listing.clients?.name ?? 'Sans client'} · {formatPrice(listing.price)}
                            </p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            {margin != null ? (
                              <span className={`text-sm font-semibold ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPrice(margin)}
                              </span>
                            ) : (
                              <Badge variant="secondary">À calculer</Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Clients actifs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Clients actifs
                </h3>
                <Link href="/clients">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {activeClients.length === 0 ? (
                <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-6 text-center">
                  <p className="text-gray-500 text-sm">Aucun client — </p>
                  <Link href="/clients" className="text-orange-400 text-sm hover:underline">Ajouter un client</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeClients.slice(0, 8).map((client) => {
                    const count = (client.listings as Array<{ count: number }> | null)?.[0]?.count ?? 0
                    return (
                      <Link key={client.id} href={`/clients/${client.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors cursor-pointer">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">
                              {client.name[0]?.toUpperCase()}
                            </div>
                            <p className="text-sm font-medium text-gray-200 truncate">{client.name}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {count} annonce{count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewListing && (
        <ListingFormModal
          open={showNewListing}
          onClose={() => setShowNewListing(false)}
          onSaved={() => { setShowNewListing(false); router.refresh() }}
        />
      )}
    </>
  )
}

function KPICard({
  icon, label, value, color, isText
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'purple' | 'green' | 'orange' | 'teal'
  isText?: boolean
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
    green: 'text-green-400 bg-green-900/20',
    orange: 'text-orange-400 bg-orange-900/20',
    teal: 'text-teal-400 bg-teal-900/20',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3 ${colorMap[color]}`}>
          <span className={colorMap[color].split(' ')[0]}>{icon}</span>
        </div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`font-bold ${isText ? 'text-lg' : 'text-2xl'} text-gray-100`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
