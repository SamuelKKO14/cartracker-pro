'use client'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { useOnboarding, ALL_STEPS, type StepId } from './onboarding-provider'

// ── Step definitions ──────────────────────────────────────────────────────────

interface StepDef {
  id: StepId
  icon: string
  title: string
  description: string
  cta: string
  href: string
}

const STEPS: StepDef[] = [
  {
    id: 'profile',
    icon: '📝',
    title: 'Complète ton profil',
    description: 'Renseigne ton nom et le nom de ton entreprise pour personnaliser ton espace.',
    cta: 'Aller au profil',
    href: '/compte',
  },
  {
    id: 'first_client',
    icon: '👤',
    title: 'Crée ton premier client',
    description: 'Ajoute un client avec son nom, budget et ce qu\'il recherche.',
    cta: 'Ajouter un client',
    href: '/clients',
  },
  {
    id: 'first_listing',
    icon: '🚗',
    title: 'Ajoute ta première annonce',
    description: 'Crée une annonce manuellement ou importe-la depuis le chat IA.',
    cta: 'Ajouter une annonce',
    href: '/annonces',
  },
  {
    id: 'first_margin',
    icon: '💰',
    title: 'Calcule ta première marge',
    description: 'Ouvre le calculateur sur une annonce et estime ta rentabilité.',
    cta: 'Voir mes annonces',
    href: '/annonces',
  },
  {
    id: 'first_share',
    icon: '📤',
    title: 'Partage une sélection',
    description: 'Envoie une sélection d\'annonces à un client via lien.',
    cta: 'Mes partages',
    href: '/partages',
  },
  {
    id: 'explore_dashboard',
    icon: '📊',
    title: 'Explore ton tableau de bord',
    description: 'Découvre tes statistiques et indicateurs de performance.',
    cta: 'Voir le dashboard',
    href: '/dashboard',
  },
]

// ── Panel ─────────────────────────────────────────────────────────────────────

export function OnboardingPanel() {
  const router = useRouter()
  const { completed, progress, panelOpen, firstName, recentlyCompleted, dismissPanel, reopenPanel } = useOnboarding()

  const doneCount = progress.length
  const totalCount = ALL_STEPS.length
  const pct = Math.round((doneCount / totalCount) * 100)
  const allDone = doneCount === totalCount

  // ── Mobile FAB (always visible if not fully dismissed) ────────────────────
  const Fab = () => (
    <button
      onClick={reopenPanel}
      aria-label="Guide de démarrage"
      style={{ zIndex: 30 }}
      className={`md:hidden fixed bottom-24 right-4 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border transition-all
        ${allDone
          ? 'bg-[#0d1117] border-[#1a1f2e] text-gray-400'
          : 'bg-orange-500 border-orange-600 text-white'
        }`}
    >
      <span className="text-xs font-bold">{doneCount}/{totalCount}</span>
    </button>
  )

  if (!panelOpen) {
    return <Fab />
  }

  return (
    <>
      {/* ── Mobile backdrop ── */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-20"
        onClick={dismissPanel}
      />

      {/* ── Panel ── */}
      <div
        style={{ zIndex: 30 }}
        className="fixed right-0 top-0 h-full w-80 bg-[#0d1117] border-l-2 border-orange-500/60 flex flex-col shadow-2xl
          md:top-0 md:h-full
          bottom-0 md:bottom-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1f2e]">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-100">
              {allDone ? '🎉 Guide terminé' : '🚀 Guide de démarrage'}
            </span>
          </div>
          <button
            onClick={dismissPanel}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-200 hover:bg-[#1a1f2e] transition-colors"
            aria-label="Réduire"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-[#1a1f2e]">
          {firstName && !allDone && (
            <p className="text-xs text-gray-400 mb-2">
              Bonjour <span className="text-gray-200 font-medium">{firstName}</span> — voici tes premières missions.
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-400 tabular-nums shrink-0">
              {doneCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto py-2">
          {allDone ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-sm font-semibold text-gray-100">Bravo ! Tu maîtrises CarTracker Pro.</p>
              <p className="text-xs text-gray-400">Ton business peut décoller !</p>
              <button
                onClick={dismissPanel}
                className="mt-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                Fermer le guide
              </button>
            </div>
          ) : (
            STEPS.map((step, idx) => {
              const isDone = progress.includes(step.id)
              const isJustDone = recentlyCompleted === step.id
              // first uncompleted step = "current"
              const firstUndone = STEPS.find(s => !progress.includes(s.id))
              const isCurrent = !isDone && step.id === firstUndone?.id

              return (
                <div
                  key={step.id}
                  style={isJustDone ? { animation: 'onboarding-pop 0.6s ease' } : undefined}
                  className={`mx-2 my-1 rounded-lg px-3 py-2.5 transition-all duration-300
                    ${isDone
                      ? 'bg-[#0a2318] border border-green-800/40'
                      : isCurrent
                        ? 'bg-[#0d1117] border border-orange-500/40 shadow-[0_0_0_1px_rgba(249,115,22,0.15)]'
                        : 'bg-[#0d1117] border border-[#1a1f2e] opacity-60'
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <Circle className="w-4 h-4 text-gray-600" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm leading-none">{step.icon}</span>
                        <span className={`text-xs font-semibold ${isDone ? 'text-green-300' : 'text-gray-200'}`}>
                          {step.title}
                        </span>
                      </div>

                      {!isDone && (
                        <>
                          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                            {step.description}
                          </p>
                          {isCurrent && (
                            <button
                              onClick={() => { dismissPanel(); router.push(step.href) }}
                              className="flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              {step.cta}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Step number */}
                    <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {!allDone && (
          <div className="px-4 py-3 border-t border-[#1a1f2e]">
            <p className="text-[10px] text-gray-600 text-center">
              Tu peux fermer ce guide à tout moment et le rouvrir via le bouton&nbsp;?
            </p>
          </div>
        )}
      </div>

      {/* Sparkle keyframes */}
      <style>{`
        @keyframes onboarding-pop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.03); }
          60%  { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  )
}
