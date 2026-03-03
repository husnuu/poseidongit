/**
 * Server-side (and pure) helper to resolve capacity per class for a given date.
 * Uses Sanity tour shape: baseCapacity + availabilityOverrides.
 * Override for the date takes precedence over baseCapacity.
 */

export type TourCapacitySource = {
  baseCapacity?: {
    ecoCapacity?: number
    premiumCapacity?: number
    firstCapacity?: number
  } | null
  availabilityOverrides?: Array<{
    date?: string | null
    eco?: number
    premium?: number
    first?: number
  }> | null
}

const CLASS_KEYS = ['eco', 'premium', 'first'] as const

/**
 * Returns capacity per classId for the given date.
 * Uses availabilityOverrides for that date if present, else baseCapacity.
 * Date comparison uses YYYY-MM-DD (first 10 chars).
 */
export function computeCapacityForDate(
  tour: TourCapacitySource | null | undefined,
  dateStr: string
): Record<string, number> {
  const dateNorm = (dateStr || '').slice(0, 10)
  const base = tour?.baseCapacity
  const override = tour?.availabilityOverrides?.find(
    (o) => (o.date || '').slice(0, 10) === dateNorm
  )
  const result: Record<string, number> = {}
  for (const k of CLASS_KEYS) {
    const baseKey = k === 'eco' ? 'ecoCapacity' : k === 'premium' ? 'premiumCapacity' : 'firstCapacity'
    const baseVal = base?.[baseKey as keyof typeof base]
    const overrideVal = override?.[k]
    const capacity = overrideVal ?? baseVal ?? 0
    result[k] = Math.max(0, Number(capacity) || 0)
  }
  return result
}
