import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function MentionsLegalesPage() {
  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-2">Mentions légales</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour : avril 2026</p>
          </div>

          <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">1. Éditeur du site</h2>
              <p>Le site <strong className="text-gray-200">cartracker.pro</strong> est édité par :</p>
              <ul className="space-y-1 pl-4 border-l border-[#1a1f2e]">
                <li><strong className="text-gray-300">Raison sociale :</strong> CarTracker Pro</li>
                <li><strong className="text-gray-300">Statut :</strong> Auto-entrepreneur / SAS (en cours d'immatriculation)</li>
                <li><strong className="text-gray-300">Email :</strong> support@cartracker.pro</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">2. Hébergement</h2>
              <p>Le site est hébergé par :</p>
              <ul className="space-y-1 pl-4 border-l border-[#1a1f2e]">
                <li><strong className="text-gray-300">Vercel Inc.</strong></li>
                <li>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
                <li><a href="https://vercel.com" className="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">3. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus présents sur ce site (textes, images, logos, icônes, interface) est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation expresse de l'éditeur.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">4. Responsabilité</h2>
              <p>
                L'éditeur s'efforce d'assurer l'exactitude des informations publiées sur ce site, mais ne peut garantir leur exhaustivité ou leur actualité. L'utilisation des informations publiées sur ce site se fait sous la responsabilité exclusive de l'utilisateur.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">5. Liens hypertextes</h2>
              <p>
                Le site peut contenir des liens vers des sites tiers. L'éditeur n'est pas responsable des contenus de ces sites externes et ne peut être tenu pour responsable des dommages résultant de leur consultation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">6. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur interprétation ou leur exécution relève des tribunaux compétents de France.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">7. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:support@cartracker.pro" className="text-orange-400 hover:underline">support@cartracker.pro</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
