'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Car, X, ArrowRight, ChevronDown,
  Check, Star, Globe, Zap, Calculator, Share2, Bot, BarChart3,
  Puzzle, CheckCircle, Sparkles, Users, Euro, FileText,
  TrendingUp, Newspaper, ClipboardList, Search, Minus, Plus,
  MessageSquare, Pause, Play,
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, inView: boolean, duration = 1600) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let current = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return count
}

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Sparkles, label: 'Import Intelligent IA', desc: "Copiez-collez le texte d'une annonce, l'IA extrait tout en 5 secondes. Marque, modèle, prix, km, carburant, boîte, pays.", color: 'yellow', glow: 'hover:border-yellow-500/40 hover:shadow-[0_0_16px_rgba(234,179,8,0.1)]' },
  { icon: Puzzle, label: 'Extension Chrome', desc: "Importez directement depuis AutoScout24, La Centrale, LeBonCoin, mobile.de avec les photos. Un clic suffit.", color: 'cyan', glow: 'hover:border-cyan-500/40 hover:shadow-[0_0_16px_rgba(6,182,212,0.1)]' },
  { icon: Calculator, label: 'Calcul de marge', desc: "Prix d'achat + transport + remise en état + CT + immat = coût total. Marge nette calculée à l'euro près.", color: 'green', glow: 'hover:border-green-500/40 hover:shadow-[0_0_16px_rgba(34,197,94,0.1)]' },
  { icon: Share2, label: 'Partage client', desc: "Générez un lien de partage. Votre client voit les voitures et peut répondre. Vos sources restent confidentielles.", color: 'blue', glow: 'hover:border-blue-500/40 hover:shadow-[0_0_16px_rgba(59,130,246,0.1)]' },
  { icon: Globe, label: '16 pays européens', desc: "Allemagne, Belgique, Pologne, Espagne, Italie, Pays-Bas, Suède, Roumanie… Toute l'Europe couverte.", color: 'violet', glow: 'hover:border-violet-500/40 hover:shadow-[0_0_16px_rgba(139,92,246,0.1)]' },
  { icon: Bot, label: 'Gamos IA', desc: "Votre assistant IA personnel. Conseils d'import, frais par pays, aide à la rédaction. Disponible 24h/24.", color: 'orange', glow: 'hover:border-orange-500/40 hover:shadow-[0_0_16px_rgba(249,115,22,0.15)]' },
  { icon: BarChart3, label: 'Suivi Finance', desc: "CA, marges, objectifs mensuels et annuels. Pilotez votre activité comme un vrai business.", color: 'teal', glow: 'hover:border-teal-500/40 hover:shadow-[0_0_16px_rgba(20,184,166,0.1)]' },
  { icon: ClipboardList, label: 'Checklist pré-achat', desc: "12 points de vérification : CT, carnet, HistoVec, sinistres, essai, pneus, papiers, gage…", color: 'emerald', glow: 'hover:border-emerald-500/40 hover:shadow-[0_0_16px_rgba(16,185,129,0.1)]' },
  { icon: Newspaper, label: 'Blog intégré', desc: "Créez et publiez des articles optimisés SEO pour attirer des clients. Génération assistée par IA.", color: 'rose', glow: 'hover:border-rose-500/40 hover:shadow-[0_0_16px_rgba(244,63,94,0.1)]' },
]

const ICON_COLOR: Record<string, string> = {
  yellow: 'text-yellow-400 bg-yellow-900/20',
  cyan: 'text-cyan-400 bg-cyan-900/20',
  green: 'text-green-400 bg-green-900/20',
  blue: 'text-blue-400 bg-blue-900/20',
  violet: 'text-violet-400 bg-violet-900/20',
  orange: 'text-orange-400 bg-orange-900/20',
  teal: 'text-teal-400 bg-teal-900/20',
  emerald: 'text-emerald-400 bg-emerald-900/20',
  rose: 'text-rose-400 bg-rose-900/20',
}

const STEPS = [
  { num: '1', icon: Search, title: 'Trouvez', desc: "Naviguez sur les sites européens ou utilisez l'import IA pour ajouter des annonces en secondes." },
  { num: '2', icon: ClipboardList, title: 'Organisez', desc: "Associez les annonces à vos clients, calculez les marges, remplissez la checklist pré-achat." },
  { num: '3', icon: Share2, title: 'Partagez', desc: "Envoyez une sélection personnalisée par lien sécurisé. Votre client répond directement." },
  { num: '4', icon: Euro, title: 'Vendez', desc: "Marquez comme revendu. Le CA et la marge se calculent automatiquement dans Finance." },
]

