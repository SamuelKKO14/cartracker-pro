// IMPORTANT : Dans Supabase Dashboard → Authentication → URL Configuration
// Ajouter ces URLs dans "Redirect URLs" :
// - https://cartrackerpro.fr/auth/callback
// - https://cartrackerpro.fr/auth/reset-password
// - https://cartracker-pro.vercel.app/auth/callback
// - https://cartracker-pro.vercel.app/auth/reset-password
// - http://localhost:3000/auth/callback
// - http://localhost:3000/auth/reset-password

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoFull } from '@/components/ui/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06090f]">
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <LogoFull className="h-10" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-100">Réinitialiser votre mot de passe</h1>
            <p className="text-gray-400 text-sm mt-1">
              Entrez votre email, vous recevrez un lien de réinitialisation.
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/50 text-green-400 text-sm">
              📧 Un email de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>.
              Vérifiez votre boîte de réception (et vos spams).
            </div>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400">
              <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
