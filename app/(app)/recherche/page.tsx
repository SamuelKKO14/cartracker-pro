'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import type { ListingInitialData } from '@/components/listings/listing-form-modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Sparkles, ArrowRight, Loader2, RefreshCw } from 'lucide-react'

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', BE: '🇧🇪', ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱',
  PT: '🇵🇹', PL: '🇵🇱', FR: '🇫🇷', AT: '🇦🇹', CH: '🇨🇭',
  SE: '🇸🇪', CZ: '🇨🇿', HU: '🇭🇺', RO: '🇷🇴', LT: '🇱🇹',
}

interface TopModel { rank: number; brand: string; model: string; reason: string; trend: 'up' | 'down' }
interface PriceDrop { brand: string; model: string; drop_percent: number; country: string; note: string }
interface BestCountry { country: string; country_name: string; advantage: string; best_segment: string }
interface HotSegment { segment: string; note: string; trend: 'up' | 'down' }
interface TrendsData {
  top_models: TopModel[]
  price_drops: PriceDrop[]
  best_countries: BestCountry[]
  hot_segments: HotSegment[]
  updated_at: string
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function RecherchePage() {
  // Trends state
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trendsUpdatedAt, setTrendsUpdatedAt] = useState<string | null>(null)
  const [trendsError, setTrendsError] = useState<string | null>(null)

