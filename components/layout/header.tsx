'use client'
import { useState } from 'react'
import { Plus, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  onNewListing?: () => void
  onShare?: () => void
}

export function Header({ title, onNewListing, onShare }: HeaderProps) {
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  async function handleExportCSV() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rawListings } = await supabase
        .from('listings')
        .select(`*, clients(name), listing_margins(margin, sell_price, total_cost)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!rawListings) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listings = rawListings as any[]

      const rows = listings.map(l => ({
        client: (l.clients as { name?: string } | null)?.name ?? '',
        marque: l.brand,
        modele: l.model ?? '',
        generation: l.generation ?? '',
        annee: l.year ?? '',
        km: l.km ?? '',
        prix: l.price ?? '',
        carburant: l.fuel ?? '',
        boite: l.gearbox ?? '',
        pays: l.country ?? '',
        statut: l.status,
        score_auto: l.auto_score ?? '',
        score_manuel: l.manual_score ?? '',
        marge: (l.listing_margins as Array<{ margin?: number }> | null)?.[0]?.margin ?? '',
        prix_revente: (l.listing_margins as Array<{ sell_price?: number }> | null)?.[0]?.sell_price ?? '',
        cout_total: (l.listing_margins as Array<{ total_cost?: number }> | null)?.[0]?.total_cost ?? '',
        tags: l.tags?.join(';') ?? '',
        notes: l.notes ?? '',
        url: l.url ?? '',
        source: l.source ?? '',
        date_ajout: l.created_at,
      }))

      exportToCSV(rows, `cartracker-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="fixed top-0 left-16 right-0 h-14 bg-[#0a0d14]/90 backdrop-blur border-b border-[#1a1f2e] z-30 flex items-center justify-between px-5">
      <h1 className="text-base font-semibold text-gray-100">
        <span className="text-orange-400 mr-2">CarTracker</span>
        <span className="text-gray-400 font-normal">/</span>
        <span className="ml-2">{title}</span>
      </h1>

      <div className="flex items-center gap-2">
        {onNewListing && (
          <Button size="sm" onClick={onNewListing}>
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={handleExportCSV} disabled={exporting}>
          <Download className="w-4 h-4" />
          CSV
        </Button>
        {onShare && (
          <Button size="sm" variant="secondary" onClick={onShare}>
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
        )}
      </div>
    </header>
  )
}
