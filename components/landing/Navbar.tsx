'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { LogoFull } from '@/components/ui/logo'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#06090f]/90 backdrop-blur-lg border-b border-[#1a1f2e]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <LogoFull className="h-8" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {[['Fonctionnalités','#fonctionnalites'],['Extension Chrome','#extension'],['Tarifs','#tarifs'],['Blog','/blog']].map(([l,h]) => (
              <button
                key={l}
                onClick={() => h.startsWith('#') ? scrollTo(h.slice(1)) : (window.location.href = h)}
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                {l}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login" className="px-4 py-2 rounded-lg border border-[#2a2f3e] text-sm text-gray-300 hover:text-white hover:border-[#3a3f4e] transition-colors">Se connecter</Link>
            <Link href="/auth/register" className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-sm text-white font-medium transition-all hover:scale-[1.02] shadow-[0_0_14px_rgba(249,115,22,0.3)]">Essayer gratuitement</Link>
          </div>

          <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-[#0a0d14] border-l border-[#1a1f2e] flex flex-col p-6 gap-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {[['Fonctionnalités','#fonctionnalites'],['Extension Chrome','#extension'],['Tarifs','#tarifs'],['Blog','/blog']].map(([l,h]) => (
              <button key={l} onClick={() => { setMobileOpen(false); setTimeout(() => h.startsWith('#') ? scrollTo(h.slice(1)) : (window.location.href = h), 100) }}
                className="text-left text-gray-300 hover:text-white py-2 border-b border-[#1a1f2e] transition-colors text-sm">{l}</button>
            ))}
            <div className="flex flex-col gap-2 mt-4">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-2.5 rounded-lg border border-[#2a2f3e] text-sm text-gray-300">Se connecter</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-2.5 rounded-lg bg-orange-500 text-sm text-white font-medium">Essayer gratuitement</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
