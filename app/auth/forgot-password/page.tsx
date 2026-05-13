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
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoFull } from '@/components/ui/logo'
import { GlowingStarsBackground } from '@/components/ui/aceternity/GlowingStarsBackground'
import { BorderBeam } from '@/components/ui/magicui/BorderBeam'
import { ShimmerButton } from '@/components/ui/magicui/ShimmerButton'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(false)

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
    <GlowingStarsBackground className="min-h-screen flex items-center justify-center" starCount={40}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 space-y-8">
          {focused && <BorderBeam size={150} duration={4} />}

          <div className="text-center space-y-3">
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <Mail className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  Un email de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>.
                  Vérifiez votre boîte de réception (et vos spams).
                </span>
              </div>
              <Link
                href="/auth/login"
                className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.04] transition-all"
              >
                Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    autoComplete="email"
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

                <ShimmerButton type="submit" disabled={loading} className="w-full py-3">
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </ShimmerButton>
              </form>

              <p className="text-center text-sm text-gray-400">
                <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </GlowingStarsBackground>
  )
}
