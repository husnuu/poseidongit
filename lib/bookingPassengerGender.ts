import { sanitizeSingleLineText } from '@/lib/inputSanitize'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { additionalTravelerSlotCount } from '@/lib/bookingAdditionalTravelers'

export type PassengerGender = 'male' | 'female'

export function isPassengerGender(value: unknown): value is PassengerGender {
  return value === 'male' || value === 'female'
}

export function resizeInfantGenders(
  prev: (PassengerGender | '' | undefined)[] | undefined,
  babyCount: number
): (PassengerGender | '')[] {
  const old = prev ?? []
  return Array.from({ length: Math.max(0, babyCount) }, (_, i) =>
    isPassengerGender(old[i]) ? old[i] : ''
  )
}

export function allPassengerGendersFilled(state: BookingWizardState): boolean {
  if (!isPassengerGender(state.customer.gender)) return false

  const extraN = additionalTravelerSlotCount(state.counts)
  const list = state.additionalTravelers ?? []
  for (let i = 0; i < extraN; i++) {
    if (!isPassengerGender(list[i]?.gender)) return false
  }

  const infants = resizeInfantGenders(state.infantGenders, state.counts.baby)
  for (let i = 0; i < state.counts.baby; i++) {
    if (!isPassengerGender(infants[i])) return false
  }
  return true
}

/** Tüm yolcular işaretlendi ve hepsi bay ise true (ödeme engeli). */
export function allPassengersAreMale(state: BookingWizardState): boolean {
  if (!allPassengerGendersFilled(state)) return false
  if (state.customer.gender !== 'male') return false

  const extraN = additionalTravelerSlotCount(state.counts)
  const list = state.additionalTravelers ?? []
  for (let i = 0; i < extraN; i++) {
    if (list[i]?.gender !== 'male') return false
  }

  const infants = resizeInfantGenders(state.infantGenders, state.counts.baby)
  for (let i = 0; i < state.counts.baby; i++) {
    if (infants[i] !== 'male') return false
  }
  return true
}

export function validatePassengerGenders(
  state: BookingWizardState,
  messages?: { gender: string }
): Record<string, string> {
  const errors: Record<string, string> = {}
  const msg = messages?.gender ?? 'Cinsiyet seçimi zorunludur.'

  if (!isPassengerGender(state.customer.gender)) {
    errors.customerGender = msg
  }

  const extraN = additionalTravelerSlotCount(state.counts)
  const list = state.additionalTravelers ?? []
  for (let i = 0; i < extraN; i++) {
    if (!isPassengerGender(list[i]?.gender)) {
      errors[`traveler${i}Gender`] = msg
    }
  }

  const infants = resizeInfantGenders(state.infantGenders, state.counts.baby)
  for (let i = 0; i < state.counts.baby; i++) {
    if (!isPassengerGender(infants[i])) {
      errors[`infant${i}Gender`] = msg
    }
  }

  return errors
}

export function parsePassengerGender(raw: unknown): PassengerGender | undefined {
  if (typeof raw !== 'string') return undefined
  const g = sanitizeSingleLineText(raw, 16)
  return isPassengerGender(g) ? g : undefined
}

export function parseInfantGendersFromBody(raw: unknown): PassengerGender[] | null {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) return null
  const out: PassengerGender[] = []
  for (const item of raw) {
    const g = parsePassengerGender(item)
    if (!g) return null
    out.push(g)
  }
  return out
}

export function genderLabel(gender: PassengerGender, locale: 'tr' | 'en' | 'de' = 'tr'): string {
  if (gender === 'male') return locale === 'en' ? 'Male' : locale === 'de' ? 'Herr' : 'Bay'
  return locale === 'en' ? 'Female' : locale === 'de' ? 'Frau' : 'Bayan'
}
