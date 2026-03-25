'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useListingPhotos } from '@/lib/hooks/useListingPhotos'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'
import type { ListingWithDetails, ListingPhoto } from '@/types/database'

const MAX_PHOTOS = 10

interface PhotosModalProps {
  open: boolean
  onClose: () => void
  listing: ListingWithDetails
  onRefresh: () => void
}

export function PhotosModal({ open, onClose, listing, onRefresh }: PhotosModalProps) {
  const { photos, loading, refetch } = useListingPhotos(listing.id)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const toUpload = Array.from(files).slice(0, remaining)
      let position = photos.length

      for (const file of toUpload) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/${listing.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: storageError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file, { contentType: file.type })
        if (storageError) continue

        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(path)

        await supabase.from('listing_photos').insert({
          user_id: user.id,
          listing_id: listing.id,
          url: publicUrl,
          position,
        })
        position++
      }

      await refetch()
      onRefresh()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(photo: ListingPhoto) {
    setDeletingId(photo.id)
    try {
      const supabase = createClient()
      // Extract storage path from public URL
      const url = new URL(photo.url)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/listing-photos\/(.+)$/)
      if (pathMatch) {
        await supabase.storage.from('listing-photos').remove([pathMatch[1]])
      }
      await supabase.from('listing_photos').delete().eq('id', photo.id)
      // Reorder positions after deletion
      const remaining = photos.filter(p => p.id !== photo.id)
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].position !== i) {
          await supabase.from('listing_photos').update({ position: i }).eq('id', remaining[i].id)
        }
      }
      await refetch()
      onRefresh()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleMove(photo: ListingPhoto, dir: -1 | 1) {
    const idx = photos.findIndex(p => p.id === photo.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= photos.length) return
    const supabase = createClient()
    const swapPhoto = photos[swapIdx]
    await Promise.all([
      supabase.from('listing_photos').update({ position: swapIdx }).eq('id', photo.id),
      supabase.from('listing_photos').update({ position: idx }).eq('id', swapPhoto.id),
    ])
    await refetch()
    onRefresh()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Photos — {listing.brand} {listing.model ?? ''}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {photos.length}/{MAX_PHOTOS}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                <Camera className="w-10 h-10 opacity-30" />
                <p className="text-sm">Aucune photo pour cette annonce</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-video bg-[#0a0d14] border border-[#1a1f2e]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      {deletingId === photo.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <X className="w-3 h-3" />
                      }
                    </button>
                    {/* Reorder */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(photo, -1)}
                        disabled={idx === 0}
                        className="w-5 h-5 flex items-center justify-center rounded bg-black/70 text-white disabled:opacity-30 hover:bg-orange-600"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(photo, 1)}
                        disabled={idx === photos.length - 1}
                        className="w-5 h-5 flex items-center justify-center rounded bg-black/70 text-white disabled:opacity-30 hover:bg-orange-600"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Cover badge */}
                    {idx === 0 && (
                      <div className="absolute top-1.5 left-1.5 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium">
                        Couverture
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleUpload(e.target.files)}
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours…</>
                    : <><Plus className="w-4 h-4" /> Ajouter des photos</>
                  }
                </Button>
                <span className="text-xs text-gray-500">
                  {MAX_PHOTOS - photos.length} emplacement{MAX_PHOTOS - photos.length !== 1 ? 's' : ''} restant{MAX_PHOTOS - photos.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
