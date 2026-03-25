'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ListingPhoto } from '@/types/database'

export function useListingPhotos(listingId: string) {
  const [photos, setPhotos] = useState<ListingPhoto[]>([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!listingId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('listing_photos')
        .select('*')
        .eq('listing_id', listingId)
        .order('position')
      setPhotos((data as ListingPhoto[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => { refetch() }, [refetch])

  return { photos, loading, refetch }
}
