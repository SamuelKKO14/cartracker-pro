'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoFull } from '@/components/ui/logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Vérifier si on a déjà une session (l'event a pu fire avant le montage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
    })

    // Écouter l'event PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })

    // Si après 8 secondes toujours pas de session, marquer comme expiré
    const timeout = setTimeout(() => {
      setExpired(prev => {
        if (!sessionReady) return true
        return prev
      })
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Once sessionReady flips to true, clear the expired timer effect
  useEffect(() => {
    if (sessionReady) setExpired(false)
  }, [sessionReady])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
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
            <h1 className="text-xl font-semibold text-gray-100">Nouveau mot de passe</h1>
            <p className="text-gray-400 text-sm mt-1">Choisissez votre nouveau mot de passe</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/50 text-green-400 text-sm text-center">
              ✅ Mot de passe mis à jour avec succès !
              <p className="text-green-500/70 text-xs mt-1">Redirection en cours…</p>
            </div>
          </div>
        ) : expired && !sessionReady ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm text-center">
              Ce lien a expiré ou est invalide. Demandez un nouveau lien.
            </div>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading || (!sessionReady && !expired)}
            >
              {loading ? 'Mise à jour...' : !sessionReady ? 'Vérification du lien…' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-gray-400">
            <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium">
              Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
