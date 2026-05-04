import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CarTracker Pro',
  description: 'Outil professionnel pour les mandataires et courtiers automobiles',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-[#06090f] text-gray-200 font-outfit">
        {children}
      </body>
    </html>
  )
}