  // Import intelligent state
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<ListingInitialData | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)

  // Load cached trends on mount
  useEffect(() => {
    async function loadCachedTrends() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('market_trends' as string)
        .select('trends_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1) as unknown as { data: Array<{ trends_data: TrendsData; updated_at: string }> | null }
      if (data && data.length > 0 && data[0].trends_data) {
        setTrends(data[0].trends_data as TrendsData)
        setTrendsUpdatedAt(data[0].updated_at)
      }
    }
    loadCachedTrends()
  }, [])

  async function refreshTrends() {
    setLoadingTrends(true)
    setTrendsError(null)
    try {
      const res = await fetch('/api/trends', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setTrendsError(data.error ?? 'Erreur inconnue')
      } else {
        setTrends(data as TrendsData)
        setTrendsUpdatedAt(new Date().toISOString())
      }
    } catch {
      setTrendsError('Erreur réseau')
    } finally {
      setLoadingTrends(false)
    }
  }

  async function handleAnalyze() {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await fetch('/api/analyze-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAiError(json.error ?? 'Erreur inconnue')
      } else {
        setAiResult(json.data)
      }
    } catch {
      setAiError('Erreur réseau')
    } finally {
      setAiLoading(false)
    }
  }

  const AI_PREVIEW_FIELDS: { key: keyof ListingInitialData; label: string; format?: (v: unknown) => string }[] = [
    { key: 'brand', label: 'Marque' },
    { key: 'model', label: 'Modèle' },
    { key: 'year', label: 'Année' },
    { key: 'km', label: 'Kilométrage', format: v => v != null ? `${(v as number).toLocaleString('fr-FR')} km` : '' },
    { key: 'price', label: 'Prix', format: v => v != null ? `${(v as number).toLocaleString('fr-FR')} €` : '' },
    { key: 'fuel', label: 'Carburant' },
    { key: 'gearbox', label: 'Boîte' },
    { key: 'body', label: 'Carrosserie' },
    { key: 'country', label: 'Pays' },
    { key: 'seller', label: 'Vendeur' },
    { key: 'first_owner', label: '1er proprio', format: v => v === true ? 'Oui' : v === false ? 'Non' : '' },
    { key: 'horsepower', label: 'Puissance', format: v => v != null ? `${v} ch` : '' },
    { key: 'color', label: 'Couleur' },
    { key: 'url', label: 'URL' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Recherche" />

      {showFormModal && aiResult && (
        <ListingFormModal
          open
          onClose={() => setShowFormModal(false)}
          onSaved={() => { setShowFormModal(false); setAiResult(null); setAiText('') }}
          initialData={aiResult}
        />
      )}

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 max-w-4xl mx-auto space-y-8">

          {/* ── Section Tendances ── */}
          <section className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                🔥 Tendances du moment
              </h2>
              <div className="flex items-center gap-3">
                {trendsUpdatedAt && (
                  <span className="text-xs text-gray-500">
                    Mis à jour à {formatTime(trendsUpdatedAt)}
                  </span>
                )}
                <button
                  onClick={refreshTrends}
                  disabled={loadingTrends}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2f3e] bg-[#0d1117] text-sm text-gray-300 hover:border-orange-500/40 hover:text-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingTrends
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />
                  }
                  Actualiser
                </button>
              </div>
            </div>

            {trendsError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {trendsError}
              </div>
            )}

            {/* Loading skeleton */}
            {loadingTrends && !trends && (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-[#0d1117] border border-[#1a1f2e]" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-40 rounded-xl bg-[#0d1117] border border-[#1a1f2e]" />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loadingTrends && !trends && (
              <div className="p-8 rounded-xl border border-[#1a1f2e] bg-[#0d1117] flex flex-col items-center justify-center gap-4 text-center">
                <span className="text-4xl">🔥</span>
                <div>
                  <p className="text-gray-300 font-medium">Pas encore de données</p>
                  <p className="text-sm text-gray-500 mt-1">Clique sur Actualiser pour voir les tendances du marché en temps réel</p>
                </div>
                <button
                  onClick={refreshTrends}
                  disabled={loadingTrends}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser maintenant
                </button>
              </div>
            )}

            {/* Trends content */}
            {trends && (
              <div className={`space-y-5 transition-opacity duration-300 ${loadingTrends ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

                {/* Top models */}
                {trends.top_models?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">🏆 Modèles les plus recherchés</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {trends.top_models.slice(0, 5).map((item) => (
                        <div
                          key={item.rank}
                          className="p-3 rounded-xl border border-[#1a1f2e] bg-[#0d1117] flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                              #{item.rank}
                            </span>
                            <span className={`text-base ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                              {item.trend === 'up' ? '↑' : '↓'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm leading-tight">{item.brand}</p>
                            <p className="font-semibold text-orange-400 text-sm">{item.model}</p>
                          </div>
                          <p className="text-xs text-gray-500 leading-snug line-clamp-2">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price drops */}
                  {trends.price_drops?.length > 0 && (
                    <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">📉 Prix en baisse</p>
                      <div className="space-y-3">
                        {trends.price_drops.slice(0, 3).map((item, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">
                                {item.brand} {item.model}
                              </span>
                              <span className="text-xs font-bold text-red-400 shrink-0">
                                -{item.drop_percent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">
                                {COUNTRY_FLAGS[item.country] ?? ''} {item.country}
                              </span>
                              <span className="text-gray-700">·</span>
                              <span className="text-xs text-gray-500 line-clamp-1">{item.note}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best countries */}
                  {trends.best_countries?.length > 0 && (
                    <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">🌍 Pays avantageux</p>
                      <div className="space-y-3">
                        {trends.best_countries.slice(0, 3).map((item, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{COUNTRY_FLAGS[item.country] ?? '🌍'}</span>
                              <span className="text-sm font-semibold text-white">{item.country_name}</span>
                            </div>
                            <p className="text-xs text-green-400">{item.advantage}</p>
                            <p className="text-xs text-gray-500">Segment : {item.best_segment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hot segments */}
                  {trends.hot_segments?.length > 0 && (
                    <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">⚡ Segments chauds</p>
                      <div className="space-y-3">
                        {trends.hot_segments.slice(0, 3).map((item, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">{item.segment}</span>
                              <span className={`text-base ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {item.trend === 'up' ? '↑' : '↓'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{item.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>

          {/* Section 0: Import intelligent */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Import intelligent
            </h2>

            <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-4">
              <p className="text-sm text-gray-400">
                Collez le texte brut d'une annonce (depuis AutoScout24, LeBonCoin, mobile.de…) et l'IA extrait automatiquement toutes les données.
              </p>

              <Textarea
                placeholder={"BMW 320d xDrive Touring – 2021\n45 000 km · Diesel · Automatique\nPrix : 28 900 €\n1ère main, carnet d'entretien complet\nVendeur professionnel – Allemagne\nhttps://..."}
                value={aiText}
                onChange={e => { setAiText(e.target.value); setAiError(null); setAiResult(null) }}
                className="min-h-[140px] text-sm"
              />

              {aiError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {aiError}
                </div>
              )}

              {aiResult && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Données extraites</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {AI_PREVIEW_FIELDS.map(({ key, label, format }) => {
                      const raw = aiResult[key]
                      const value = format ? format(raw) : (raw != null ? String(raw) : '')
                      const found = raw != null && raw !== ''
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${found ? 'bg-green-500' : 'bg-gray-700'}`} />
                          <span className="text-gray-500 shrink-0">{label} :</span>
                          <span className={`truncate font-medium ${found ? 'text-gray-200' : 'text-gray-600'}`}>
                            {found ? value : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={aiLoading || !aiText.trim()}
                  variant="secondary"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Analyse en cours…' : 'Analyser avec l\'IA'}
                </Button>

                {aiResult && (
                  <Button
                    onClick={() => setShowFormModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Ouvrir dans le formulaire
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </section>


        </div>
      </div>
    </>
  )
}
