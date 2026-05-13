'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoFull } from '@/components/ui/logo'
import { GlowingStarsBackground } from '@/components/ui/aceternity/GlowingStarsBackground'
import { BorderBeam } from '@/components/ui/magicui/BorderBeam'
import { ShimmerButton } from '@/components/ui/magicui/ShimmerButton'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <GlowingStarsBackground className="min-h-screen flex items-center justify-center" starCount={40}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-10 max-w-md mx-4 text-center space-y-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-100">Compte créé !</h2>
          <p className="text-gray-400 text-sm">
            Vérifiez votre email pour confirmer votre compte, puis connectez-vous.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-gray-300 hover:bg-white/[0.08] transition-all"
          >
            Se connecter
          </Link>
        </motion.div>
      </GlowingStarsBackground>
    )
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
            <p className="text-gray-400 text-sm">Créer votre compte</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
                className="bg-[#0d1117] border-white/[0.08] focus:border-orange-500/60 text-white placeholder-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-400">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                minLength={6}
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
              {loading ? 'Création...' : 'Créer mon compte'}
            </ShimmerButton>
          </form>

          <p className="text-center text-sm text-gray-400">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </GlowingStarsBackground>
  )
}
