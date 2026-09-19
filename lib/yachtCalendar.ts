/** Yat müsaitlik takvimi — tur rezervasyon mantığından bağımsız, sadece ay grid’i */

import { todayStrIstanbul, tomorrowStrIstanbul } from '@/lib/istanbulTime'

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

export function toYachtDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export interface YachtCalendarDay {
  date: string
  inMonth: boolean
}

export function buildYachtCalendarDaysForMonth(year: number, month: number): YachtCalendarDay[] {
  const last = new Date(year, month, 0).getDate()
  const days: YachtCalendarDay[] = []
  for (let d = 1; d <= last; d++) {
    days.push({ date: toYachtDateStr(year, month, d), inMonth: true })
  }
  return days
}

/** "Bugün" İstanbul takvimine göre hesaplanır (sunucu UTC'de çalışsa da). */
export function todayStrLocal(): string {
  return todayStrIstanbul()
}

export function tomorrowStrLocal(): string {
  return tomorrowStrIstanbul()
}
