'use client'

import { ClipboardList, Calendar, Users } from 'lucide-react'
import type { BookingsStats } from '@/types/adminBookings'

const CARD_CLASS =
  'rounded-xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(19,23,25,0.09)]'

const ICON_WRAP = 'flex h-10 w-10 items-center justify-center rounded-lg'

export default function BookingsSummaryCards({ stats }: { stats: BookingsStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className={CARD_CLASS}>
        <div className={`${ICON_WRAP} bg-blue-50 text-primary`}>
          <ClipboardList className="h-5 w-5" aria-hidden />
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
          <Calendar className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#131719]">
          {stats.todayBookings.toLocaleString('tr-TR')}
        </p>
        <p className="text-sm text-zinc-500">Bugünkü Rezervasyon</p>
      </div>

      {/* Deniz yeşili yalnızca pozitif durumlar için ayrıldı (ör. Ödendi rozeti) —
          burada nötr bir katılımcı sayısı gösterildiği için mavi/gök tonuyla
          işaretlendi. */}
      <div className={CARD_CLASS}>
        <div className={`${ICON_WRAP} bg-sky-50 text-sky-600`}>
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#131719]">
          {stats.todayOccupancy.toLocaleString('tr-TR')} kişi
        </p>
        <p className="text-sm text-zinc-500">Bugünkü Katılımcı</p>
      </div>
    </div>
  )
}
