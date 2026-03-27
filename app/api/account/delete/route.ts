import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const userId = user.id

    // Supprime toutes les données de l'utilisateur
    await supabase.from('listing_checklist').delete().eq('user_id', userId)
    await supabase.from('listing_margins').delete().eq('user_id', userId)
    await supabase.from('listing_photos').delete().eq('user_id', userId)
    await supabase.from('client_shares').delete().eq('user_id', userId)
    await supabase.from('client_notes').delete().eq('user_id', userId)
    await supabase.from('listings').delete().eq('user_id', userId)
    await supabase.from('clients').delete().eq('user_id', userId)
    await supabase.from('saved_searches').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    // Supprime le compte auth (nécessite la clé service role)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
