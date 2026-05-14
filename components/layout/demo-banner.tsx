'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useDemoStatus } from '@/lib/hooks/useDemoStatus'

const DISMISS_KEY = 'demo-banner-dismissed'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24h

export function DemoBanner() {
  const { hasDemoData, isLoading } = useDemoStatus()
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (raw) {
      const ts = parseInt(raw, 10)
      if (Date.now() - ts < DISMISS_DURATION) return // still dismissed
      localStorage.removeItem(DISMISS_KEY)
    }
    setDismissed(false)
  }, [])

  if (isLoading || !hasDemoData || dismissed) return null

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="relative flex items-center gap-3 px-4 py-2.5 bg-orange-500/15 border-b border-orange-500/25 text-sm">
      <span className="shrink-0">📊</span>
      <p className="flex-1 text-orange-200/90">
        <span className="hidden sm:inline">
          Vous voyez actuellement des données de démonstration pour découvrir le potentiel de CarTracker Pro.
        </span>
        <span className="sm:hidden">Données de démonstration actives.</span>
        {' '}
        <Link
          href="/compte?action=cleanup-demo"
          className="underline underline-offset-2 font-medium text-orange-300 hover:text-orange-200"
        >
          Nettoyer les données démo
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-orange-500/20 text-orange-300/70 hover:text-orange-200 transition-colors"
        aria-label="Masquer le bandeau"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
