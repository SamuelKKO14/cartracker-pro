'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Zap, Calculator, Share2, Globe, Bot, BarChart3,
  Check, X, Menu, Car, ChevronRight, Star, ArrowRight,
} from 'lucide-react'

// ─── Intersection Observer hook ───────────────────────────────────────────────

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

// ─── FadeUp wrapper ───────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const dur = 1800
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])
  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Demo Mockup ─────────────────────────────────────────────────────────────

const DEMO_STEPS = [
  { id: 'import', icon: '⚡', label: 'Import IA' },
  { id: 'margin', icon: '💰', label: 'Marge' },
  { id: 'share',  icon: '🔗', label: 'Partage' },
  { id: 'gamos',  icon: '🤖', label: 'Gamos' },
]

const URL_TEXT  = 'https://autoscout24.de/bmw-320d-2021...'
const CHAT_TEXT = 'Frais import depuis la Pologne ?'

function DemoMockup() {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)

  const runStep = useCallback((s: number) => {
    setTyped('')
    setRevealed(false)
    const target = s === 0 ? URL_TEXT : s === 3 ? CHAT_TEXT : ''

    if (target) {
      let i = 0
      const iv = setInterval(() => {
        i++
        setTyped(target.slice(0, i))
        if (i >= target.length) {
          clearInterval(iv)
          setTimeout(() => setRevealed(true), 400)
        }
      }, s === 3 ? 55 : 38)
      return () => clearInterval(iv)
    } else {
      const t = setTimeout(() => setRevealed(true), 350)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const cleanup = runStep(step)
    const next = setTimeout(() => setStep(s => (s + 1) % 4), 4400)
    return () => { cleanup?.(); clearTimeout(next) }
  }, [step, runStep])

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="absolute -inset-4 rounded-2xl bg-orange-500/5 blur-2xl pointer-events-none" />

      <div className="relative rounded-xl border border-[#1a1f2e] bg-[#0a0d14] overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.07)]">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1f2e] bg-[#06090f]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-3 h-6 rounded-md bg-[#1a1f2e] flex items-center px-3">
            <span className="text-xs text-gray-500 font-mono">app.cartracker.pro/annonces</span>
          </div>
          <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
            <Car className="w-3 h-3 text-white" />
          </div>
        </div>

        <div className="flex h-[340px] overflow-hidden">
          {/* Sidebar */}
          <div className="w-12 shrink-0 bg-[#0a0d14] border-r border-[#1a1f2e] flex flex-col items-center py-3 gap-1.5">
            {['📅','👥','🔍','📋','📊','📈'].map((ic, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${i === 3 ? 'bg-orange-500/20' : ''}`}>
                {ic}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {DEMO_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    i === step
                      ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'bg-[#1a1f2e] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Step content */}
            <div style={{ minHeight: 220 }}>

              {step === 0 && (
                <div className="space-y-2.5">
                  <div className="h-8 rounded-lg bg-[#1a1f2e] flex items-center px-3 border border-orange-500/20">
                    <span className="text-xs text-gray-300 font-mono truncate">
                      {typed}
                      <span className="inline-block w-0.5 h-3 bg-orange-400 ml-px animate-pulse" />
                    </span>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-2 transition-all duration-700"
                    style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(8px)' }}
                  >
                    {[['Marque','BMW'],['Modèle','320d'],['Année','2021'],['KM','45 000 km'],['Carburant','Diesel'],['Prix','16 900 €']].map(([lbl, val]) => (
                      <div key={lbl} className="h-8 rounded-lg bg-[#1a1f2e] flex items-center px-3 gap-2">
                        <span className="text-xs text-gray-500">{lbl}</span>
                        <span className="text-xs text-orange-400 font-medium ml-auto">{val}</span>
                      </div>
                    ))}
                  </div>
                  {revealed && (
                    <div className="h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-2" style={{ opacity: revealed ? 1 : 0.3, transition: 'opacity 0.5s ease' }}>
                  {[
                    { label: "Prix d'achat (DE)", val: '14 500 €', color: 'text-red-400' },
                    { label: 'Transport', val: '650 €', color: 'text-red-400' },
                    { label: 'Immatriculation', val: '300 €', color: 'text-red-400' },
                    { label: 'Réparations', val: '400 €', color: 'text-red-400' },
                    { label: 'Prix de vente client', val: '19 000 €', color: 'text-green-400' },
                    { label: 'Marge nette', val: '3 150 €', color: 'text-orange-400 font-bold' },
                  ].map(({ label, val, color }, i) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between h-8 px-3 rounded-lg ${
                        i === 5 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[#1a1f2e]'
                      }`}
                    >
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className={`text-xs ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Sélection pour Thomas M. — 3 véhicules</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { b: 'BMW', m: '320d', p: '19 000 €' },
                      { b: 'Audi', m: 'A4', p: '21 500 €' },
                      { b: 'VW', m: 'Passat', p: '17 200 €' },
                    ].map(car => (
                      <div key={car.b} className="rounded-lg bg-[#1a1f2e] p-2.5 space-y-1.5">
                        <div className="w-full h-10 rounded bg-[#0a0d14] flex items-center justify-center text-xl">🚗</div>
                        <p className="text-xs font-medium text-gray-300">{car.b} {car.m}</p>
                        <p className="text-xs text-orange-400">{car.p}</p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="h-9 rounded-lg bg-green-900/20 border border-green-700/40 flex items-center px-3 gap-2 transition-all duration-700"
                    style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(6px)' }}
                  >
                    <span className="text-xs text-green-400 font-mono flex-1 truncate">🔗 cartracker.pro/share/xK9pM2...</span>
                    <span className="text-xs text-green-400 bg-green-900/40 px-2 py-0.5 rounded-full shrink-0">Copié !</span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2.5">
                  <div className="flex justify-end">
                    <div className="bg-orange-500/15 border border-orange-500/25 rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[70%]">
                      <p className="text-xs text-orange-200">
                        {typed}
                        <span className="inline-block w-0.5 h-3 bg-orange-400 ml-px animate-pulse" />
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex gap-2.5 transition-all duration-500"
                    style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(8px)' }}
                  >
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm shrink-0 mt-0.5">🤖</div>
                    <div className="bg-[#1a1f2e] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[80%]">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Import depuis la Pologne : comptez <span className="text-orange-400 font-medium">800–1 200 €</span> (transport + homologation + taxes). Je peux vous aider à calculer la marge précise 📊
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#06090f]/90 backdrop-blur-xl border-b border-[#1a1f2e]' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">
            CarTracker <span className="text-orange-400">Pro</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {[['Fonctionnalités','#fonctionnalites'],['Tarifs','#tarifs'],['À propos','#a-propos']].map(([label, href]) => (
            <a key={label} href={href} className="text-sm text-gray-400 hover:text-gray-100 transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/auth/login"
            className="px-4 py-1.5 text-sm text-gray-200 border border-[#2a2f3e] rounded-lg hover:border-gray-500 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-400 transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>

        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(o => !o)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0a0d14] border-b border-[#1a1f2e] px-5 py-4 space-y-3">
          {[['Fonctionnalités','#fonctionnalites'],['Tarifs','#tarifs'],['À propos','#a-propos']].map(([label, href]) => (
            <a key={label} href={href} className="block text-sm text-gray-400 hover:text-white py-1" onClick={() => setMobileOpen(false)}>
              {label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/auth/login" className="block text-center py-2 text-sm border border-[#2a2f3e] rounded-lg text-gray-200">
              Se connecter
            </Link>
            <Link href="/auth/register" className="block text-center py-2 text-sm font-medium bg-orange-500 rounded-lg text-white">
              Essayer gratuitement
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Zap,        color: 'text-yellow-400', bg: 'bg-yellow-900/20', glow: 'group-hover:border-yellow-500/40', title: 'Import Intelligent IA',      desc: 'Copiez une annonce depuis n\'importe quel site européen, notre IA remplit tout en 5 secondes.' },
  { icon: Calculator, color: 'text-green-400',  bg: 'bg-green-900/20',  glow: 'group-hover:border-green-500/40',  title: 'Calcul de marge instantané', desc: 'Prix d\'achat, transport, immat, CT... Votre marge nette calculée à l\'euro près.' },
  { icon: Share2,     color: 'text-blue-400',   bg: 'bg-blue-900/20',   glow: 'group-hover:border-blue-500/40',   title: 'Partage client premium',     desc: 'Envoyez une sélection personnalisée par lien. Votre client voit les voitures, pas la source.' },
  { icon: Globe,      color: 'text-purple-400', bg: 'bg-purple-900/20', glow: 'group-hover:border-purple-500/40', title: '16 pays européens',           desc: 'Allemagne, Belgique, Pologne, Espagne... Toute l\'Europe dans un seul outil.' },
  { icon: Bot,        color: 'text-orange-400', bg: 'bg-orange-900/20', glow: 'group-hover:border-orange-500/40', title: 'Gamos, votre assistant IA',   desc: 'Conseils d\'import, aide à la rédaction, guide de l\'outil. Disponible 24h/24.' },
  { icon: BarChart3,  color: 'text-teal-400',   bg: 'bg-teal-900/20',   glow: 'group-hover:border-teal-500/40',   title: 'Statistiques Finance',       desc: 'Suivez vos ventes, marges et performances mois après mois comme un vrai business.' },
]

const COMPARE = [
  { feature: 'Import IA depuis sites européens',       us: true,      them: false },
  { feature: 'Partage client sans révéler la source',  us: true,      them: false },
  { feature: 'Assistant IA intégré',                   us: true,      them: false },
  { feature: '16 pays européens',                      us: true,      them: false },
  { feature: 'Calcul de marge complet',                us: true,      them: 'Partiel' },
  { feature: 'Prix accessible',                        us: 'Dès 0€',  them: '50–200€/mois' },
]

const PLANS = [
  {
    name: 'Starter', price: '0€',  period: '/mois', popular: false,
    features: ['10 annonces max', '5 clients max', 'Import IA', 'Fonctionnalités de base'],
    cta: 'Commencer gratuitement', href: '/auth/register',
  },
  {
    name: 'Pro', price: '49€', period: '/mois', popular: true,
    features: ['Annonces illimitées', 'Clients illimités', 'Partage client par lien', 'Gamos assistant IA', 'Stats Finance', 'Export CSV'],
    cta: 'Essayer 14 jours gratuits', href: '/auth/register',
  },
  {
    name: 'Agence', price: '99€', period: '/mois', popular: false,
    features: ['Tout le Plan Pro', '3 utilisateurs', 'Support prioritaire', 'Rapport mensuel auto'],
    cta: 'Nous contacter', href: '/auth/register',
  },
]

const TESTIMONIALS = [
  { text: 'Avant CarTracker, je perdais 3h par semaine à chercher sur les sites allemands. Maintenant j\'importe une annonce en 10 secondes.', author: 'Thomas D.', role: 'Mandataire automobile, Lyon', stars: 5 },
  { text: 'Le partage client par lien a changé ma relation avec mes clients. Ils reçoivent une vraie sélection pro sans voir d\'où je source.', author: 'Marie L.', role: 'Courtière auto, Paris', stars: 5 },
  { text: 'Gamos m\'a aidé à calculer les frais d\'import polonais que je ne maîtrisais pas. L\'outil apprend avec moi.', author: 'Karim B.', role: 'Négociant VO, Marseille', stars: 5 },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06090f] text-white antialiased overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-5 flex flex-col items-center text-center overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />
        {/* Radial glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/6 rounded-full blur-[120px] pointer-events-none" />

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-sm text-orange-300 mb-8">
          <span>✨</span>
          L&apos;outil n°1 des mandataires auto en Europe
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* H1 */}
        <h1 className="relative max-w-4xl text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
          Trouvez, suivez et vendez
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">
            les meilleures voitures
          </span>
          <br />
          d&apos;Europe.
        </h1>

        <p className="relative max-w-2xl text-lg md:text-xl text-gray-400 leading-relaxed mb-10">
          CarTracker Pro centralise vos recherches d&apos;annonces européennes, calcule vos marges en temps réel et impressionne vos clients avec des sélections personnalisées.
        </p>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 mb-10">
          <Link
            href="/auth/register"
            className="group flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-400 transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:shadow-[0_0_50px_rgba(249,115,22,0.4)]"
          >
            Démarrer gratuitement
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-2 px-7 py-3.5 text-base font-medium text-gray-200 border border-[#2a2f3e] rounded-xl hover:border-gray-500 hover:text-white transition-all hover:scale-[1.02]"
          >
            Voir la démo ↓
          </a>
        </div>

        {/* Social proof */}
        <div className="relative flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="flex -space-x-1.5">
              {['T','M','K','A','L'].map(l => (
                <span key={l} className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500/40 to-orange-700/40 border-2 border-[#06090f] flex items-center justify-center text-[10px] font-bold text-orange-300">
                  {l}
                </span>
              ))}
            </span>
            <span className="text-gray-400 font-medium">500+ pros actifs</span>
          </span>
          <span className="text-gray-700">•</span>
          <span>16 pays couverts</span>
          <span className="text-gray-700">•</span>
          <span>0€ pour commencer</span>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin,{' '}
              <span className="text-orange-400">au même endroit</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Regardez comment CarTracker Pro transforme votre quotidien
            </p>
          </FadeUp>
          <FadeUp delay={100}>
            <DemoMockup />
          </FadeUp>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" className="py-20 px-5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Tout ce qu&apos;il vous faut pour{' '}
              <span className="text-orange-400">dominer le marché</span>
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 70}>
                <div className={`group h-full p-6 rounded-xl border border-[#1a1f2e] bg-[#0a0d14] hover:bg-[#0d1117] transition-all duration-300 ${f.glow} cursor-default`}>
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pourquoi les pros choisissent{' '}
              <span className="text-orange-400">CarTracker Pro</span>
            </h2>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
              <div className="grid grid-cols-3 bg-[#0a0d14] border-b border-[#1a1f2e]">
                <div className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fonctionnalité</div>
                <div className="px-5 py-3 text-xs font-medium text-orange-400 uppercase tracking-wider text-center">CarTracker Pro</div>
                <div className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Concurrents</div>
              </div>
              {COMPARE.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 border-b border-[#1a1f2e] last:border-0 ${i % 2 === 0 ? 'bg-[#06090f]' : 'bg-[#0a0d14]/50'}`}>
                  <div className="px-5 py-3.5 text-sm text-gray-300">{row.feature}</div>
                  <div className="px-5 py-3.5 flex items-center justify-center">
                    {row.us === true
                      ? <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-900/40"><Check className="w-3.5 h-3.5 text-green-400" /></span>
                      : <span className="text-sm font-medium text-orange-400">{row.us}</span>
                    }
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-center">
                    {row.them === false
                      ? <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-900/30"><X className="w-3.5 h-3.5 text-red-400" /></span>
                      : <span className="text-sm text-gray-400">{row.them}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" className="py-20 px-5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple, transparent, sans surprise</h2>
            <p className="text-gray-400">Commencez gratuitement, évoluez quand vous êtes prêt.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.name} delay={i * 90}>
                <div className={`relative h-full flex flex-col p-6 rounded-xl border transition-all ${
                  plan.popular
                    ? 'border-orange-500/50 bg-orange-500/5 shadow-[0_0_50px_rgba(249,115,22,0.08)]'
                    : 'border-[#1a1f2e] bg-[#0a0d14]'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-bold text-white bg-orange-500 rounded-full">
                        Le plus populaire
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-100 mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold ${plan.popular ? 'text-orange-400' : 'text-gray-100'}`}>{plan.price}</span>
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`block text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] ${
                      plan.popular
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                        : 'border border-[#2a2f3e] text-gray-200 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-5 border-y border-[#1a1f2e]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { target: 500, suffix: '+', label: 'Pros actifs' },
              { target: 16,  suffix: '',  label: 'Pays couverts' },
              { target: 12000, suffix: '+', label: 'Annonces importées' },
              { target: 98, suffix: '%', label: 'Satisfaction client' },
            ].map(stat => (
              <FadeUp key={stat.label}>
                <div className="text-4xl md:text-5xl font-extrabold text-orange-400 mb-1.5">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ce que disent les pros</h2>
            <p className="text-gray-400">Ils ont transformé leur activité avec CarTracker Pro</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.author} delay={i * 90}>
                <div className="h-full p-6 rounded-xl border border-[#1a1f2e] bg-[#0a0d14] flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-orange-400 fill-orange-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-gray-100 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ── */}
      <section className="py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/6 via-transparent to-orange-600/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-orange-500/7 rounded-full blur-[120px] pointer-events-none" />
        <FadeUp className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Prêt à transformer{' '}
            <span className="text-orange-400">votre activité&nbsp;?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Rejoignez les pros qui font confiance à CarTracker Pro.
            Démarrez gratuitement, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-400 transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(249,115,22,0.3)]"
            >
              Créer mon compte
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-8 py-3.5 text-base font-medium text-gray-200 border border-[#2a2f3e] rounded-xl hover:border-gray-500 hover:text-white transition-all hover:scale-[1.02]"
            >
              Se connecter
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer id="a-propos" className="border-t border-[#1a1f2e] py-14 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">CarTracker <span className="text-orange-400">Pro</span></span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                L&apos;outil des mandataires auto modernes.<br />Simple, puissant, européen.
              </p>
            </div>
            <div className="flex flex-wrap gap-10">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Produit</p>
                <div className="space-y-2.5">
                  {['Fonctionnalités', 'Tarifs', 'Démo'].map(l => (
                    <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-200 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Légal</p>
                <div className="space-y-2.5">
                  {['Contact', 'Mentions légales', 'CGU'].map(l => (
                    <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-200 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Compte</p>
                <div className="space-y-2.5">
                  <Link href="/auth/login" className="block text-sm text-gray-500 hover:text-gray-200 transition-colors">Se connecter</Link>
                  <Link href="/auth/register" className="block text-sm text-orange-400 hover:text-orange-300 transition-colors">Créer un compte</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-[#1a1f2e]">
            <p className="text-xs text-gray-600">© 2026 CarTracker Pro — Tous droits réservés</p>
            <p className="text-xs text-gray-600">Fait avec ❤️ pour les pros de l&apos;auto</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
