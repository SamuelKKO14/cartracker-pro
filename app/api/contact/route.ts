import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 're_YOUR_KEY_HERE') {
      return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 })
    }

    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Le message doit contenir au moins 10 caractères' }, { status: 400 })
    }

    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: 'CarTracker Pro <onboarding@resend.dev>',
      to: 'contact@cartrackerpro.fr',
      replyTo: email,
      subject: `[Contact landing] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Nouveau message depuis CarTracker Pro</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; width: 100px;">Nom</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Sujet</td><td style="padding: 8px 0;">${subject}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 })
  }
}
