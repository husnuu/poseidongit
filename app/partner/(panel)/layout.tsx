import { redirect } from 'next/navigation'
import { getPartnerFromSession } from '@/lib/partner/session'
import PartnerNav from '@/components/partner/PartnerNav'

export const dynamic = 'force-dynamic'

export default async function PartnerPanelLayout({ children }: { children: React.ReactNode }) {
  const partner = await getPartnerFromSession().catch(() => null)
  if (!partner) redirect('/partner/giris')
  return (
    <div className="min-h-screen bg-zinc-50">
      <PartnerNav name={partner.name} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
