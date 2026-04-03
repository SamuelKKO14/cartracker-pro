'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Trash2, Loader2 } from 'lucide-react'

export interface ViewerPhoto {
  id: string
  url: string
}

interface PhotosViewerProps {
  photos: ViewerPhoto[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
  onDelete?: (photo: ViewerPhoto) => Promise<void>
}

export function PhotosViewer({ photos, index, onIndexChange, onClose, onDelete }: PhotosViewerProps) {
  const touchStartX = useRef<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const prev = useCallback(() => {
    setConfirmDelete(false)
    onIndexChange(index > 0 ? index - 1 : photos.length - 1)
  }, [index, photos.length, onIndexChange])

  const next = useCallback(() => {
    setConfirmDelete(false)
    onIndexChange(index < photos.length - 1 ? index + 1 : 0)
  }, [index, photos.length, onIndexChange])

  // Réinitialiser la confirmation quand on change de photo
  useEffect(() => { setConfirmDelete(false) }, [index])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmDelete) {
        if (e.key === 'Escape') setConfirmDelete(false)
        return
      }
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next, onClose, confirmDelete])

  async function handleConfirmDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(photos[index])
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40 && !confirmDelete) dx < 0 ? next() : prev()
    touchStartX.current = null
  }

  if (!photos.length) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
      onClick={() => confirmDelete ? setConfirmDelete(false) : onClose()}
    >
      {/* Fermer */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Supprimer (haut gauche) */}
      {onDelete && (
        <button
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
          onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
          aria-label="Supprimer cette photo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Flèche gauche */}
      {photos.length > 1 && (
        <button
          className="absolute left-3 sm:left-5 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          onClick={e => { e.stopPropagation(); prev() }}
          aria-label="Photo précédente"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image principale — stopPropagation pour ne pas fermer en cliquant l'image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photos[index].url}
        src={photos[index].url}
        alt={`Photo ${index + 1} sur ${photos.length}`}
        className="max-w-[95vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        draggable={false}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />

      {/* Flèche droite */}
      {photos.length > 1 && (
        <button
          className="absolute right-3 sm:right-5 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          onClick={e => { e.stopPropagation(); next() }}
          aria-label="Photo suivante"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Bas : compteur OU confirmation de suppression */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        {confirmDelete ? (
          <div
            className="flex items-center gap-2 bg-[#1c0808] border border-red-800/60 text-white px-4 py-2.5 rounded-xl shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-sm mr-1">Supprimer cette photo ?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="text-white text-sm bg-black/60 px-3 py-1 rounded-full select-none">
            {index + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}
