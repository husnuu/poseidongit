/** Supabase bookings.tour_id — kapora ödemelerini tur rezervasyonlarından ayırır. */
export const YACHT_DEPOSIT_TOUR_ID = 'yacht-deposit'

export function isYachtDepositBooking(row: {
  source?: string | null
  tour_id?: string | null
}): boolean {
  if ((row.tour_id ?? '').trim() === YACHT_DEPOSIT_TOUR_ID) return true
  if ((row.source ?? '').trim() === 'yacht_deposit') return true
  return false
}
