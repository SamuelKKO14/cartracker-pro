'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsProps {
  onNewListing?: () => void
}

export function KeyboardShortcuts({ onNewListing }: KeyboardShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore si on est dans un input/textarea
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (target.contentEditable === 'true') return

      switch (e.key) {
        case '1': router.push('/dashboard'); break
        case '2': router.push('/clients'); break
        case '3': router.push('/recherche'); break
        case '4': router.push('/annonces'); break
        case '5': router.push('/stats'); break
        case 'n':
        case 'N':
          if (onNewListing) onNewListing()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, onNewListing])

  return null
}
