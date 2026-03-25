import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-[#06090f]">
      <Sidebar />
      <main className="flex-1 ml-16 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
