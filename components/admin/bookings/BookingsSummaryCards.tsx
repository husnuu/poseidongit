'use client'

import type { BookingsStats } from '@/types/adminBookings'

const CARD_CLASS =
  'rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(19,23,25,0.09)]'

const ICON_WRAP = 'flex h-10 w-10 items-center justify-center rounded-xl'

export default function BookingsSummaryCards({ stats }: { stats: BookingsStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className={CARD_CLASS}>
        <div className={`${ICON_WRAP} bg-blue-50 text-[#2168b8]`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#131719]">
          {stats.totalBookings.toLocaleString('tr-TR')}
        </p>
        <p className="text-sm text-zinc-500">Toplam Rezervasyon</p>
        {typeof stats.onlineBookings === 'number' && typeof stats.manualBookings === 'number' && (
          <p className="mt-1 text-xs text-zinc-400">
            {stats.onlineBookings} online · {stats.manualBookings} manuel
          </p>
        )}
      </div>

      <div className={CARD_CLASS}>
        <div className={`${ICON_WRAP} bg-orange-50`} style={{ color: '#fc6c4f' }}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#131719]">
          {stats.todayBookings.toLocaleString('tr-TR')}
        </p>
        <p className="text-sm text-zinc-500">Bugünkü Rezervasyon</p>
      </div>

      <div className={CARD_CLASS}>
        <div className={`${ICON_WRAP} bg-emerald-50 text-emerald-600`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#131719]">
          {stats.todayOccupancy.toLocaleString('tr-TR')} kişi
        </p>
        <p className="text-sm text-zinc-500">Bugünkü Katılımcı</p>
      </div>
    </div>
  )
}
