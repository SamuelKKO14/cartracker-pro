'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDemoStatus() {
  const [hasDemoData, setHasDemoData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = () => {
    setIsLoading(true)
    check()
  }

  async function check() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_demo', true)

      setHasDemoData((count ?? 0) > 0)
    } catch (e) {
      console.error('Demo status check failed', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { check() }, [])

  return { hasDemoData, isLoading, refresh }
}
