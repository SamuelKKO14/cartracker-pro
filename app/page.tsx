'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { CarHeroScene } from '@/components/3d/CarHeroScene'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Car, X, ArrowRight, ChevronDown,
  Check, Star, Globe, Zap, Calculator, Share2, Bot, BarChart3,
  Puzzle, CheckCircle, Sparkles, Users, Euro, FileText,
  TrendingUp, Newspaper, ClipboardList, Search, Minus, Plus,
  MessageSquare, Clock, Lightbulb, Target, User, Rocket,
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

// Aceternity
import { GridBackground } from '@/components/ui/aceternity/GridBackground'
import { Meteors } from '@/components/ui/aceternity/Meteors'
import { BackgroundBeams } from '@/components/ui/aceternity/BackgroundBeams'
import { TextGenerateEffect } from '@/components/ui/aceternity/TextGenerateEffect'
import { CardSpotlight } from '@/components/ui/aceternity/CardSpotlight'
import { BentoGrid, BentoCard } from '@/components/ui/aceternity/BentoGrid'
import { Card3D } from '@/components/ui/aceternity/Card3D'

// Magic UI
import { NumberTicker } from '@/components/ui/magicui/NumberTicker'
import { ShimmerButton } from '@/components/ui/magicui/ShimmerButton'
import { BorderBeam } from '@/components/ui/magicui/BorderBeam'
import { Marquee } from '@/components/ui/magicui/Marquee'
import { AnimatedGradientText } from '@/components/ui/magicui/AnimatedGradientText'
import { OrbitingCircles } from '@/components/ui/magicui/OrbitingCircles'


