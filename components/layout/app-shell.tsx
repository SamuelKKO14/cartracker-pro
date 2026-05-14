'use client'
import { Sidebar } from './sidebar'
import { DemoBanner } from './demo-banner'
import { GamosChat } from '@/components/gamos/gamos-chat'
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
import { OnboardingPanel } from '@/components/onboarding/onboarding-panel'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <div className="flex h-screen bg-[#06090f]">
        <Sidebar />
        <main className="relative flex-1 md:ml-16 flex flex-col overflow-hidden">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
            <DemoBanner />
            {children}
          </div>
        </main>
        <GamosChat />
        <OnboardingPanel />
      </div>
    </OnboardingProvider>
  )
}
