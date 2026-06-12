import type { SiteLocale } from '@/lib/i18n/config'

export type YachtCalendarUi = {
  prevMonth: string
  nextMonth: string
  unavailableDay: (day: number) => string
  pastDay: (day: number) => string
  dayLabel: (day: number, iso: string) => string
  rangeCheckoutHint: string
  blockedHint: string
  singleTitle: string
  rangeTitle: string
}

const TR: YachtCalendarUi = {
  prevMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  unavailableDay: (day) => `${day} müsait değil`,
  pastDay: (day) => `${day} geçmiş`,
  dayLabel: (day, iso) => `${day} ${iso}`,
  rangeCheckoutHint: 'Ayrılış gününü seçin (son konaklama gecesinden sonraki gün).',
  blockedHint: 'Gri günler şu an için uygun değil. Diğer tarihler için talep bırakabilirsiniz.',
  singleTitle: 'Tercih ettiğiniz tarih',
  rangeTitle: 'Giriş ve ayrılış tarihi',
}

const EN: YachtCalendarUi = {
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  unavailableDay: (day) => `${day} unavailable`,
  pastDay: (day) => `${day} past`,
  dayLabel: (day, iso) => `${day} ${iso}`,
  rangeCheckoutHint: 'Select your check-out day (the day after your last night).',
  blockedHint: 'Greyed-out dates are not available. You can still enquire for other dates.',
  singleTitle: 'Preferred date',
  rangeTitle: 'Check-in and check-out',
}

const MAP: Record<SiteLocale, YachtCalendarUi> = {
  tr: TR,
  en: EN,
  de: EN,
}

export function getYachtCalendarUi(locale: SiteLocale): YachtCalendarUi {
  return MAP[locale] ?? TR
}
