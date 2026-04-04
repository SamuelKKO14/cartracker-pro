'use client'
import { useState } from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Mail, Clock, CheckCircle, Send } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100">Contactez-nous</h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Une question, un bug, une suggestion ? On répond généralement sous 24h.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Info cards */}
            <div className="space-y-5">
              <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-orange-400" />
                </div>
                <p className="font-semibold text-white text-sm">Email</p>
                <p className="text-sm text-gray-400">support@cartracker.pro</p>
              </div>
              <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <p className="font-semibold text-white text-sm">Horaires</p>
                <p className="text-sm text-gray-400">Lun–Ven · 9h–18h (CET)</p>
                <p className="text-xs text-gray-500">Réponse sous 24h ouvrées</p>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              {submitted ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/8 p-10 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <h2 className="text-xl font-semibold text-white">Message envoyé !</h2>
                  <p className="text-gray-400 text-sm max-w-xs">Merci pour votre message. Nous vous répondrons dans les plus brefs délais.</p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="mt-2 px-5 py-2 rounded-lg border border-[#2a2f3e] text-sm text-gray-300 hover:text-white hover:border-[#3a3f4e] transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">Nom complet</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Jean Dupont"
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="jean@exemple.fr"
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Sujet</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
                    >
                      <option value="">Choisissez un sujet</option>
                      <option value="support">Support technique</option>
                      <option value="facturation">Facturation / Abonnement</option>
                      <option value="suggestion">Suggestion de fonctionnalité</option>
                      <option value="partenariat">Partenariat</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Décrivez votre demande..."
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
