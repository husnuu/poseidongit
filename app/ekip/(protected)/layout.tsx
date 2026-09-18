import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CREW_SESSION_COOKIE, verifyCrewSessionToken } from '@/lib/crew/crewSession'
import CrewBottomNav from '@/components/crew/CrewBottomNav'

export const dynamic = 'force-dynamic'

export default async function CrewProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const token = jar.get(CREW_SESSION_COOKIE)?.value
  const ok = token ? await verifyCrewSessionToken(token) : false
  if (!ok) redirect('/ekip/giris')

  return (
    <div className="min-h-screen bg-zinc-50 pb-20" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="mx-auto max-w-lg px-4 pt-6">{children}</div>
      <CrewBottomNav />
    </div>
  )
}
