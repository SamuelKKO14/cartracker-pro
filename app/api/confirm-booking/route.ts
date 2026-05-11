import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== CONFIRM BOOKING CALLED ===')

  // Vérifier l'authentification admin via session Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('=== CONFIRM BOOKING DENIED — no user ===')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { reservation_id } = body

    console.log('=== CONFIRM BOOKING ===', { reservation_id, admin: user.email })

    if (!reservation_id) {
      return NextResponse.json(
        { error: 'reservation_id requis' },
        { status: 400 }
      )
    }

    // Vérifier que la réservation existe et est en_attente
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('id, statut')
      .eq('id', reservation_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    if (existing.statut !== 'en_attente') {
      return NextResponse.json(
        { error: `Impossible de confirmer une réservation au statut "${existing.statut}"` },
        { status: 400 }
      )
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        statut: 'confirmee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation_id)

    if (updateError) {
      console.error('=== CONFIRM BOOKING UPDATE ERROR ===', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la confirmation' },
        { status: 500 }
      )
    }

    console.log('=== BOOKING CONFIRMED ===', reservation_id)

    return NextResponse.json({ success: true, reservation_id })
  } catch (error) {
    console.error('=== CONFIRM BOOKING UNEXPECTED ERROR ===', error)
    return NextResponse.json(
      { error: 'Erreur inattendue' },
      { status: 500 }
    )
  }
}
