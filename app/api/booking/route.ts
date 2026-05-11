import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit : max 5 réservations par IP par 10 minutes
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`booking:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const supabase = createAdminClient()

  try {
    const body = await request.json()

    // Log COMPLET du payload reçu
    console.log('=== BOOKING REQUEST PAYLOAD ===', JSON.stringify(body, null, 2))

    const {
      prenom,
      nom,
      email,
      telephone,
      prestation_id,
      date_rdv,
      heure_rdv,
      lieu,
      notes_client,
    } = body

    // Validation des champs obligatoires
    if (!prenom || !nom || !email || !telephone || !prestation_id || !date_rdv || !heure_rdv || !lieu) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // Validation lieu
    if (lieu !== 'chez_naea' && lieu !== 'domicile') {
      return NextResponse.json({ error: 'Lieu invalide' }, { status: 400 })
    }

    // Vérifier que la prestation existe et est active
    const { data: prestation, error: prestationError } = await supabase
      .from('prestations')
      .select('id, prix, nom')
      .eq('id', prestation_id)
      .eq('actif', true)
      .single()

    if (prestationError || !prestation) {
      return NextResponse.json(
        { error: 'Prestation invalide ou inactive' },
        { status: 400 }
      )
    }

    // Vérifier que le créneau n'est pas déjà pris (hors annulées)
    const { data: existingBooking } = await supabase
      .from('reservations')
      .select('id')
      .eq('date_rdv', date_rdv)
      .eq('heure_rdv', heure_rdv)
      .not('statut', 'eq', 'annulee')
      .limit(1)

    if (existingBooking && existingBooking.length > 0) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà pris. Veuillez en choisir un autre.' },
        { status: 409 }
      )
    }

    // Créer ou trouver le client par email
    let clientId: string
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (existingClient && existingClient.length > 0) {
      clientId = existingClient[0].id
      await supabase
        .from('clients')
        .update({ prenom, nom, telephone, updated_at: new Date().toISOString() })
        .eq('id', clientId)
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ prenom, nom, email, telephone })
        .select('id')
        .single()

      if (clientError || !newClient) {
        console.error('=== CLIENT CREATE ERROR ===', clientError)
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil client' },
          { status: 500 }
        )
      }
      clientId = newClient.id
    }

    // Calcul montants
    const montantTotal = Number(prestation.prix)
    const montantAcompte = Math.round(montantTotal * 0.3 * 100) / 100

    // CRÉER LA RÉSERVATION — statut et acompte FORCÉS côté serveur
    const newReservation = {
      client_id: clientId,
      prestation_id: prestation_id,
      date_rdv: date_rdv,
      heure_rdv: heure_rdv,
      lieu: lieu as 'chez_naea' | 'domicile',
      statut: 'en_attente' as const,  // FORCÉ — jamais autre chose
      montant_total: montantTotal,
      montant_acompte: montantAcompte,
      acompte_paye: false,              // FORCÉ — jamais true
      notes_client: notes_client || null,
    }

    console.log('=== INSERTING RESERVATION ===', JSON.stringify(newReservation, null, 2))

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(newReservation)
      .select('id')
      .single()

    if (reservationError) {
      console.error('=== RESERVATION INSERT ERROR ===', reservationError)
      if (reservationError.code === '23505') {
        return NextResponse.json(
          { error: 'Ce créneau est déjà pris. Veuillez en choisir un autre.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      )
    }

    console.log('=== RESERVATION CREATED ===', reservation.id)

    return NextResponse.json({
      success: true,
      reservation_id: reservation.id,
      prestation_nom: prestation.nom,
      montant_total: montantTotal,
      montant_acompte: montantAcompte,
    })
  } catch (error) {
    console.error('=== BOOKING UNEXPECTED ERROR ===', error)
    return NextResponse.json(
      { error: 'Erreur inattendue' },
      { status: 500 }
    )
  }
}
