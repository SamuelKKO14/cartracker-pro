'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Calculator, Share2, BarChart3 } from 'lucide-react'

const tabs = [
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    title: 'Gestion clients centralisée',
    description: 'Créez un dossier par client avec budget, critères et timeline complète de vos échanges.',
    mockup: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">JD</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Jean Dupont</p>
            <p className="text-xs text-gray-400">Budget : 15-25k€ · SUV diesel</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Actif</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">ML</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Marie Leroy</p>
            <p className="text-xs text-gray-400">Budget : 30-45k€ · Berline</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Négo</span>
        </div>
      </div>
    )
  },
  {
    id: 'search',
    label: 'Recherche',
    icon: Search,
    title: 'Recherche multi-pays IA',
    description: "Importez depuis 16 pays européens. L'IA analyse, score et calcule la marge nette.",
    mockup: (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">BMW X3 xDrive20d</p>
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">87/100</span>
          </div>
          <p className="text-xs text-gray-400">2021 · 65k km · DE · 22 900€</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Audi Q5 2.0 TDI</p>
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">72/100</span>
          </div>
          <p className="text-xs text-gray-400">2021 · 65k km · BE · 24 500€</p>
        </div>
      </div>
    )
  },
  {
    id: 'margin',
    label: 'Marge',
    icon: Calculator,
    title: 'Calculateur de marge',
    description: 'Transport, CT, immatriculation, remise en état. Tout est compté pour la vraie marge nette.',
    mockup: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-300"><span>Prix d&apos;achat</span><span className="text-white font-mono">22 900€</span></div>
        <div className="flex justify-between text-gray-300"><span>Transport DE→FR</span><span className="text-white font-mono">650€</span></div>
        <div className="flex justify-between text-gray-300"><span>CT + Immat</span><span className="text-white font-mono">350€</span></div>
        <div className="flex justify-between text-gray-300"><span>Remise en état</span><span className="text-white font-mono">800€</span></div>
        <div className="h-px bg-white/10 my-2" />
        <div className="flex justify-between text-gray-300"><span>Prix de revente</span><span className="text-white font-mono">28 000€</span></div>
        <div className="flex justify-between font-bold pt-2"><span className="text-green-400">Marge nette</span><span className="text-green-400 font-mono">+3 300€</span></div>
      </div>
    )
  },
  {
    id: 'share',
    label: 'Partage',
    icon: Share2,
    title: 'Partage client WhatsApp',
    description: 'Envoyez votre sélection en 1 clic. 4 formats au choix : groupé, détaillé, tableau, résumé.',
    mockup: (
      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
        <p className="text-gray-300 mb-2">Bonjour Jean,</p>
        <p className="text-gray-300 mb-2">Voici ma sélection :</p>
        <p className="text-white">• BMW X3 — 22 900€ — DE</p>
        <p className="text-white">• Audi Q5 — 24 500€ — BE</p>
        <p className="text-gray-300 mt-2">Dites-moi lequel vous intéresse !</p>
      </div>
    )
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: BarChart3,
    title: 'Stats & Finance',
    description: 'CA, marges, objectifs mensuels. Pilotez votre activité comme un vrai business.',
    mockup: (
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-400">CA du mois</p>
          <p className="text-xl font-bold text-white">42 580€</p>
          <p className="text-xs text-green-400">+18% vs avril</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-400">Marge moyenne</p>
          <p className="text-xl font-bold text-white">2 840€</p>
          <p className="text-xs text-green-400">+12% vs avril</p>
        </div>
        <div className="col-span-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-gray-400">Objectif mensuel</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500" /></div>
            <span className="text-sm font-bold text-orange-400">76%</span>
          </div>
        </div>
      </div>
    )
  }
]

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
          <div className="p-6 md:p-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tabs[active].id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {tabs[active].title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {tabs[active].description}
                  </p>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/[0.05] p-5">
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
