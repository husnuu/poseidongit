import Link from 'next/link'
import { ChevronLeft, Ship, Wine, Users } from 'lucide-react'
import { todayStrLocal } from '@/lib/yachtCalendar'
import { getTripsForDate } from '@/lib/crew/manifest'
import { getPendingCountsForTrips } from '@/lib/crew/barOrders'

export const dynamic = 'force-dynamic'

export default async function CrewBarListPage() {
  const today = todayStrLocal()
  const trips = await getTripsForDate(today)
  const pendingByTrip = await getPendingCountsForTrips(
    trips.map((t) => ({ tourId: t.tourId, date: t.date, time: t.time }))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/ekip" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100">
          <ChevronLeft className="h-5 w-5 text-[#131719]" aria-hidden />
        </Link>
        <h1 className="m-0 text-lg font-black text-[#131719]">Active Bar Services</h1>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-[#f1f5f9] bg-white p-6 text-center text-sm text-zinc-500">
          Bugün için sefer yok.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((t) => {
            const pending = pendingByTrip.get(t.tripKey) ?? 0
            return (
              <Link
                key={t.tripKey}
                href={`/ekip/bar/${encodeURIComponent(t.tripKey)}`}
                className="block rounded-2xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                    <Ship className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-bold text-[#131719]">{t.tourTitle}</p>
                    <p className="m-0 mt-0.5 text-sm text-zinc-500">{t.time ?? '—'}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      t.departed ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#2168b8]'
                    }`}
                  >
                    {t.departed ? 'At sea' : 'Upcoming'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-[#f1f5f9] pt-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Wine className="h-3.5 w-3.5" aria-hidden />
                    {pending} pending
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {t.boardedCount} guests
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
