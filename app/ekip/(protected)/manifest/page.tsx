import Link from 'next/link'
import { ChevronLeft, Ship, Users } from 'lucide-react'
import { getManifestForTrip, parseTripKey } from '@/lib/crew/manifest'

export const dynamic = 'force-dynamic'

export default async function CrewManifestPage({
  searchParams,
}: {
  searchParams: Promise<{ tripKey?: string }>
}) {
  const sp = await searchParams
  const tripKey = sp.tripKey ?? ''
  const { tourId, date, time } = parseTripKey(tripKey)
  const manifest = tourId && date ? await getManifestForTrip(tourId, date, time) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/ekip" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100">
          <ChevronLeft className="h-5 w-5 text-[#131719]" aria-hidden />
        </Link>
        <h1 className="m-0 text-lg font-black text-[#131719]">Guest Manifest</h1>
      </div>

      {!manifest ? (
        <div className="rounded-2xl border border-[#f1f5f9] bg-white p-6 text-center text-sm text-zinc-500">
          Sefer bulunamadı.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="m-0 text-lg font-bold text-[#131719]">{manifest.tourTitle}</p>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
              <Ship className="h-4 w-4" aria-hidden />
              {manifest.time ?? '—'}
              {manifest.guestsTotal > 0 && <> · Cap {manifest.guestsTotal}</>}
            </div>

            <div className="mt-4 border-t border-[#f1f5f9] pt-4">
              <span className="text-3xl font-black text-[#131719]">{manifest.boardedCount}</span>
              <span className="text-lg font-semibold text-zinc-400">/{manifest.guestsTotal}</span>
              <p className="m-0 mt-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Boarded</p>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-[#f1f5f9] pt-4 text-sm">
              <Users className="h-4 w-4 text-zinc-400" aria-hidden />
              <span className="font-semibold text-[#131719]">{manifest.bookingsCount} bookings</span>
              {manifest.mealCounts.length > 0 && (
                <span className="truncate text-zinc-500">
                  · {manifest.mealCounts.map((m) => `${m.label} ×${m.count}`).join(' · ')}
                </span>
              )}
            </div>
            {manifest.noShowCount > 0 && (
              <p className="m-0 mt-2 text-sm font-semibold text-amber-700">{manifest.noShowCount} no-show</p>
            )}
          </div>

          <div className="space-y-3">
            {manifest.bookings.map((b) => (
              <div
                key={b.bookingId}
                className="rounded-2xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] pb-3">
                  <span className="font-mono text-sm font-bold text-[#131719]">
                    #{b.reference} <span className="font-sans font-normal text-zinc-500">{b.guestCount} guests</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      b.boarded
                        ? 'bg-emerald-50 text-emerald-700'
                        : b.noShow
                          ? 'bg-red-50 text-red-600'
                          : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {b.boarded ? 'Boarded' : b.noShow ? 'No-show' : 'Expected'}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {b.guests.map((g, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#131719]">{g.name}</span>
                      {g.mealLabel && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2168b8]">
                          {g.mealLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
