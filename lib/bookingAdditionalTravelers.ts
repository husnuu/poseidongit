/** Ana rezervasyon sahibi `customer` alanında; diğer yolcular bu sırayla: kalan yetişkinler, çocuklar, bebekler. */

export interface AdditionalTravelerName {
  firstName: string
  lastName: string
}

export function totalPaxFromCounts(counts: { adult: number; child: number; baby?: number; infant?: number }): number {
  const infant = counts.baby ?? counts.infant ?? 0
  return counts.adult + counts.child + infant
}

/** Ana kişi hariç doldurulması gereken yolcu sayısı. */
export function additionalTravelerSlotCount(counts: { adult: number; child: number; baby?: number; infant?: number }): number {
  return Math.max(0, totalPaxFromCounts(counts) - 1)
}

/** Form etiketleri (ilk yetişkin = ana iletişim kişisi, listede yok). */
export function additionalTravelerLabels(counts: {
  adult: number
  child: number
  baby?: number
  infant?: number
}): string[] {
  const infant = counts.baby ?? counts.infant ?? 0
  const labels: string[] = []
  for (let i = 1; i <= counts.adult; i++) labels.push(`Yetişkin ${i}`)
  for (let i = 1; i <= counts.child; i++) labels.push(`Çocuk ${i}`)
  for (let i = 1; i <= infant; i++) labels.push(`Bebek ${i}`)
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
  }))
}

const MAX_NAME_LEN = 80

export function validateAdditionalTravelers(
  travelers: AdditionalTravelerName[] | undefined,
  counts: { adult: number; child: number; baby?: number; infant?: number }
): Record<string, string> {
  const n = additionalTravelerSlotCount(counts)
  const list = travelers ?? []
  const errors: Record<string, string> = {}
  for (let i = 0; i < n; i++) {
    const t = list[i]
    if (!t?.firstName?.trim()) errors[`traveler${i}First`] = 'Ad zorunludur.'
    if (!t?.lastName?.trim()) errors[`traveler${i}Last`] = 'Soyad zorunludur.'
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
    out.push({ firstName, lastName })
  }
  return out
}
