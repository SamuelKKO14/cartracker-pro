'use client'
import { Sidebar } from './sidebar'
import { GamosChat } from '@/components/gamos/gamos-chat'
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
import { OnboardingPanel } from '@/components/onboarding/onboarding-panel'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <div className="flex h-screen bg-[#06090f]">
        <Sidebar />
        <main className="flex-1 md:ml-16 flex flex-col overflow-hidden">
          {children}
        </main>
        <GamosChat />
        <OnboardingPanel />
      </div>
    </OnboardingProvider>
  )
}
