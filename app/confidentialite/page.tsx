import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ShieldCheck } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* RGPD banner */}
          <div className="mb-8 flex items-start gap-4 rounded-xl border border-green-500/25 bg-green-500/8 px-5 py-4">
            <ShieldCheck className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-300">Conforme au RGPD</p>
              <p className="text-xs text-gray-400 mt-0.5">Vos données personnelles sont traitées en conformité avec le Règlement Général sur la Protection des Données (UE) 2016/679.</p>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-2">Politique de confidentialité</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour : avril 2026</p>
          </div>

          <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données personnelles collectées via cartracker.pro est l'éditeur du service CarTracker Pro. Contact : <a href="mailto:support@cartracker.pro" className="text-orange-400 hover:underline">support@cartracker.pro</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-gray-300">Données de compte :</strong> adresse email, nom complet, photo de profil (optionnelle)</li>
                <li><strong className="text-gray-300">Données d'utilisation :</strong> annonces, clients, notes, marges et données saisies dans l'outil</li>
                <li><strong className="text-gray-300">Données techniques :</strong> adresse IP, type de navigateur, journaux de connexion</li>
                <li><strong className="text-gray-300">Données de facturation :</strong> informations de paiement traitées par Stripe (nous ne stockons pas les numéros de carte)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">3. Finalités du traitement</h2>
              <p>Vos données sont traitées pour :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Fournir et améliorer le service CarTracker Pro</li>
                <li>Gérer votre compte et votre abonnement</li>
                <li>Vous envoyer des communications liées au service (mises à jour, alertes de sécurité)</li>
                <li>Prévenir la fraude et assurer la sécurité de la plateforme</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">4. Base légale du traitement</h2>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-gray-300">Exécution du contrat</strong> : traitement nécessaire à la fourniture du service</li>
                <li><strong className="text-gray-300">Intérêt légitime</strong> : sécurité, prévention de la fraude, amélioration du service</li>
                <li><strong className="text-gray-300">Obligation légale</strong> : conservation des données de facturation</li>
                <li><strong className="text-gray-300">Consentement</strong> : pour les communications marketing (optionnel)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">5. Conservation des données</h2>
              <p>
                Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la clôture de votre compte, sauf obligation légale contraire. Les données de facturation sont conservées 10 ans conformément au droit fiscal.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">6. Destinataires des données</h2>
              <p>Vos données peuvent être partagées avec :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-gray-300">Supabase</strong> (base de données et authentification) — hébergé en Europe</li>
                <li><strong className="text-gray-300">Vercel</strong> (hébergement du service)</li>
                <li><strong className="text-gray-300">Stripe</strong> (paiements)</li>
                <li><strong className="text-gray-300">OpenAI / Anthropic</strong> (fonctionnalités IA) — données anonymisées</li>
              </ul>
              <p>Aucune donnée n'est vendue à des tiers.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">7. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-gray-300">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                <li><strong className="text-gray-300">Droit de rectification</strong> : corriger des données inexactes</li>
                <li><strong className="text-gray-300">Droit à l'effacement</strong> : supprimer vos données (« droit à l'oubli »)</li>
                <li><strong className="text-gray-300">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong className="text-gray-300">Droit d'opposition</strong> : vous opposer à certains traitements</li>
                <li><strong className="text-gray-300">Droit à la limitation</strong> : limiter le traitement dans certains cas</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : <a href="mailto:support@cartracker.pro" className="text-orange-400 hover:underline">support@cartracker.pro</a>. Nous répondrons dans un délai de 30 jours.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">8. Cookies</h2>
              <p>
                Nous utilisons des cookies essentiels au fonctionnement du service (session d'authentification). Aucun cookie publicitaire n'est déposé. Vous pouvez gérer les cookies depuis les paramètres de votre navigateur.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">9. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement TLS, authentification sécurisée, accès restreint aux données, sauvegardes régulières.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">10. Réclamation</h2>
              <p>
                Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous pouvez introduire une réclamation auprès de la <strong className="text-gray-300">CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" className="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
