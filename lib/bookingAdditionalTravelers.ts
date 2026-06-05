/** Ana rezervasyon sahibi `customer` alanında; `additionalTravelers` yalnızca kalan yetişkinler + çocuklar (bebekler sayı olarak counts.infant’ta). */

import { sanitizePersonName, sanitizeSingleLineText } from '@/lib/inputSanitize'
import type { SiteLocale } from '@/lib/i18n/config'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'

export interface AdditionalTravelerName {
  firstName: string
  lastName: string
  mealPreferenceKey?: string
  gender?: 'male' | 'female' | ''
}

export function totalPaxFromCounts(counts: { adult: number; child: number; baby?: number; infant?: number }): number {
  const infant = counts.baby ?? counts.infant ?? 0
  return counts.adult + counts.child + infant
}

/** Ana kişi (ilk yetişkin) hariç, ad-soyad/yemek istenen yolcu sayısı — bebekler dahil değil. */
export function additionalTravelerSlotCount(counts: { adult: number; child: number; baby?: number; infant?: number }): number {
  return Math.max(0, counts.adult - 1) + counts.child
}

/** Form etiketleri (ilk yetişkin = ana iletişim kişisi, listede yok; bebek satırı yok). */
export function additionalTravelerLabels(
  counts: {
    adult: number
    child: number
    baby?: number
    infant?: number
  },
  locale: SiteLocale = 'tr'
): string[] {
  const ui = getBookingWizardUi(locale)
  const labels: string[] = []
  for (let i = 1; i <= counts.adult; i++) labels.push(`${ui.adult} ${i}`)
  for (let i = 1; i <= counts.child; i++) labels.push(`${ui.child} ${i}`)
  if (labels.length <= 1) return []
  return labels.slice(1)
}

export function resizeAdditionalTravelers(
  prev: AdditionalTravelerName[] | undefined,
  counts: { adult: number; child: number; baby?: number; infant?: number }
): AdditionalTravelerName[] {
  const n = additionalTravelerSlotCount(counts)
  const old = prev ?? []
  return Array.from({ length: n }, (_, i) => ({
    firstName: old[i]?.firstName ?? '',
    lastName: old[i]?.lastName ?? '',
    mealPreferenceKey: old[i]?.mealPreferenceKey ?? '',
    gender: old[i]?.gender ?? '',
  }))
}

const MAX_NAME_LEN = 80

export function validateAdditionalTravelers(
  travelers: AdditionalTravelerName[] | undefined,
  counts: { adult: number; child: number; baby?: number; infant?: number },
  options?: {
    requireMealPreference?: boolean
    messages?: { firstName: string; lastName: string; meal?: string }
  }
): Record<string, string> {
  const n = additionalTravelerSlotCount(counts)
  const list = travelers ?? []
  const errors: Record<string, string> = {}
  const m = options?.messages
  for (let i = 0; i < n; i++) {
    const t = list[i]
    if (!t?.firstName?.trim()) errors[`traveler${i}First`] = m?.firstName ?? 'Ad zorunludur.'
    if (!t?.lastName?.trim()) errors[`traveler${i}Last`] = m?.lastName ?? 'Soyad zorunludur.'
    if (options?.requireMealPreference && !t?.mealPreferenceKey?.trim()) {
      errors[`traveler${i}Meal`] = m?.meal ?? 'Yemek tercihi zorunludur.'
    }
  }
  return errors
}

export function parseAdditionalTravelersFromBody(raw: unknown): AdditionalTravelerName[] | null {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) return null
  const out: AdditionalTravelerName[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const o = item as Record<string, unknown>
    const firstName =
      typeof o.firstName === 'string' ? sanitizePersonName(o.firstName, MAX_NAME_LEN) : ''
    const lastName =
      typeof o.lastName === 'string' ? sanitizePersonName(o.lastName, MAX_NAME_LEN) : ''
    const mealPreferenceKey =
      typeof o.mealPreferenceKey === 'string'
        ? sanitizeSingleLineText(o.mealPreferenceKey, 80)
        : ''
    const genderRaw = typeof o.gender === 'string' ? sanitizeSingleLineText(o.gender, 16) : ''
    const gender = genderRaw === 'male' || genderRaw === 'female' ? genderRaw : undefined
    out.push({
      firstName,
      lastName,
      ...(mealPreferenceKey ? { mealPreferenceKey } : {}),
      ...(gender ? { gender } : {}),
    })
  }
  return out
}

/** API / e-posta için: DB’deki jsonb (camelCase veya snake_case) tek forma indirgenir. */
export type AdditionalTravelerStored = {
  firstName: string
  lastName: string
  mealPreference?: { key: string; label: string }
  gender?: 'male' | 'female'
}

function mealPairFromObject(m: Record<string, unknown>): { key: string; label: string } | undefined {
  const k = m.key != null ? String(m.key).trim() : ''
  const lbl = m.label != null ? String(m.label).trim() : ''
  if (!k || !lbl) return undefined
  return { key: k, label: lbl }
}

export function normalizeAdditionalTravelersFromStorage(raw: unknown): AdditionalTravelerStored[] {
  if (raw == null) return []
  let listRaw: unknown = raw
  if (typeof raw === 'string') {
    try {
      listRaw = JSON.parse(raw) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(listRaw)) return []
  const out: AdditionalTravelerStored[] = []
  for (const item of listRaw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const fnRaw =
      typeof o.firstName === 'string'
        ? o.firstName
        : typeof o.first_name === 'string'
          ? o.first_name
          : ''
    const lnRaw =
      typeof o.lastName === 'string'
        ? o.lastName
        : typeof o.last_name === 'string'
          ? o.last_name
          : ''
    const fn = fnRaw.trim().slice(0, MAX_NAME_LEN)
    const ln = lnRaw.trim().slice(0, MAX_NAME_LEN)
    const mpRaw = o.mealPreference ?? o.meal_preference
    let mealPreference: { key: string; label: string } | undefined
    if (mpRaw && typeof mpRaw === 'object' && !Array.isArray(mpRaw)) {
      mealPreference = mealPairFromObject(mpRaw as Record<string, unknown>)
    }
    const genderRaw = typeof o.gender === 'string' ? o.gender.trim() : ''
    const gender = genderRaw === 'male' || genderRaw === 'female' ? genderRaw : undefined
    if (!fn && !ln) continue
    out.push({
      firstName: fn,
      lastName: ln,
      ...(mealPreference ? { mealPreference } : {}),
      ...(gender ? { gender } : {}),
    })
  }
  return out
}