// ── Shared animation config ──────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Sparkles, label: 'Import Intelligent IA', desc: "Copiez-collez le texte d'une annonce, l'IA extrait tout en 5 secondes.", color: 'from-yellow-500/20 to-yellow-500/5', iconColor: 'text-yellow-400', span: 'md:col-span-2', comingSoon: false },
  { icon: Calculator, label: 'Calcul de marge', desc: "Prix d'achat + transport + remise en état = marge nette en temps réel.", color: 'from-green-500/20 to-green-500/5', iconColor: 'text-green-400', span: '', comingSoon: false },
  { icon: Globe, label: '16 pays européens', desc: "Allemagne, Belgique, Pologne, Espagne, Italie… Toute l'Europe couverte.", color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', span: '', comingSoon: false },
  { icon: Bot, label: 'Gamos IA', desc: "Assistant IA personnel. Conseils d'import, frais par pays, aide 24h/24.", color: 'from-orange-500/20 to-orange-500/5', iconColor: 'text-orange-400', span: '', comingSoon: false },
  { icon: BarChart3, label: 'Suivi Finance', desc: "CA, marges, objectifs mensuels. Pilotez votre activité comme un business.", color: 'from-teal-500/20 to-teal-500/5', iconColor: 'text-teal-400', span: '', comingSoon: false },
  { icon: ClipboardList, label: 'Checklist pré-achat', desc: "12 points de vérification avant chaque achat. CT, carnet, HistoVec, sinistres…", color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', span: 'md:col-span-2', comingSoon: false },
  { icon: Puzzle, label: 'Extension Chrome', desc: "Import direct depuis AutoScout24, La Centrale, LeBonCoin, mobile.de.", color: 'from-cyan-500/20 to-cyan-500/5', iconColor: 'text-cyan-400', span: '', comingSoon: true },
  { icon: Share2, label: 'Partage client', desc: "Lien sécurisé pour partager votre sélection sans révéler vos sources.", color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', span: '', comingSoon: true },
  { icon: Newspaper, label: 'Blog intégré', desc: "Articles SEO pour attirer des clients. Génération assistée par IA.", color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-400', span: '', comingSoon: true },
]

const STEPS = [
  { num: '01', icon: Search, title: 'Trouvez', desc: "Naviguez sur les sites européens ou utilisez l'import IA pour ajouter des annonces." },
  { num: '02', icon: ClipboardList, title: 'Organisez', desc: "Associez les annonces à vos clients, remplissez la checklist pré-achat." },
  { num: '03', icon: Calculator, title: 'Analysez', desc: "Calculez la marge nette en temps réel. Transport, remise en état, CT, tout est compté." },
  { num: '04', icon: Euro, title: 'Vendez', desc: "Marquez comme revendu. Le CA et la marge se calculent automatiquement." },
]

const SITES = [
  { name: 'AutoScout24', short: 'AS24' },
  { name: 'La Centrale', short: 'LC' },
  { name: 'LeBonCoin', short: 'LBC' },
  { name: 'mobile.de', short: 'mob' },
  { name: 'Le Parking', short: 'LP' },
]

const COMPARE_ROWS = [
  { feature: "Import IA depuis sites européens", ctp: true, a: false, b: false, c: false },
  { feature: "Extension Chrome d'import", ctp: 'bientôt', a: false, b: false, c: false },
  { feature: "Partage client sans source", ctp: 'bientôt', a: false, b: "Partiel", c: false },
  { feature: "Assistant IA intégré", ctp: true, a: false, b: false, c: false },
  { feature: "16 pays européens", ctp: true, a: "France seule", b: "4 pays", c: "France seule" },
  { feature: "Calcul de marge complet", ctp: true, a: "Partiel", b: true, c: "Partiel" },
  { feature: "Blog intégré", ctp: 'bientôt', a: false, b: false, c: false },
  { feature: "Prix", ctp: "Dès 0€", a: "50-150€/m.", b: "80-200€/m.", c: "60-120€/m." },
]

const FAQS = [
  {
    q: "Qu'est-ce que CarTracker Pro exactement ?",
    a: "CarTracker Pro est un SaaS conçu pour les professionnels de l'achat-revente automobile (mandataires, courtiers, garages). Il centralise la recherche d'annonces dans 16 pays européens, organise vos clients et vos suivis, calcule automatiquement vos marges nettes et vous aide à boucler vos ventes plus vite."
  },
  {
    q: "À qui s'adresse CarTracker Pro ?",
    a: "Aux mandataires auto, courtiers, garages indépendants et toute personne qui fait de l'achat-revente automobile à titre professionnel. Que vous gériez 5 clients ou 50, l'outil s'adapte."
  },
  {
    q: "Combien ça coûte ?",
    a: "Le plan Starter est gratuit (10 annonces, 5 clients, sans CB). Démarrage à 15€/mois, Pro à 39€/mois, Agence à 79€/mois. Les plans payants offrent 14 jours d'essai gratuit, annulable à tout moment."
  },
  {
    q: "Comment fonctionne l'import IA ?",
    a: "Copiez le texte d'une annonce depuis n'importe quel site, collez-le dans CarTracker Pro, et l'IA extrait tout en 5 secondes : marque, modèle, année, km, prix, carburant, boîte, pays."
  },
  {
    q: "L'extension Chrome est-elle disponible ?",
    a: "Pas encore. L'extension est en développement. Elle permettra d'importer une annonce en un clic. En attendant, l'import IA fonctionne déjà et extrait toutes les infos en secondes."
  },
  {
    q: "Et le partage client par lien ?",
    a: "En cours de développement. L'idée : envoyer un lien qui affiche votre sélection (sans révéler vos sources), avec un bouton 'intéressé' pour une réponse directe. En attendant, export CSV disponible."
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Données hébergées sur Supabase (infra européenne) avec chiffrement. Chaque utilisateur n'accède qu'à ses données. Paiements via Stripe. Aucune CB stockée chez nous."
  },
  {
    q: "Comment annuler mon abonnement ?",
    a: "Depuis Paramètres → Facturation. Annulation immédiate, accès maintenu jusqu'à la fin de la période payée. Aucun engagement, aucun frais caché."
  },
  {
    q: "Y a-t-il un support ?",
    a: "Oui. contact@cartrackerpro.fr — réponse sous 24h en semaine. Pro : support prioritaire. Agence : support prioritaire sous 4h."
  },
  {
    q: "Quels pays européens sont couverts ?",
    a: "Démarrage couvre 4 pays. Pro et Agence couvrent 16 pays : France, Allemagne, Belgique, Espagne, Italie, Pays-Bas, Portugal, Pologne, Roumanie, Autriche, Suisse, Suède, Norvège, Lituanie, et plus."
  },
]

const TESTIMONIALS = [
  { name: 'Le constat', text: "Les pros de l'auto perdent un temps fou. Ils jonglent entre 6 sites, perdent des voitures dans WhatsApp, calculent leurs marges sur papier.", icon: Search, color: 'text-blue-400' },
  { name: 'La conviction', text: "Le temps perdu sur la recherche, c'est du temps en moins pour la vente — là où les pros font leur marge.", icon: Lightbulb, color: 'text-yellow-400' },
  { name: 'La solution', text: "Un outil qui centralise tout : recherche multi-pays, association par client, calcul de marge, checklist pré-achat.", icon: Target, color: 'text-green-400' },
  { name: 'Le fondateur', text: "Construit en solo par Samuel, entrepreneur passionné d'auto qui combine rigueur technique et besoins terrain.", icon: User, color: 'text-orange-400' },
]

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  async function handlePlanCheckout(priceId: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else window.location.href = '/auth/register'
  }

  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — GridBackground + Meteors + TextGenerate + 3D Car
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <GridBackground className="absolute inset-0 z-0" />
        <Meteors count={12} className="z-[1]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        >
          {/* Left — Copy */}
          <div className="space-y-6 relative z-10 bg-[#06090f]/80 backdrop-blur-sm rounded-3xl p-6 -m-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-sm"
            >
              <BorderBeam size={100} duration={4} />
              <Car className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">L'outil des pros de l'auto</span>
            </motion.div>

            <TextGenerateEffect
              words="Trouvez les bonnes affaires auto 2x plus vite"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-lg text-gray-400 max-w-lg"
            >
              <AnimatedGradientText className="text-lg font-medium">
                Centralisez, analysez, vendez mieux.
              </AnimatedGradientText>
              {' '}L'outil que les mandataires utilisent pour structurer leur activité.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/auth/register">
                <ShimmerButton className="px-8 py-4 text-base">
                  Essai gratuit <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              </Link>
              <button
                onClick={() => scrollTo('fonctionnalites')}
                className="px-6 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                Voir les fonctionnalités
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex items-center gap-6 pt-2 text-sm text-gray-500"
            >
              <span>Disponible dans <span className="text-orange-400 font-semibold">16 pays</span></span>
              <span className="w-px h-4 bg-gray-700" />
              <span>Plans dès <span className="text-orange-400 font-semibold">0€</span></span>
              <span className="w-px h-4 bg-gray-700" />
              <span>Essai <span className="text-orange-400 font-semibold">14j gratuit</span></span>
            </motion.div>
          </div>

          {/* Right — 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[400px] lg:h-[500px]"
          >
            {!isMobile ? (
              <CarHeroScene className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[60px]" />
                  <Car className="relative w-24 h-24 text-orange-400" />
                </div>
              </div>
            )}

            {/* Floating glass cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-8 right-4 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl text-xs"
            >
              <span className="text-gray-500">Marge nette</span>
              <p className="text-green-400 font-bold text-sm">+2 450€</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-16 left-4 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl text-xs"
            >
              <span className="text-gray-500">Score</span>
              <p className="text-orange-400 font-bold text-sm">87/100</p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. KPIs — NumberTicker
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 16, suffix: '', label: 'Pays européens couverts' },
            { value: 5, suffix: 's', label: "Secondes pour importer" },
            { value: 3, suffix: '', label: 'Plans tarifaires' },
            { value: 14, suffix: 'j', label: "D'essai gratuit" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              custom={i * 0.1}
              className="text-center space-y-1"
            >
              <p className="text-4xl md:text-5xl font-extrabold text-orange-400">
                <NumberTicker value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. COMMENT ÇA MARCHE — Card3D steps
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#080b10]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              Comment ça marche
            </h2>
            <p className="text-gray-400">4 étapes pour structurer votre activité</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
              >
                <Card3D className="p-6 h-full" intensity={8}>
                  <div className="space-y-4">
                    <span className="text-xs font-mono text-orange-400/60">{step.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FEATURES — BentoGrid + CardSpotlight
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              Tout ce dont un pro a besoin
            </h2>
            <p className="text-gray-400">6 fonctionnalités actives + 3 en cours de développement</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.06}
                className={feat.span}
              >
                <CardSpotlight className="h-full relative">
                  {feat.comingSoon && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" /> Bientôt
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-3`}>
                    <feat.icon className={`w-5 h-5 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{feat.label}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. ÉCOSYSTÈME — OrbitingCircles
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#080b10]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              On scanne tous les sites pour vous
            </h2>
            <p className="text-gray-400">Importez depuis n'importe quel site européen d'annonces auto</p>
          </motion.div>

          <div className="relative h-[400px] flex items-center justify-center">
            {/* Center — Logo */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)]">
              <Car className="w-8 h-8 text-white" />
            </div>

            {/* Orbiting sites */}
            {SITES.map((site, i) => (
              <OrbitingCircles
                key={site.name}
                radius={140 + (i % 2) * 40}
                duration={25 + i * 3}
                delay={i * (25 / SITES.length)}
                reverse={i % 2 === 1}
              >
                <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-[#0d1117] flex items-center justify-center text-xs font-bold text-gray-300 shadow-lg">
                  {site.short}
                </div>
              </OrbitingCircles>
            ))}

            {/* Glow ring */}
            <div className="absolute inset-0 m-auto w-[300px] h-[300px] rounded-full border border-orange-500/10" />
            <div className="absolute inset-0 m-auto w-[380px] h-[380px] rounded-full border border-white/[0.04]" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. TABLEAU COMPARATIF
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              CarTracker Pro vs les autres
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium">Fonctionnalité</th>
                    <th className="px-4 py-4 text-orange-400 font-semibold">CarTracker Pro</th>
                    <th className="px-4 py-4 text-gray-500 font-medium">Outil A</th>
                    <th className="px-4 py-4 text-gray-500 font-medium">Outil B</th>
                    <th className="px-4 py-4 text-gray-500 font-medium">Outil C</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, ri) => (
                    <tr key={ri} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-gray-300">{row.feature}</td>
                      {[row.ctp, row.a, row.b, row.c].map((v, ci) => (
                        <td key={ci} className="px-4 py-3.5 text-center">
                          {v === true ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                           : v === false ? <X className="w-4 h-4 text-red-500/40 mx-auto" />
                           : v === 'bientôt' ? <span className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-green-400" /><span className="text-[10px] text-gray-500 italic">(bientôt)</span></span>
                           : <span className={`text-xs ${ci === 0 ? 'text-orange-400 font-semibold' : 'text-gray-600'}`}>{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. TARIFS — GlassCards + BorderBeam on Pro
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="tarifs" className="py-24 px-4 bg-[#080b10]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              Simple, transparent, sans surprise
            </h2>
            <p className="text-gray-400">Commencez gratuitement, évoluez quand vous êtes prêt.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Démarrage */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col h-full">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Démarrage</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-100"><NumberTicker value={15} prefix="" suffix="€" /></span>
                    <span className="text-gray-500 text-sm mb-1">/mois</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pour démarrer son activité</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['15 clients max','30 annonces max','Import IA (10/mois)','4 pays UE','Score bonne affaire','Essai 14 jours gratuit'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-3.5 h-3.5 text-gray-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handlePlanCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_DEMARRAGE!)} className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-300 hover:border-white/[0.15] hover:text-white transition-all">
                  Essayer 14 jours gratuits
                </button>
              </div>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.08}>
              <div className="relative rounded-2xl border border-orange-500/40 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col h-full shadow-[0_0_60px_rgba(249,115,22,0.12)]">
                <BorderBeam duration={5} size={250} />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-[11px] font-bold text-white whitespace-nowrap">
                  Le plus populaire
                </div>
                <div className="mb-5">
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">Pro</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-100"><NumberTicker value={39} prefix="" suffix="€" /></span>
                    <span className="text-gray-500 text-sm mb-1">/mois</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pour les pros actifs</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['250 clients','500 annonces','IA illimitée','14 pays UE','Kanban + Tags','Stats & Finance avancées','Export CSV','Essai 14 jours gratuit'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <ShimmerButton onClick={() => handlePlanCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)} className="w-full py-3">
                  Essayer 14 jours gratuits
                </ShimmerButton>
              </div>
            </motion.div>

            {/* Agence */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.16}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col h-full">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Agence</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-100"><NumberTicker value={79} prefix="" suffix="€" /></span>
                    <span className="text-gray-500 text-sm mb-1">/mois</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pour les équipes</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['Tout du plan Pro','Clients illimités','3 utilisateurs','Support prioritaire 4h','Essai 14 jours gratuit'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-3.5 h-3.5 text-gray-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handlePlanCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCE!)} className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-300 hover:border-white/[0.15] hover:text-white transition-all">
                  Essayer 14 jours gratuits
                </button>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Pas encore prêt ?{' '}
            <Link href="/auth/register" className="text-orange-400 hover:underline">
              Commencez gratuitement
            </Link>{' '}
            avec le plan Starter (10 annonces, 5 clients, sans CB).
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. POURQUOI — Marquee de cards
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-3">
              Pourquoi on a créé CarTracker Pro
            </h2>
            <p className="text-gray-400">L'histoire derrière l'outil</p>
          </motion.div>

          <Marquee speed={50} pauseOnHover>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex-shrink-0 w-[340px] rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 mx-2 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center ${t.color}`}>
                    <t.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-semibold text-white">{t.name}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. FAQ — Glassmorphism accordion
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 px-4 bg-[#080b10]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100">Questions fréquentes</h2>
          </motion.div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.04}
              >
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(prev => prev === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <span className="text-sm font-medium text-gray-200">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/[0.06] pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          10. CTA FINAL — BackgroundBeams + TextGenerate + ShimmerButton
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 relative overflow-hidden">
        <BackgroundBeams />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-orange-500/[0.06] blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <TextGenerateEffect
              words="Prêt à transformer votre activité ?"
              className="text-4xl md:text-5xl font-extrabold text-gray-100 leading-tight"
            />
          </motion.div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="text-lg text-gray-400"
          >
            Démarrez gratuitement, sans carte bancaire.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/auth/register">
              <ShimmerButton className="px-8 py-4 text-base">
                Créer mon compte <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-semibold text-base hover:bg-white/[0.06] transition-all flex items-center justify-center"
            >
              Se connecter
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
