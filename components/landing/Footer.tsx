'use client'
import Link from 'next/link'
import { Car } from 'lucide-react'

function scrollTo(id: string) {
  if (typeof document !== 'undefined') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
}

const LEGAL_LINKS = [
  { label: 'Contact', href: '/contact' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGU', href: '/cgu' },
  { label: 'Politique de confidentialité', href: '/confidentialite' },
]

export function Footer() {
  return (
    <footer className="bg-[#06090f] border-t border-[#1a1f2e] px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">CarTracker<span className="text-orange-400">Pro</span></span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">L'outil des mandataires auto modernes</p>
          </div>
          {/* Produit */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Produit</p>
            {[['Fonctionnalités','#fonctionnalites'],['Extension Chrome','#extension'],['Tarifs','#tarifs'],['Blog','/blog']].map(([l,h]) => (
              h.startsWith('#') ? (
                <button key={l} onClick={() => scrollTo(h.slice(1))}
                  className="block text-sm text-gray-500 hover:text-gray-300 transition-colors text-left">{l}</button>
              ) : (
                <Link key={l} href={h} className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">{l}</Link>
              )
            ))}
          </div>
          {/* Légal */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Légal</p>
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">{label}</Link>
            ))}
          </div>
          {/* Compte */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Compte</p>
            <Link href="/auth/login" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Se connecter</Link>
            <Link href="/auth/register" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Créer un compte</Link>
          </div>
        </div>
        <div className="border-t border-[#1a1f2e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© 2026 CarTracker Pro — Tous droits réservés</span>
          <span>Fait avec ❤️ pour les pros de l'auto</span>
        </div>
      </div>
    </footer>
  )
}
