'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Calculator, Car, BarChart3 } from 'lucide-react'

// ── Mockup: Clients ─────────────────────────────────────────────────────────

function MockupClients() {
  const clients = [
    { initials: 'AR', color: 'bg-blue-500/20 text-blue-400', name: 'Alexandre Roux', badge: 'Forfait mensuel', phone: '06 12 34 56 78', email: 'a.roux@mail.fr', budget: '30 000 – 45 000 €', criteria: 'Tesla Model 3/Y, max 60k km', count: 3 },
    { initials: 'JD', color: 'bg-orange-500/20 text-orange-400', name: 'Jean-Pierre Dubois', badge: 'Forfait mensuel', phone: '06 98 76 54 32', email: 'jp.dubois@mail.fr', budget: '20 000 – 30 000 €', criteria: 'SUV diesel, Peugeot/Renault', count: 2 },
    { initials: 'KB', color: 'bg-green-500/20 text-green-400', name: 'Karim Benali', badge: 'Forfait mensuel', phone: '07 45 67 89 01', email: 'k.benali@mail.fr', budget: '35 000 – 50 000 €', criteria: 'BMW Série 3/4, max 40k km', count: 4 },
  ]
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">3 clients</p>
        <div className="flex gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500 text-white font-semibold">+ Nouveau client</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.08]">CSV</span>
        </div>
      </div>
      <div className="h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center px-2.5">
        <Search className="w-3 h-3 text-gray-600 mr-1.5" />
        <span className="text-[10px] text-gray-600">Rechercher un client...</span>
      </div>
      {clients.map((c, i) => (
        <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5`}>{c.initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white truncate">{c.name}</p>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-500 shrink-0">{c.badge}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{c.phone} · {c.email}</p>
            <p className="text-[10px] text-gray-500">Budget : {c.budget}</p>
            <p className="text-[10px] text-gray-600 italic truncate">{c.criteria}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-400 font-medium">{c.count} ann.</p>
            <span className="text-gray-600 text-xs">→</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Mockup: Recherche ────────────────────────────────────────────────────────

function MockupRecherche() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white">Tendances du moment 🔥</p>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.08]">Actualiser</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <p className="text-[10px] font-semibold text-orange-400">🔥 PRIX EN BAISSE</p>
          {[
            { name: 'Tesla Model 3 SR+', pct: '-8%' },
            { name: 'BMW i4 eDrive40', pct: '-5%' },
            { name: 'Peugeot 3008 II', pct: '-6%' },
          ].map((v, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[9px] text-gray-400 truncate mr-1">{v.name}</span>
              <span className="text-[9px] text-red-400 font-semibold shrink-0">{v.pct}</span>
            </div>
          ))}
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <p className="text-[10px] font-semibold text-blue-400">🌍 PAYS AVANTAGEUX</p>
          {[
            { flag: '🇩🇪', name: 'Allemagne', note: '-10 à -15%' },
            { flag: '🇧🇪', name: 'Belgique', note: '-5 à -10%' },
            { flag: '🇳🇱', name: 'Pays-Bas', note: '-5 à -8%' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px]">{p.flag}</span>
              <span className="text-[9px] text-gray-400 truncate">{p.name}</span>
              <span className="text-[8px] text-green-400 shrink-0 ml-auto">{p.note}</span>
            </div>
          ))}
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <p className="text-[10px] font-semibold text-purple-400">⚡ SEGMENTS CHAUDS</p>
          {[
            { name: 'SUV hybrides compacts', trend: '↑' },
            { name: 'Berlines élec. premium', trend: '↑' },
            { name: 'Breaks diesel premium', trend: '↓' },
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[9px] text-gray-400 truncate mr-1">{s.name}</span>
              <span className={`text-[9px] font-semibold shrink-0 ${s.trend === '↑' ? 'text-green-400' : 'text-red-400'}`}>{s.trend}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] font-semibold text-white mb-1.5">✨ Import intelligent</p>
        <div className="rounded-md bg-black/30 border border-white/[0.05] p-2 mb-1.5">
          <p className="text-[9px] text-gray-500 leading-relaxed">BMW 320d xDrive Touring – 2021, 45 000 km · Diesel · Automatique, Prix : 28 900 €</p>
        </div>
        <div className="flex justify-end">
          <span className="text-[10px] px-2.5 py-1 rounded-md bg-orange-500 text-white font-semibold">✨ Analyser</span>
        </div>
      </div>
    </div>
  )
}

// ── Mockup: Finance / Marge ──────────────────────────────────────────────────

function MockupFinance() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-semibold">Vue actuelle</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md text-gray-500">Historique</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.08]">CSV</span>
      </div>
      <div className="flex gap-1.5 text-[9px]">
        {['Ce mois', 'Mois préc.', 'Trimestre'].map((f, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-500">{f}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold">Cette année</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Chiffre d'affaires", value: '516 500 €', color: 'text-white' },
          { label: 'Total charges', value: '415 350 €', color: 'text-white' },
          { label: 'Marge nette', value: '59 150 €', color: 'text-green-400' },
          { label: 'Marge moy./vente', value: '3 943 €', color: 'text-green-400', sub: '17 ventes' },
        ].map((kpi, i) => (
          <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-[8px] text-gray-500 mb-0.5">{kpi.label}</p>
            <p className={`text-xs font-bold ${kpi.color}`}>{kpi.value}</p>
            {kpi.sub && <p className="text-[8px] text-gray-600">{kpi.sub}</p>}
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-white mb-2">📊 Objectifs</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-gray-400">Marge mensuelle</span>
              <span className="text-gray-500">0 € / 5 000 €</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full w-[2%] rounded-full bg-red-500" />
            </div>
            <p className="text-[8px] text-red-400 mt-1">0% — il manque 5 000 €</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-gray-400">CA annuel</span>
              <span className="text-gray-500">516 500 € / 100 000 €</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full w-full rounded-full bg-green-500" />
            </div>
            <p className="text-[8px] text-green-400 mt-1">Objectif atteint ✓</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mockup: Annonces ─────────────────────────────────────────────────────────

function MockupAnnonces() {
  const listings = [
    { flag: '🇩🇪', name: 'BMW 320d xDrive Touring', sub: 'G21 · 2021', info: '45 000 km · Diesel · Auto', price: '28 900 €', score: 94, status: 'En négo', statusColor: 'bg-orange-500/20 text-orange-400', client: 'Jean Dupont', margin: '+3 250 €' },
    { flag: '🇫🇷', name: 'Tesla Model Y LR', sub: '2023', info: '15 000 km · Élec. · Auto', price: '42 500 €', score: 92, status: 'Vue', statusColor: 'bg-blue-500/20 text-blue-400', client: 'Alexandre Roux', margin: '+2 800 €' },
    { flag: '🇧🇪', name: 'Audi A6 Avant', sub: '2020', info: '72 000 km · Diesel · Auto', price: '33 000 €', score: 80, status: 'Nouvelle', statusColor: 'bg-gray-500/20 text-gray-400', client: null, margin: null },
    { flag: '🇳🇱', name: 'Peugeot 3008 GT Hybrid', sub: '2022', info: '38 000 km · Hybride · Auto', price: '26 500 €', score: 88, status: 'Vue', statusColor: 'bg-blue-500/20 text-blue-400', client: 'Karim Benali', margin: '+1 950 €' },
  ]
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">4 annonces</p>
        <div className="flex gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500 text-white font-semibold">+ Nouvelle annonce</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.08]">CSV</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="flex-1 h-6 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center px-2">
          <Search className="w-2.5 h-2.5 text-gray-600 mr-1" />
          <span className="text-[9px] text-gray-600">Rechercher...</span>
        </div>
        {['Tous les clients', 'Tous les statuts', 'Tous les pays', 'Score ↓'].map((f, i) => (
          <span key={i} className="text-[8px] px-1.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-gray-500 whitespace-nowrap">{f}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {listings.map((l, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{l.flag}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${l.statusColor}`}>{l.status}</span>
              </div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${l.score >= 90 ? 'bg-green-500/20 text-green-400' : l.score >= 85 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {l.score}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white leading-tight">{l.name}</p>
              <p className="text-[9px] text-gray-500">{l.sub}</p>
            </div>
            <p className="text-[9px] text-gray-500">{l.info}</p>
            <p className="text-sm font-bold text-orange-400">{l.price}</p>
            <div className="flex items-center justify-between pt-0.5">
              {l.margin ? (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">Marge : {l.margin}</span>
              ) : (
                <span className="text-[8px] text-gray-600">—</span>
              )}
              <span className="text-[8px] text-gray-500">{l.client ? `👤 ${l.client}` : 'Non assigné'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mockup: Stats ────────────────────────────────────────────────────────────

function MockupStats() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white">Statistiques</p>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.08]">CSV</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Total annonces', value: '22', color: 'text-white' },
          { label: 'Prix moyen', value: '26 235 €', color: 'text-white' },
          { label: 'KM moyen', value: '59 814', color: 'text-white' },
          { label: 'Score moyen', value: '81/100', color: 'text-green-400' },
          { label: 'Bonnes affaires', value: '20', color: 'text-green-400' },
          { label: 'Marge totale', value: '59 150 €', color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-[8px] text-gray-500">{s.label}</p>
            <p className={`text-[11px] font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] font-semibold text-white mb-2">📈 Évolution mensuelle (6 mois)</p>
        <svg viewBox="0 0 240 60" className="w-full h-12" fill="none">
          <path d="M0,50 L40,42 L80,35 L120,20 L160,15 L200,22 L240,18" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0,50 L40,42 L80,35 L120,20 L160,15 L200,22 L240,18 L240,60 L0,60Z" fill="url(#grad)" />
          <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity="0.2" /><stop offset="100%" stopColor="#f97316" stopOpacity="0" /></linearGradient></defs>
          {['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((m, i) => (
            <text key={i} x={i * 40} y="59" className="text-[6px] fill-gray-600">{m}</text>
          ))}
        </svg>
      </div>
      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] font-semibold text-white mb-1.5">🏆 Top 5 meilleures affaires</p>
        <div className="space-y-1">
          <div className="grid grid-cols-[16px_1fr_40px_52px_44px_48px] gap-1 text-[8px] text-gray-600 font-medium pb-0.5 border-b border-white/[0.04]">
            <span>#</span><span>Véhicule</span><span>Année</span><span className="text-right">Prix</span><span className="text-right">Score</span><span className="text-right">Statut</span>
          </div>
          {[
            { rank: 1, car: 'Tesla Model Y', year: '2023', price: '35 000 €', score: '94', status: 'Vu', statusColor: 'bg-blue-500/20 text-blue-400' },
            { rank: 2, car: 'BMW i4', year: '2022', price: '38 000 €', score: '93', status: 'Revendu', statusColor: 'bg-green-500/20 text-green-400' },
            { rank: 3, car: 'Tesla Model 3', year: '2022', price: '27 500 €', score: '92', status: 'Revendu', statusColor: 'bg-green-500/20 text-green-400' },
          ].map((r) => (
            <div key={r.rank} className="grid grid-cols-[16px_1fr_40px_52px_44px_48px] gap-1 text-[9px] items-center">
              <span className="text-orange-400 font-bold">#{r.rank}</span>
              <span className="text-gray-300 truncate">{r.car}</span>
              <span className="text-gray-500">{r.year}</span>
              <span className="text-gray-300 text-right">{r.price}</span>
              <span className="text-green-400 text-right font-semibold">{r.score}</span>
              <span className={`text-[8px] px-1 py-0.5 rounded text-center ${r.statusColor}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const tabs = [
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    title: 'Gestion clients centralisée',
    description: 'Créez un dossier par mandant avec budget, critères et historique complet de vos échanges.',
    mockup: <MockupClients />,
  },
  {
    id: 'search',
    label: 'Recherche',
    icon: Search,
    title: 'Tendances & Import IA',
    description: "Suivez les prix du marché VO, repérez les pays avantageux et importez n'importe quelle annonce en 5 secondes avec l'IA.",
    mockup: <MockupRecherche />,
  },
  {
    id: 'listings',
    label: 'Annonces',
    icon: Car,
    title: 'Toutes vos annonces VO centralisées',
    description: 'Scoring auto, filtres multi-critères, marge nette par véhicule. Chaque annonce est analysée et prête à être partagée.',
    mockup: <MockupAnnonces />,
  },
  {
    id: 'margin',
    label: 'Finance',
    icon: Calculator,
    title: 'Finance & Objectifs',
    description: 'CA, charges, marge nette par véhicule en temps réel. Fixez vos objectifs et suivez votre progression.',
    mockup: <MockupFinance />,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: BarChart3,
    title: 'Statistiques détaillées',
    description: 'Annonces, scores, prix moyens, top affaires. Pilotez votre parc avec des données concrètes.',
    mockup: <MockupStats />,
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export function FeatureTabs() {
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % tabs.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section className="py-24 px-4 bg-[#06090f]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tout, dans un seul outil
          </h2>
          <p className="text-gray-400 text-lg">
            5 modules qui transforment votre activité
          </p>
        </div>

        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl shadow-orange-500/5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Browser top bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-6 rounded-md bg-white/[0.03] px-3 flex items-center text-xs text-gray-500">
                cartrackerpro.fr/dashboard
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b border-white/[0.05] overflow-x-auto">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(idx)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                    active === idx ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {active === idx && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-6 md:p-8 h-[480px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={tabs[active].id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-[280px_1fr] gap-6 items-start h-full"
              >
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                    {tabs[active].title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {tabs[active].description}
                  </p>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/[0.05] p-4 overflow-hidden">
                  {tabs[active].mockup}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-1 px-6 pb-6">
            {tabs.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  idx === active ? 'bg-orange-500' : 'bg-white/[0.05]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
