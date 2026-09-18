import Link from 'next/link'
import { ScanLine, Wine, Users, ChevronRight, LogOut } from 'lucide-react'
import { todayStrLocal, tomorrowStrLocal } from '@/lib/yachtCalendar'
import { getTripsForDate, type CrewTripSummary } from '@/lib/crew/manifest'
import CrewLogoutButton from '@/components/crew/CrewLogoutButton'

export const dynamic = 'force-dynamic'

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function TripList({ trips, emptyText }: { trips: CrewTripSummary[]; emptyText: string }) {
  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-[#f1f5f9] bg-white p-6 text-center text-sm text-zinc-500">
        {emptyText}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {trips.map((t) => (
        <div
          key={t.tripKey}
          className="rounded-2xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <Users className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#131719]">{t.time ?? '—'}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    t.departed ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-50 text-[#2168b8]'
                  }`}
                >
                  {t.departed ? 'Kalktı' : 'Yaklaşan'}
                </span>
              </div>
              <p className="m-0 mt-0.5 truncate text-sm text-zinc-600">
                {t.tourTitle}
                {t.capacity != null && <span className="text-zinc-400"> · Kapasite {t.capacity}</span>}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {t.boardedCount}/{t.guestsTotal} bindi
            </span>
            <Link
              href={`/ekip/manifest?tripKey=${encodeURIComponent(t.tripKey)}`}
              className="flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-[#131719]"
            >
              Yolcu Listesi
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function CrewDashboardPage() {
  const today = todayStrLocal()
  const tomorrow = tomorrowStrLocal()
  const [trips, tomorrowTrips] = await Promise.all([getTripsForDate(today), getTripsForDate(tomorrow)])

  const boardedTotal = trips.reduce((s, t) => s + t.boardedCount, 0)
  const guestsTotal = trips.reduce((s, t) => s + t.guestsTotal, 0)
  const departuresCount = trips.filter((t) => t.departed).length
  const boardedPct = guestsTotal > 0 ? Math.round((boardedTotal / guestsTotal) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-2xl font-black text-[#131719]">Ekip Paneli</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600">
            {formatDateLabel(today)}
          </span>
          <CrewLogoutButton>
            <LogOut className="h-4 w-4" aria-hidden />
          </CrewLogoutButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/ekip/scan"
          className="flex flex-col gap-3 rounded-2xl p-5 text-white shadow-sm"
          style={{ background: '#fc6c4f' }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <ScanLine className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-bold">Bilet Okut</span>
            <span className="block text-sm text-white/85">Yolcu bindir</span>
          </span>
        </Link>
        <Link
          href="/ekip/bar"
          className="flex flex-col gap-3 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
            <Wine className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-bold text-[#131719]">Bar Siparişleri</span>
            <span className="block text-sm text-zinc-500">Siparişleri yönet</span>
          </span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#131719]">
          <Users className="h-4 w-4 text-zinc-400" aria-hidden />
          Günlük Yolcu Özeti
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-3xl font-black text-[#131719]">{boardedTotal}</span>
            <span className="text-lg font-semibold text-zinc-400">/{guestsTotal}</span>
            <p className="m-0 mt-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Bindi</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#131719]">{departuresCount}</span>
            <p className="m-0 mt-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Kalkış</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-[#131719] transition-all"
            style={{ width: `${Math.min(100, boardedPct)}%` }}
          />
        </div>
      </div>

      <div>
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Bugünün Seferleri</p>
        <TripList trips={trips} emptyText="Bugün için planlanmış sefer yok." />
      </div>

      <div>
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Yarının Seferleri · {formatDateLabel(tomorrow)}
        </p>
        <TripList trips={tomorrowTrips} emptyText="Yarın için planlanmış sefer yok." />
      </div>
    </div>
  )
}
