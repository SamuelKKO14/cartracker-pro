// IMPORTANT : Dans Supabase Dashboard → Authentication → URL Configuration
// Ajouter ces URLs dans "Redirect URLs" :
// - https://cartrackerpro.fr/auth/callback
// - https://cartrackerpro.fr/auth/reset-password
// - https://cartracker-pro.vercel.app/auth/callback
// - https://cartracker-pro.vercel.app/auth/reset-password
// - http://localhost:3000/auth/callback
// - http://localhost:3000/auth/reset-password

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoFull } from '@/components/ui/logo'
import { GlowingStarsBackground } from '@/components/ui/aceternity/GlowingStarsBackground'
import { BorderBeam } from '@/components/ui/magicui/BorderBeam'
import { ShimmerButton } from '@/components/ui/magicui/ShimmerButton'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        setSessionReady(true)
      }
    })

    const timeout = setTimeout(() => {
      if (!sessionReady) setExpired(true)
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <GlowingStarsBackground className="min-h-screen flex items-center justify-center" starCount={40}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[480px] px-4"
      >
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-12 space-y-8">
          {focused && <BorderBeam size={150} duration={4} />}

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <LogoFull className="h-10" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-100">Nouveau mot de passe</h1>
              <p className="text-gray-400 text-sm mt-1">Choisissez votre nouveau mot de passe</p>
            </div>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                Mot de passe mis a jour avec succes !
                <p className="text-green-500/70 text-xs mt-1">Redirection en cours...</p>
              </div>
            </motion.div>
          ) : expired && !sessionReady ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                Ce lien a expire ou est invalide. Demandez un nouveau lien.
              </div>
              <Link
                href="/auth/forgot-password"
                className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-gray-300 hover:bg-white/[0.08] transition-all"
              >
                Demander un nouveau lien
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-400">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-[#0d1117] border-white/[0.08] focus:border-orange-500/60 text-white placeholder-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-gray-400">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-[#0d1117] border-white/[0.08] focus:border-orange-500/60 text-white placeholder-gray-600"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <ShimmerButton
                type="submit"
                disabled={loading || (!sessionReady && !expired)}
                className="w-full py-3"
              >
                {loading ? 'Mise a jour...' : !sessionReady ? 'Verification du lien...' : 'Reinitialiser le mot de passe'}
              </ShimmerButton>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-gray-400">
              <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Retour a la connexion
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </GlowingStarsBackground>
  )
}
