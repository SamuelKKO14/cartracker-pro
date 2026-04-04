import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function CguPage() {
  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-2">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour : avril 2026</p>
          </div>

          <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 1 — Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service CarTracker Pro, accessible à l'adresse <strong className="text-gray-300">cartracker.pro</strong>. En vous inscrivant ou en utilisant le service, vous acceptez sans réserve les présentes conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 2 — Description du service</h2>
              <p>
                CarTracker Pro est un outil SaaS destiné aux mandataires automobiles et professionnels de la revente de véhicules. Il permet notamment de gérer des annonces, des clients, de calculer des marges et de partager des sélections de véhicules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 3 — Inscription et compte utilisateur</h2>
              <p>
                L'accès au service nécessite la création d'un compte avec une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
              </p>
              <p>
                Vous vous engagez à fournir des informations exactes lors de l'inscription et à les maintenir à jour.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 4 — Utilisation acceptable</h2>
              <p>Il est strictement interdit d'utiliser le service pour :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Toute activité illégale ou frauduleuse</li>
                <li>La diffusion de contenus illicites, offensants ou trompeurs</li>
                <li>Tenter de contourner les mécanismes de sécurité</li>
                <li>L'utilisation automatisée abusive (scraping, spam)</li>
                <li>La revente ou redistribution non autorisée du service</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 5 — Tarifs et abonnement</h2>
              <p>
                CarTracker Pro propose une période d'essai gratuite. Au-delà, l'accès est soumis à un abonnement payant dont les tarifs sont disponibles sur la page <strong className="text-gray-300">/tarifs</strong>.
              </p>
              <p>
                Les abonnements sont facturés mensuellement ou annuellement selon le plan choisi. Les paiements sont traités par Stripe. Aucun remboursement n'est accordé pour les périodes déjà facturées, sauf dispositions légales contraires.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 6 — Résiliation</h2>
              <p>
                Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre compte. La résiliation prend effet à la fin de la période d'abonnement en cours.
              </p>
              <p>
                L'éditeur se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 7 — Propriété des données</h2>
              <p>
                Vous conservez l'intégralité des droits sur les données que vous saisissez dans CarTracker Pro (clients, annonces, notes, etc.). L'éditeur ne revendique aucun droit de propriété sur vos données.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 8 — Disponibilité du service</h2>
              <p>
                L'éditeur s'efforce d'assurer une disponibilité maximale du service, mais ne peut garantir une disponibilité ininterrompue. Des maintenances planifiées ou des interruptions techniques peuvent survenir.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 9 — Limitation de responsabilité</h2>
              <p>
                L'éditeur ne peut être tenu responsable de tout dommage indirect, perte de données, perte de chiffre d'affaires ou tout autre préjudice résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 10 — Protection des données personnelles</h2>
              <p>
                Le traitement de vos données personnelles est décrit dans notre <a href="/confidentialite" className="text-orange-400 hover:underline">Politique de confidentialité</a>, conforme au RGPD.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 11 — Modification des CGU</h2>
              <p>
                L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email de toute modification substantielle. L'utilisation continue du service vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 12 — Propriété intellectuelle</h2>
              <p>
                Le logiciel, l'interface, la charte graphique et tous les éléments constitutifs du service sont la propriété exclusive de l'éditeur. Toute reproduction ou utilisation sans autorisation est interdite.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">Article 13 — Droit applicable et litiges</h2>
              <p>
                Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents de France.
              </p>
              <p>
                Contact : <a href="mailto:support@cartracker.pro" className="text-orange-400 hover:underline">support@cartracker.pro</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
