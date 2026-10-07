import type { SiteLocale } from '@/lib/i18n/config'

export type YachtCalendarUi = {
  prevMonth: string
  nextMonth: string
  selectMonthAria: string
  selectYearAria: string
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
  selectMonthAria: 'Ay seçin',
  selectYearAria: 'Yıl seçin',
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
  selectMonthAria: 'Select month',
  selectYearAria: 'Select year',
  unavailableDay: (day) => `${day} unavailable`,
  pastDay: (day) => `${day} past`,
  dayLabel: (day, iso) => `${day} ${iso}`,
  rangeCheckoutHint: 'Select your check-out day (the day after your last night).',
  blockedHint: 'Greyed-out dates are not available. You can still enquire for other dates.',
  singleTitle: 'Preferred date',
  rangeTitle: 'Check-in and check-out',
}

const RU: YachtCalendarUi = {
  prevMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  selectMonthAria: 'Выберите месяц',
  selectYearAria: 'Выберите год',
  unavailableDay: (day) => `${day} недоступно`,
  pastDay: (day) => `${day} в прошлом`,
  dayLabel: (day, iso) => `${day} ${iso}`,
  rangeCheckoutHint: 'Выберите дату выезда (день после последней ночи проживания).',
  blockedHint: 'Серые даты сейчас недоступны. Вы можете оставить запрос на другие даты.',
  singleTitle: 'Предпочитаемая дата',
  rangeTitle: 'Дата заезда и выезда',
}

const MAP: Record<SiteLocale, YachtCalendarUi> = {
  tr: TR,
  en: EN,
  de: EN,
  ru: RU,
}

export function getYachtCalendarUi(locale: SiteLocale): YachtCalendarUi {
  return MAP[locale] ?? TR
}
