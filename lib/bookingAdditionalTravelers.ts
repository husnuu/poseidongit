/** Ana rezervasyon sahibi `customer` alanında; `additionalTravelers` yalnızca kalan yetişkinler + çocuklar (bebekler sayı olarak counts.infant’ta). */

export interface AdditionalTravelerName {
  firstName: string
  lastName: string
  mealPreferenceKey?: string
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
export function additionalTravelerLabels(counts: {
  adult: number
  child: number
  baby?: number
  infant?: number
}): string[] {
  const labels: string[] = []
  for (let i = 1; i <= counts.adult; i++) labels.push(`Yetişkin ${i}`)
  for (let i = 1; i <= counts.child; i++) labels.push(`Çocuk ${i}`)
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
  }))
}

const MAX_NAME_LEN = 80

export function validateAdditionalTravelers(
  travelers: AdditionalTravelerName[] | undefined,
  counts: { adult: number; child: number; baby?: number; infant?: number },
  options?: { requireMealPreference?: boolean }
): Record<string, string> {
  const n = additionalTravelerSlotCount(counts)
  const list = travelers ?? []
  const errors: Record<string, string> = {}
  for (let i = 0; i < n; i++) {
    const t = list[i]
    if (!t?.firstName?.trim()) errors[`traveler${i}First`] = 'Ad zorunludur.'
    if (!t?.lastName?.trim()) errors[`traveler${i}Last`] = 'Soyad zorunludur.'
    if (options?.requireMealPreference && !t?.mealPreferenceKey?.trim()) {
      errors[`traveler${i}Meal`] = 'Yemek tercihi zorunludur.'
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
    const firstName = typeof o.firstName === 'string' ? o.firstName.trim().slice(0, MAX_NAME_LEN) : ''
    const lastName = typeof o.lastName === 'string' ? o.lastName.trim().slice(0, MAX_NAME_LEN) : ''
    const mealPreferenceKey =
      typeof o.mealPreferenceKey === 'string' ? o.mealPreferenceKey.trim().slice(0, 80) : ''
    out.push({ firstName, lastName, ...(mealPreferenceKey ? { mealPreferenceKey } : {}) })
  }
  return out
}