const COMPARE_ROWS = [
  { feature: "Import IA depuis sites européens", ctp: true, a: false, b: false, c: false },
  { feature: "Extension Chrome d'import", ctp: true, a: false, b: false, c: false },
  { feature: "Partage client sans source", ctp: true, a: false, b: "Partiel", c: false },
  { feature: "Assistant IA intégré", ctp: true, a: false, b: false, c: false },
  { feature: "16 pays européens", ctp: true, a: "France seule", b: "4 pays", c: "France seule" },
  { feature: "Calcul de marge complet", ctp: true, a: "Partiel", b: true, c: "Partiel" },
  { feature: "Blog intégré", ctp: true, a: false, b: false, c: false },
  { feature: "Prix", ctp: "Dès 0€", a: "50-150€/m.", b: "80-200€/m.", c: "60-120€/m." },
]

const FAQS = [
  {
    q: "CarTracker Pro fonctionne avec quels sites d'annonces ?",
    a: "Notre extension Chrome fonctionne nativement avec AutoScout24, La Centrale, LeBonCoin, mobile.de, Le Parking et AutoHero. Pour tous les autres sites, notre IA universelle extrait automatiquement les informations. L'import IA par copier-coller fonctionne avec n'importe quel texte d'annonce."
  },
  {
    q: "Est-ce que mes clients voient d'où viennent les annonces ?",
    a: "Non, jamais. Quand vous partagez une sélection par lien, le client voit uniquement les photos, les caractéristiques et le prix que vous avez fixé. Aucune source, aucun site d'origine n'est visible."
  },
  {
    q: "Comment fonctionne le calcul de marge ?",
    a: "Vous entrez le prix d'achat, les frais de transport, remise en état, contrôle technique, immatriculation et autres frais. L'outil calcule le coût total et votre marge nette en fonction du prix de revente que vous fixez."
  },
  {
    q: "Je peux essayer gratuitement ?",
    a: "Oui ! Le plan Starter est gratuit avec 10 annonces et 5 clients. Aucune carte bancaire requise. Le plan Pro offre un essai gratuit de 14 jours."
  },
  {
    q: "Qu'est-ce que Gamos ?",
    a: "Gamos est votre assistant IA intégré directement dans l'outil. Il connaît le marché automobile européen, peut vous aider à calculer les frais d'import par pays, rédiger des messages clients, et vous guider dans toutes les fonctionnalités de l'outil."
  },
  {
    q: "Est-ce que l'outil fonctionne sur mobile ?",
    a: "Oui, CarTracker Pro est entièrement responsive. Vous pouvez gérer vos clients et annonces depuis votre téléphone. L'extension Chrome fonctionne sur ordinateur."
  },
]

const DEMO_TABS = [
  { id: 'import', label: '⚡ Import IA' },
  { id: 'extension', label: '🔌 Extension' },
  { id: 'clients', label: '👥 Clients' },
  { id: 'marge', label: '💰 Marge' },
  { id: 'partage', label: '🔗 Partage' },
  { id: 'gamos', label: '🤖 Gamos' },
  { id: 'finance', label: '📊 Finance' },
]

