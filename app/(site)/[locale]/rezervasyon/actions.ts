'use server'

import { fetchMonthlyCalendar } from '@/lib/sanity/bookingQueries'
import type { CalendarDay } from '@/lib/sanity/bookingTypes'

export async function getCalendar(
  slug: string,
  year: number,
  month: number
): Promise<CalendarDay[]> {
  return fetchMonthlyCalendar(slug, year, month)
}
