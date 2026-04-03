'use client'
import { useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PhotosViewerProps {
  photos: string[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

export function PhotosViewer({ photos, index, onIndexChange, onClose }: PhotosViewerProps) {
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => {
    onIndexChange(index > 0 ? index - 1 : photos.length - 1)
  }, [index, photos.length, onIndexChange])

  const next = useCallback(() => {
    onIndexChange(index < photos.length - 1 ? index + 1 : 0)
  }, [index, photos.length, onIndexChange])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchStartX.current = null
  }

  if (!photos.length) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Fermer */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Compteur */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-white text-sm bg-black/60 px-3 py-1 rounded-full select-none">
        {index + 1} / {photos.length}
      </div>

      {/* Flèche gauche */}
      {photos.length > 1 && (
        <button
          className="absolute left-3 sm:left-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
          onClick={e => { e.stopPropagation(); prev() }}
          aria-label="Photo précédente"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Photo centrale */}
      <div
        className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[index]}
          src={photos[index]}
          alt={`Photo ${index + 1} sur ${photos.length}`}
          className="max-w-[90vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Flèche droite */}
      {photos.length > 1 && (
        <button
          className="absolute right-3 sm:right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
          onClick={e => { e.stopPropagation(); next() }}
          aria-label="Photo suivante"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