const DEMO_DESC: Record<string, string> = {
  import: "Copiez le texte d'une annonce depuis n'importe quel site européen. Notre IA extrait automatiquement marque, modèle, année, km, prix, carburant, boîte, pays. 5 secondes chrono.",
  extension: "Installez notre extension Chrome. Naviguez sur AutoScout24, La Centrale, LeBonCoin, mobile.de — un clic sur l'icône CarTracker et l'annonce est dans votre bibliothèque. Avec les photos.",
  clients: "Créez des dossiers par client. Budget, critères de recherche, notes de suivi datées. Associez les annonces à chaque client. Retrouvez tout en 1 clic.",
  marge: "Calculez votre marge nette sur chaque annonce. Prix d'achat, transport, remise en état, CT, immatriculation — tout est pris en compte. Fixez vos objectifs financiers.",
  partage: "Envoyez une sélection personnalisée à votre client par lien. Il voit les voitures avec les photos et peut dire 'celle-ci m'intéresse'. Vous ne révélez jamais vos sources.",
  gamos: "Votre assistant IA personnel. Il connaît le marché auto, calcule les frais d'import, vous guide dans l'outil. Disponible 24h/24 dans un chat intégré.",
  finance: "Suivez votre chiffre d'affaires, vos marges et vos performances. Fixez des objectifs mensuels ou annuels. Visualisez votre activité comme un vrai business.",
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('import')
  const [tabTransition, setTabTransition] = useState<'idle' | 'out' | 'in'>('idle')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)  // hover pause
  const [progressKey, setProgressKey] = useState(0) // bump to restart CSS animation
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const INTERVAL_MS = 4000
  const TAB_IDS = DEMO_TABS.map(t => t.id)

  // Animated tab switch (out → swap → in)
  const switchTab = useCallback((id: string) => {
    setTabTransition('out')
    setTimeout(() => {
      setActiveTab(id)
      setProgressKey(k => k + 1)
      setTabTransition('in')
      setTimeout(() => setTabTransition('idle'), 320)
    }, 200)
  }, [])

  // Manual click: reset timer then switch
  const changeTab = useCallback((id: string) => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    switchTab(id)
    // Restart interval after manual click
    if (isPlaying) {
      autoPlayRef.current = setInterval(() => {
        setActiveTab(prev => {
          const idx = TAB_IDS.indexOf(prev)
          const next = TAB_IDS[(idx + 1) % TAB_IDS.length]
          switchTab(next)
          return prev // state is updated inside switchTab
        })
      }, INTERVAL_MS)
    }
  }, [isPlaying, switchTab, TAB_IDS])

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
      return
    }
    autoPlayRef.current = setInterval(() => {
      setActiveTab(prev => {
        const idx = TAB_IDS.indexOf(prev)
        const next = TAB_IDS[(idx + 1) % TAB_IDS.length]
        switchTab(next)
        return prev
      })
    }, INTERVAL_MS)
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current) }
  }, [isPlaying, isPaused, switchTab, TAB_IDS])

  const toggleFaq = (i: number) => setOpenFaq(prev => prev === i ? null : i)

  // ── DEMO MOCKUPS ──────────────────────────────────────────────────────────

  const MockImport = () => (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#2a2f3e] bg-[#060912] p-3 text-sm text-gray-600 min-h-[80px]">
        BMW 320d xDrive Touring – 2021 · 45 000 km · Diesel · Automatique · Prix : 18 500 € · Vendeur pro, Allemagne...
      </div>
      <button className="w-full py-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-sm font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" /> Analyser avec l'IA
      </button>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[['Marque','BMW'],['Modèle','320d'],['Année','2021'],['Km','45 000'],['Prix','18 500€'],['Pays','🇩🇪 DE']].map(([k,v]) => (
          <div key={k} className="rounded-md bg-[#0d1117] border border-[#1a1f2e] px-2 py-1.5">
            <p className="text-[9px] text-gray-600 mb-0.5">{k}</p>
            <p className="text-xs font-semibold text-orange-400">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" /> Annonce importée avec succès
      </div>
    </div>
  )

  const MockExtension = () => (
    <div className="space-y-2">
      <div className="rounded-lg border border-[#2a2f3e] bg-[#060912] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border-b border-[#1a1f2e]">
          <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
          <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-[#060912] border border-[#2a2f3e] text-[10px] text-gray-500 truncate">autoscout24.de/bmw-320d-touring-2021...</div>
          <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center flex-shrink-0"><Car className="w-3 h-3 text-white" /></div>
        </div>
        <div className="p-3 space-y-2">
          <div className="rounded-lg border border-orange-500/30 bg-[#0a0d14] p-3 space-y-2">
            <div className="flex gap-2">
              <div className="w-16 h-12 rounded bg-[#1a1f2e] flex items-center justify-center text-gray-600 flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-100">BMW 320d G20</p>
                <p className="text-xs text-gray-500">2021 · 45 000 km · Diesel</p>
                <p className="text-sm font-bold text-orange-400">18 500 €</p>
              </div>
            </div>
            <select className="w-full h-7 rounded border border-[#2a2f3e] bg-[#060912] text-xs text-gray-400 px-2">
              <option>M. Dupont ▼</option>
            </select>
            <button className="w-full py-1.5 rounded bg-orange-500 text-white text-xs font-medium flex items-center justify-center gap-1.5">
              <Plus className="w-3 h-3" /> Importer dans CarTracker
            </button>
            <p className="text-[10px] text-green-400 text-center">✅ Annonce importée avec 6 photos</p>
          </div>
        </div>
      </div>
    </div>
  )

  const MockClients = () => (
    <div className="space-y-2">
      {[
        { name: 'Thomas Martin', budget: '25 000€', crit: 'SUV diesel auto', count: 8, badge: 'Actif', bc: 'bg-green-900/30 text-green-400 border-green-500/30', init: 'TM', ac: 'bg-blue-900/30 text-blue-400' },
        { name: 'Sophie Durand', budget: '35 000€', crit: 'Berline premium', count: 12, badge: 'En négo', bc: 'bg-orange-900/30 text-orange-400 border-orange-500/30', init: 'SD', ac: 'bg-purple-900/30 text-purple-400' },
        { name: 'Karim Benzema', budget: '18 000€', crit: 'Citadine hybride', count: 3, badge: 'Nouveau', bc: 'bg-gray-800/50 text-gray-400 border-gray-600/30', init: 'KB', ac: 'bg-teal-900/30 text-teal-400' },
      ].map(c => (
        <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-[#060912] border border-[#1a1f2e]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.ac}`}>{c.init}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-200">{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${c.bc}`}>{c.badge}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{c.budget} · {c.crit} · {c.count} annonces</p>
          </div>
        </div>
      ))}
    </div>
  )

  const MockMarge = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Coûts</p>
        {[['Prix d\'achat','18 500€'],['Transport','450€'],['Remise en état','800€'],['CT','80€'],['Immat','300€'],['Autres','0€']].map(([k,v]) => (
          <div key={k} className="flex justify-between text-xs py-1 border-b border-[#1a1f2e]">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-300 font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Résultat</p>
        <div className="rounded-lg bg-[#060912] border border-[#1a1f2e] p-2.5">
          <p className="text-[10px] text-gray-600">Coût total</p>
          <p className="text-sm font-bold text-gray-200">20 130 €</p>
        </div>
        <div className="rounded-lg bg-[#060912] border border-[#1a1f2e] p-2.5">
          <p className="text-[10px] text-gray-600">Prix revente</p>
          <p className="text-sm font-bold text-gray-200">23 500 €</p>
        </div>
        <div className="rounded-xl bg-green-900/25 border border-green-500/30 p-3 flex-1">
          <p className="text-[10px] text-green-500 font-semibold">MARGE NETTE</p>
          <p className="text-2xl font-extrabold text-green-400 leading-tight">+3 370€</p>
          <p className="text-xs text-green-500 font-medium">+16,7%</p>
        </div>
      </div>
    </div>
  )

  const MockPartage = () => (
    <div className="space-y-2">
      <div className="rounded-lg bg-[#060912] border border-orange-500/20 p-3">
        <p className="text-xs font-semibold text-orange-400 mb-0.5">Sélection pour Thomas Martin</p>
        <p className="text-[10px] text-gray-600">par CarTracker Pro · 3 véhicules</p>
      </div>
      {[['BMW 320d G20','2021 · 45 000 km · Diesel · Auto','23 500€','87'],['Mercedes GLC','2020 · 58 000 km · Diesel · Auto','28 900€','82']].map(([t,s,p,sc]) => (
        <div key={t} className="flex gap-2 p-2.5 rounded-lg bg-[#060912] border border-[#1a1f2e]">
          <div className="w-14 h-10 rounded bg-[#1a1f2e] flex items-center justify-center text-gray-600 flex-shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-gray-200">{t}</span>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-900/20 px-1.5 py-0.5 rounded-full">{sc}</span>
            </div>
            <p className="text-[10px] text-gray-500 truncate">{s}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-orange-400">{p}</span>
              <button className="text-[10px] text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded-full">♥ Intéressé</button>
            </div>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-gray-600 text-center">🔒 Aucune source n'est visible par le client</p>
    </div>
  )

  const MockGamos = () => (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#1a1f2e] rounded-2xl rounded-tr-sm px-3 py-2">
          <p className="text-xs text-gray-200">Combien coûte l'import d'une voiture depuis la Pologne ?</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="max-w-[85%] bg-[#060912] border border-[#1a1f2e] rounded-2xl rounded-tl-sm px-3 py-2">
          <p className="text-xs text-gray-300 leading-relaxed">Pour une voiture depuis la <span className="text-orange-400 font-medium">Pologne</span>, comptez environ :<br/>• Transport : <span className="text-green-400">600-800€</span><br/>• Quitus fiscal : <span className="text-green-400">gratuit (UE)</span><br/>• Immatriculation : <span className="text-gray-200">~300€</span><br/>• CT : <span className="text-gray-200">~80€</span><br/><br/>Total estimé : <span className="text-orange-400 font-semibold">980-1 180€ de frais</span></p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <input readOnly className="flex-1 h-8 rounded-full bg-[#060912] border border-[#2a2f3e] text-xs text-gray-600 px-3" defaultValue="Posez votre question à Gamos..." />
        <button className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  )

  const MockFinance = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[['CA du mois','12 400 €','↑ +23%','text-green-400'],['Marge totale','4 200 €','↑ +18%','text-green-400'],['Véhicules vendus','5','Ce mois','text-blue-400'],['Objectif','78%','Atteint','text-orange-400']].map(([l,v,s,c]) => (
          <div key={l} className="rounded-lg bg-[#060912] border border-[#1a1f2e] p-2.5">
            <p className="text-[9px] text-gray-600 mb-0.5">{l}</p>
            <p className="text-base font-bold text-gray-100">{v}</p>
            <p className={`text-[10px] font-medium ${c}`}>{s}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Objectif mensuel : 15 000€ de CA</span><span className="text-orange-400">78%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#1a1f2e]">
          <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: '78%' }} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[9px] text-gray-600 uppercase tracking-wide">Marge par mois</p>
        {[['Mars','4 200€',78],['Fév.','3 100€',57],['Jan.','2 800€',52]].map(([m,v,pct]) => (
          <div key={m} className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-600 w-7">{m}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[#1a1f2e]">
              <div className="h-1.5 rounded-full bg-orange-500/70" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-gray-400 w-12 text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const DEMO_MOCK: Record<string, React.ReactNode> = {
    import: <MockImport />, extension: <MockExtension />, clients: <MockClients />,
    marge: <MockMarge />, partage: <MockPartage />, gamos: <MockGamos />, finance: <MockFinance />,
  }

  // ── STATS section (animated counters) ─────────────────────────────────────
  const { ref: statsRef, inView: statsInView } = useInView(0.3)
  const c1 = useCountUp(500, statsInView)
  const c2 = useCountUp(16, statsInView)
  const c3 = useCountUp(10000, statsInView)
  const c4 = useCountUp(98, statsInView)

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">

      {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-sm text-orange-300 animate-pulse-slow">
            <span>✨</span>
            <span>L'outil n°1 des mandataires auto en Europe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-gray-100">Trouvez, suivez et vendez</span><br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">les meilleures voitures</span><br />
            <span className="text-gray-100">d'Europe.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            L'outil tout-en-un pour les mandataires, courtiers et négociants auto. Importez des annonces en 1 clic depuis toute l'Europe, calculez vos marges, partagez des sélections pro à vos clients.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base transition-all hover:scale-[1.02] shadow-[0_0_28px_rgba(249,115,22,0.45)] flex items-center justify-center gap-2">
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => scrollTo('demo')} className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-gray-600 text-white font-semibold text-base hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
              Voir la démo <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <p className="text-sm text-gray-500">500+ pros actifs &nbsp;•&nbsp; 16 pays couverts &nbsp;•&nbsp; 0€ pour commencer</p>

          {/* Site badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {['AutoScout24','La Centrale','LeBonCoin','mobile.de','Le Parking'].map(s => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-[#0a0d14] border border-[#1a1f2e] text-xs text-gray-600 font-medium">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PROBLÈME / SOLUTION ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100">Avant CarTracker Pro <span className="text-orange-400">vs</span> Après</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeUp delay={70}>
              <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6 space-y-3">
                <p className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wide">😤 Sans CarTracker Pro</p>
                {[
                  "3h par jour à scroller AutoScout24, La Centrale, mobile.de",
                  "Copier-coller les infos dans Excel ou un carnet",
                  "Calculer les frais d'import à la main",
                  "Envoyer 15 screenshots WhatsApp au client",
                  "Perdre le fil entre 5 clients différents",
                  "Aucune visibilité sur vos marges réelles",
                ].map(t => (
                  <div key={t} className="flex items-start gap-3 text-sm text-gray-400">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    {t}
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={140}>
              <div className="rounded-2xl border border-green-500/20 bg-green-900/10 p-6 space-y-3">
                <p className="text-sm font-bold text-green-400 mb-4 uppercase tracking-wide">🚀 Avec CarTracker Pro</p>
                {[
                  "Import en 1 clic avec l'extension Chrome",
                  "Toutes les annonces organisées par client",
                  "Marge nette calculée automatiquement",
                  "Partage client par lien pro (sans révéler la source)",
                  "Dashboard avec KPIs et suivi financier",
                  "Assistant IA intégré 24h/24",
                ].map(t => (
                  <div key={t} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {t}
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 4. DÉMO INTERACTIVE ────────────────────────────────────────────── */}
      <section id="demo" className="py-20 px-4 bg-[#080b10]">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">Découvrez CarTracker Pro en action</h2>
            <p className="text-gray-400">Cliquez sur chaque fonctionnalité pour la voir en détail</p>
          </FadeUp>

          {/* Tabs */}
          <FadeUp delay={70}>
            {/* Tabs row + play/pause button */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 scrollbar-none">
                {DEMO_TABS.map(tab => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => changeTab(tab.id)}
                      className={`relative shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap overflow-hidden ${
                        active
                          ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                          : 'bg-[#0a0d14] border border-[#1a1f2e] text-gray-500 hover:text-gray-300 hover:border-[#2a2f3e]'
                      }`}
                    >
                      {tab.label}
                      {/* Progress bar */}
                      {active && isPlaying && !isPaused && (
                        <span
                          key={progressKey}
                          className="absolute bottom-0 left-0 h-0.5 bg-white/50 rounded-full"
                          style={{
                            width: '0%',
                            animation: `demoProgress ${INTERVAL_MS}ms linear forwards`,
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Play/Pause toggle */}
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2f3e] bg-[#0a0d14] text-gray-500 hover:text-gray-300 hover:border-[#3a3f4e] transition-colors"
                title={isPlaying ? 'Mettre en pause' : 'Reprendre'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </FadeUp>

          {/* Keyframes injected once */}
          <style>{`
            @keyframes demoProgress {
              from { width: 0% }
              to   { width: 100% }
            }
          `}</style>

          <FadeUp delay={140}>
            <div
              className="rounded-2xl border border-[#1a1f2e] bg-[#0a0d14] overflow-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="p-5 md:p-6 border-b border-[#1a1f2e]">
                <p
                  className="text-sm text-gray-400 leading-relaxed"
                  style={{
                    opacity: tabTransition === 'out' ? 0 : 1,
                    transform: tabTransition === 'out' ? 'translateX(-12px)' : tabTransition === 'in' ? 'translateX(0)' : 'none',
                    transition: tabTransition === 'out' ? 'opacity 0.2s ease, transform 0.2s ease' : 'opacity 0.3s ease, transform 0.3s ease',
                  }}
                >
                  {DEMO_DESC[activeTab]}
                </p>
              </div>
              <div
                className="p-5 md:p-6"
                style={{
                  opacity: tabTransition === 'out' ? 0 : 1,
                  transform: tabTransition === 'out'
                    ? 'translateX(-20px)'
                    : tabTransition === 'in'
                    ? 'translateX(0)'
                    : 'none',
                  transition: tabTransition === 'out'
                    ? 'opacity 0.2s ease, transform 0.2s ease'
                    : 'opacity 0.3s ease, transform 0.3s ease',
                }}
              >
                <div className="max-w-lg mx-auto">
                  {DEMO_MOCK[activeTab]}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 5. EXTENSION CHROME ────────────────────────────────────────────── */}
      <section id="extension" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">🔌 Extension Chrome</p>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 leading-tight">Importez depuis n'importe quel site auto en 1 clic</h2>
                </div>
                <div className="space-y-3">
                  {[
                    "Naviguez comme d'habitude sur vos sites préférés",
                    "Un clic sur l'icône CarTracker Pro dans votre navigateur",
                    "L'annonce complète avec les photos est importée instantanément",
                    "Fonctionne sur AutoScout24, La Centrale, LeBonCoin, mobile.de, Le Parking, AutoHero et +50 autres sites grâce à l'IA",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-orange-400" />
                      </div>
                      <span className="text-sm text-gray-300">{t}</span>
                    </div>
                  ))}
                </div>
                <a href="#extension" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.35)]">
                  <Puzzle className="w-4 h-4" /> Installer l'extension Chrome
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={140}>
              <div className="space-y-4">
                {[
                  { icon: Globe, step: '1', title: "Naviguez sur AutoScout24.de", sub: "Trouvez l'annonce qui vous intéresse" },
                  { icon: Puzzle, step: '2', title: "Cliquez sur l'extension", sub: "Un clic sur l'icône CarTracker dans le navigateur" },
                  { icon: CheckCircle, step: '3', title: "Annonce importée avec photos", sub: "Toutes les infos + photos directement dans votre liste" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0d14] border border-[#1a1f2e]">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center">
                          <s.icon className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-[9px] text-white font-bold flex items-center justify-center">{s.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">{s.title}</p>
                        <p className="text-xs text-gray-500">{s.sub}</p>
                      </div>
                    </div>
                    {i < 2 && <div className="flex justify-center py-1"><div className="w-0.5 h-4 bg-orange-500/30 rounded-full" /></div>}
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['AutoScout24','La Centrale','LeBonCoin','mobile.de','Le Parking','AutoHero','+50 sites via IA'].map(s => (
                    <span key={s} className="text-[10px] text-gray-600 bg-[#0a0d14] border border-[#1a1f2e] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 6. FONCTIONNALITÉS ─────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 px-4 bg-[#080b10]">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">Tout ce qu'il vous faut pour dominer le marché</h2>
            <p className="text-gray-400 max-w-xl mx-auto">9 fonctionnalités pensées pour les professionnels de l'automobile</p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.label} delay={i * 60}>
                <div className={`group p-5 rounded-xl bg-[#0a0d14] border border-[#1a1f2e] transition-all duration-200 ${f.glow} h-full`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${ICON_COLOR[f.color]}`}>
                    <f.icon className={`w-4.5 h-4.5 ${ICON_COLOR[f.color].split(' ')[0]}`} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-100 mb-1.5">{f.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. COMMENT ÇA MARCHE ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">De la recherche à la vente en 4 étapes</h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <FadeUp key={s.num} delay={i * 80} className="relative">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                        <s.icon className="w-6 h-6 text-orange-400" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-[10px] text-white font-bold flex items-center justify-center">{s.num}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-100">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-7 left-full w-6 -translate-x-3 text-orange-500/40 text-lg">→</div>
                )}
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. COMPARAISON ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#080b10]">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">Pourquoi les pros choisissent CarTracker Pro</h2>
          </FadeUp>
          <FadeUp delay={70}>
            <div className="overflow-x-auto rounded-2xl border border-[#1a1f2e]">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#1a1f2e]">
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fonctionnalité</th>
                    <th className="p-4 text-xs font-semibold text-orange-400 uppercase tracking-wide bg-orange-500/5">CarTracker Pro</th>
                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">AutoCerfa</th>
                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">VObiz</th>
                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Optimcar</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-[#1a1f2e] ${i % 2 === 0 ? 'bg-[#0a0d14]' : 'bg-transparent'}`}>
                      <td className="p-3.5 text-sm text-gray-300">{row.feature}</td>
                      {[row.ctp, row.a, row.b, row.c].map((v, ci) => (
                        <td key={ci} className={`p-3.5 text-center ${ci === 0 ? 'bg-orange-500/5' : ''}`}>
                          {v === true ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                           : v === false ? <X className="w-4 h-4 text-red-500/60 mx-auto" />
                           : <span className={`text-xs ${ci === 0 ? 'text-orange-400 font-semibold' : 'text-gray-600'}`}>{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 9. CHIFFRES CLÉS ───────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div ref={statsRef} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: c1, suffix: '+', label: 'Pros actifs' },
              { val: c2, suffix: '', label: 'Pays couverts' },
              { val: c3, suffix: '+', label: 'Annonces importées', fmt: true },
              { val: c4, suffix: '%', label: 'Satisfaction client' },
            ].map(({ val, suffix, label, fmt }) => (
              <FadeUp key={label}>
                <div className="space-y-1">
                  <p className="text-4xl md:text-5xl font-extrabold text-orange-400">
                    {fmt ? val >= 1000 ? `${Math.floor(val / 1000)} 000` : val : val}{suffix}
                  </p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. TARIFS ─────────────────────────────────────────────────────── */}
      <section id="tarifs" className="py-20 px-4 bg-[#080b10]">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">Simple, transparent, sans surprise</h2>
            <p className="text-gray-400">Commencez gratuitement, évoluez quand vous êtes prêt.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <FadeUp delay={0}>
              <div className="rounded-2xl border border-[#1a1f2e] bg-[#0a0d14] p-6 flex flex-col h-full">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Starter</p>
                  <p className="text-4xl font-extrabold text-gray-100">Gratuit</p>
                  <p className="text-sm text-gray-500 mt-1">Pour commencer</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['10 annonces max','5 clients max','Import IA','Score bonne affaire'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-3.5 h-3.5 text-gray-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block text-center px-4 py-2.5 rounded-xl border border-[#2a2f3e] text-sm text-gray-300 hover:border-[#3a3f4e] hover:text-white transition-colors">
                  Commencer gratuitement
                </Link>
              </div>
            </FadeUp>

            {/* Pro */}
            <FadeUp delay={80}>
              <div className="rounded-2xl border border-orange-500/50 bg-[#0a0d14] p-6 flex flex-col h-full relative shadow-[0_0_40px_rgba(249,115,22,0.12)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-[11px] font-bold text-white whitespace-nowrap">Le plus populaire</div>
                <div className="mb-5">
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">Pro</p>
                  <div className="flex items-end gap-1">
                    <p className="text-4xl font-extrabold text-gray-100">49€</p>
                    <p className="text-gray-500 text-sm mb-1">/mois</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pour les pros actifs</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['Annonces illimitées','Clients illimités','Extension Chrome','Partage client par lien','Gamos assistant IA','Stats Finance + objectifs','Checklist pré-achat','Blog','Export CSV'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block text-center px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm text-white font-semibold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.35)]">
                  Essayer 14 jours gratuits
                </Link>
              </div>
            </FadeUp>

            {/* Agence */}
            <FadeUp delay={160}>
              <div className="rounded-2xl border border-[#1a1f2e] bg-[#0a0d14] p-6 flex flex-col h-full">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Agence</p>
                  <div className="flex items-end gap-1">
                    <p className="text-4xl font-extrabold text-gray-100">99€</p>
                    <p className="text-gray-500 text-sm mb-1">/mois</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pour les équipes</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['Tout le Plan Pro','3 utilisateurs','Support prioritaire','Rapport mensuel automatique'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-3.5 h-3.5 text-gray-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/login" className="block text-center px-4 py-2.5 rounded-xl border border-[#2a2f3e] text-sm text-gray-300 hover:border-[#3a3f4e] hover:text-white transition-colors">
                  Nous contacter
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 11. TÉMOIGNAGES ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">Ce que disent nos pros</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Thomas D.', role: 'Mandataire automobile, Lyon', text: "Avant CarTracker, je perdais 3h par semaine à chercher sur les sites allemands. Maintenant j'importe une annonce en 10 secondes avec l'extension.", init: 'TD', color: 'bg-blue-900/30 text-blue-400' },
              { name: 'Marie L.', role: 'Courtière auto, Paris', text: "Le partage client par lien a changé ma relation avec mes clients. Ils reçoivent une vraie sélection pro sans voir d'où je source.", init: 'ML', color: 'bg-pink-900/30 text-pink-400' },
              { name: 'Karim B.', role: 'Négociant VO, Marseille', text: "Gamos m'a aidé à calculer les frais d'import polonais. L'outil fait le travail que je faisais sur Excel en 10x moins de temps.", init: 'KB', color: 'bg-teal-900/30 text-teal-400' },
            ].map((t, i) => (
              <FadeUp key={t.name} delay={i * 80}>
                <div className="p-5 rounded-2xl bg-[#0a0d14] border border-[#1a1f2e] flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-1 border-t border-[#1a1f2e]">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}>{t.init}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-[#080b10]">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100">Questions fréquentes</h2>
          </FadeUp>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FadeUp key={i} delay={i * 50}>
                <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0d14] overflow-hidden">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <span className="text-sm font-medium text-gray-200">{faq.q}</span>
                    <div className="shrink-0 w-5 h-5 rounded-full bg-[#1a1f2e] flex items-center justify-center">
                      {openFaq === i ? <Minus className="w-3 h-3 text-orange-400" /> : <Plus className="w-3 h-3 text-gray-500" />}
                    </div>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '200px' : '0px', opacity: openFaq === i ? 1 : 0 }}
                  >
                    <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-[#1a1f2e] pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. CTA FINALE ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-orange-500/8 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <FadeUp>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-100 leading-tight">
              Prêt à transformer<br />votre activité ?
            </h2>
          </FadeUp>
          <FadeUp delay={80}>
            <p className="text-lg text-gray-400">
              Rejoignez les pros qui font confiance à CarTracker Pro.<br className="hidden sm:block" />
              Démarrez gratuitement, sans carte bancaire.
            </p>
          </FadeUp>
          <FadeUp delay={160} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 rounded-xl border border-gray-600 text-white font-semibold text-base hover:border-gray-400 transition-colors flex items-center justify-center">
              Se connecter
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── 14. FOOTER ─────────────────────────────────────────────────────── */}
      <Footer />

    </div>
  )
}
