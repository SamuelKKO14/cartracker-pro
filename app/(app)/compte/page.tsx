'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Camera, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import type { Profile } from '@/types/database'

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl border flex items-center gap-2 ${
      type === 'success'
        ? 'bg-green-950/95 text-green-300 border-green-800/60'
        : 'bg-red-950/95 text-red-300 border-red-800/60'
    }`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
      <div className="px-5 py-3 bg-[#0a0d14] border-b border-[#1a1f2e]">
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComptePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)

  // Auth
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userCreatedAt, setUserCreatedAt] = useState('')

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Profile form
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    website: '',
    bio: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Stats
  const [listingsCount, setListingsCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)

  // Password
  const [passwords, setPasswords] = useState({ newPassword: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ new: false, confirm: false })
  const [savingPwd, setSavingPwd] = useState(false)

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAll() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setUserCreatedAt(user.created_at ?? '')

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        const p = profileData as Profile
        setProfile(p)
        setForm({
          full_name: p.full_name ?? '',
          company_name: p.company_name ?? '',
          phone: p.phone ?? '',
          website: p.website ?? '',
          bio: p.bio ?? '',
        })
      }

      // Counts
      const [{ count: lCount }, { count: cCount }] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setListingsCount(lCount ?? 0)
      setClientsCount(cCount ?? 0)

      setLoading(false)
    }
    loadAll()
  }, [])

  // ── Avatar ─────────────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('La photo ne doit pas dépasser 5 Mo', 'error')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/avatar_${Date.now()}.${ext}`

    setAvatarUploading(true)
    try {
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: publicUrl, updated_at: new Date().toISOString() })

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : { id: userId, full_name: null, company_name: null, phone: null, avatar_url: publicUrl, website: null, bio: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      showToast('Photo mise à jour')
    } catch {
      showToast('Erreur lors de l\'upload', 'error')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteAvatar() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('profiles')
      .upsert({ id: userId, avatar_url: null, updated_at: new Date().toISOString() })
    setProfile(prev => prev ? { ...prev, avatar_url: null } : null)
    showToast('Photo supprimée')
  }

  // ── Profile save ───────────────────────────────────────────────────────────

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const supabase = createClient()
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: form.full_name || null,
        company_name: form.company_name || null,
        phone: form.phone || null,
        website: form.website || null,
        bio: form.bio || null,
        updated_at: new Date().toISOString(),
      })
      showToast('Profil sauvegardé')
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Password ───────────────────────────────────────────────────────────────

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.newPassword.length < 8) {
      showToast('Le mot de passe doit contenir au moins 8 caractères', 'error')
      return
    }
    if (passwords.newPassword !== passwords.confirm) {
      showToast('Les mots de passe ne correspondent pas', 'error')
      return
    }
    setSavingPwd(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPasswords({ newPassword: '', confirm: '' })
      showToast('Mot de passe modifié')
    } catch {
      showToast('Erreur lors du changement de mot de passe', 'error')
    } finally {
      setSavingPwd(false)
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/auth/login')
    } catch {
      showToast('Erreur lors de la suppression du compte', 'error')
      setDeleting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const initials = form.full_name
    ? form.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.charAt(0).toUpperCase()

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Chargement…
      </div>
    )
  }

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Mon compte" />

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 max-w-2xl mx-auto space-y-5">

          {/* ── Section 1 : Photo de profil ── */}
          <Section title="Photo de profil">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-[#2a2f3e]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl font-bold text-orange-400 ring-2 ring-[#2a2f3e]">
                    {initials}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  <Camera className="w-4 h-4" />
                  Changer la photo
                </Button>
                {profile?.avatar_url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDeleteAvatar}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la photo
                  </Button>
                )}
                <p className="text-xs text-gray-600">JPG, PNG ou WebP · Max 5 Mo</p>
              </div>
            </div>
          </Section>

          {/* ── Section 2 : Informations personnelles ── */}
          <Section title="Informations personnelles">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nom complet</Label>
                  <Input
                    placeholder="Samuel Dupont"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom de l&apos;entreprise</Label>
                  <Input
                    placeholder="Auto Pro Services"
                    value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="+33 6 12 34 56 78"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Site web</Label>
                  <Input
                    type="url"
                    placeholder="https://monsite.fr"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Bio / Description</Label>
                  <span className={`text-xs ${form.bio.length > 280 ? 'text-orange-400' : 'text-gray-600'}`}>
                    {form.bio.length}/300
                  </span>
                </div>
                <Textarea
                  placeholder="Mandataire automobile spécialisé dans l'import européen…"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 300) }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Sauvegarde…' : 'Sauvegarder'}
                </Button>
              </div>
            </form>
          </Section>

          {/* ── Section 3 : Informations du compte ── */}
          <Section title="Informations du compte">
            <div className="space-y-3">
              <InfoRow label="Email" value={userEmail} />
              <InfoRow label="Membre depuis" value={formatDate(userCreatedAt)} />
              <div className="flex items-center justify-between py-2 border-b border-[#1a1f2e]">
                <span className="text-sm text-gray-500">Plan actuel</span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Pro
                </span>
              </div>
              <InfoRow label="Annonces créées" value={String(listingsCount)} />
              <InfoRow label="Clients" value={String(clientsCount)} />
            </div>
          </Section>

          {/* ── Section 4 : Changer le mot de passe ── */}
          <Section title="Changer le mot de passe">
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPwd.new ? 'text' : 'password'}
                      placeholder="Min. 8 caractères"
                      value={passwords.newPassword}
                      onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                      minLength={8}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPwd.confirm ? 'text' : 'password'}
                      placeholder="Répétez le mot de passe"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {passwords.confirm && passwords.newPassword !== passwords.confirm && (
                <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={savingPwd}>
                  {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </Section>

          {/* ── Section 5 : Zone de danger ── */}
          <div className="rounded-xl border border-red-900/50 overflow-hidden">
            <div className="px-5 py-3 bg-red-950/20 border-b border-red-900/50">
              <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Zone de danger
              </h2>
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300 font-medium">Supprimer mon compte</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Supprime définitivement toutes vos données (clients, annonces, partages).
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/40"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le compte
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal de confirmation de suppression ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
        >
          <div className="w-full max-w-md mx-4 rounded-xl border border-red-900/50 bg-[#0a0d14] shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">Supprimer mon compte</h3>
                  <p className="text-xs text-gray-500">Cette action est irréversible</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">
                Toutes vos données (clients, annonces, partages) seront{' '}
                <span className="text-red-400 font-medium">définitivement supprimées</span>.
                Cette action ne peut pas être annulée.
              </p>

              <div className="space-y-1.5">
                <Label className="text-gray-400">
                  Tapez <span className="font-mono text-red-400 font-semibold">SUPPRIMER</span> pour confirmer
                </Label>
                <Input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="border-red-900/40 focus:border-red-700/60"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white border-0"
                  disabled={deleteConfirm !== 'SUPPRIMER' || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a1f2e] last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-300 font-medium">{value || '—'}</span>
    </div>
  )
}
