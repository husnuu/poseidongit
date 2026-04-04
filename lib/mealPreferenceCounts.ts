export type MealPreferenceCount = {
  key: string
  label: string
  count: number
}

function normalizeKey(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeLabel(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export function normalizeMealPreferenceCounts(input: unknown): MealPreferenceCount[] {
  if (!Array.isArray(input)) return []
  const out: MealPreferenceCount[] = []
  for (const row of input) {
    if (!row || typeof row !== 'object') continue
    const rec = row as Record<string, unknown>
    const key = normalizeKey(rec.key)
    const label = normalizeLabel(rec.label)
    const count = Math.max(0, Number(rec.count) || 0)
    if (!key || !label || count <= 0) continue
    out.push({ key, label, count })
  }
  return out
}

function addCount(map: Map<string, MealPreferenceCount>, key: string, label: string, count: number): void {
  if (!key || !label || count <= 0) return
  const curr = map.get(key)
  if (curr) {
    curr.count += count
    return
  }
  map.set(key, { key, label, count })
}

export function extractMealPreferenceCountsFromBookingLike(payload: {
  counts?: { adult?: number; child?: number; infant?: number }
  mealPreference?: unknown
  additionalTravelers?: unknown
}): MealPreferenceCount[] {
  const pref = payload.mealPreference
  if (pref && typeof pref === 'object') {
    const rec = pref as Record<string, unknown>
    const explicit = normalizeMealPreferenceCounts(rec.counts)
    if (explicit.length > 0) return explicit
  }

  const map = new Map<string, MealPreferenceCount>()
  const totalPax =
    Math.max(0, Number(payload.counts?.adult ?? 0) || 0) +
    Math.max(0, Number(payload.counts?.child ?? 0) || 0) +
    Math.max(0, Number(payload.counts?.infant ?? 0) || 0)

  if (pref && typeof pref === 'object') {
    const rec = pref as Record<string, unknown>
    const key = normalizeKey(rec.key)
    const label = normalizeLabel(rec.label)
    if (key && label) addCount(map, key, label, 1)
  }

  if (Array.isArray(payload.additionalTravelers)) {
    for (const t of payload.additionalTravelers) {
      if (!t || typeof t !== 'object') continue
      const row = t as Record<string, unknown>
      const mp = row.mealPreference
      if (!mp || typeof mp !== 'object') continue
      const mpr = mp as Record<string, unknown>
      const key = normalizeKey(mpr.key)
      const label = normalizeLabel(mpr.label)
      if (key && label) addCount(map, key, label, 1)
    }
  }

  const arr = [...map.values()]
  const counted = arr.reduce((sum, x) => sum + x.count, 0)
  if (counted > totalPax && totalPax > 0) {
    return arr
      .map((x) => ({ ...x }))
      .sort((a, b) => b.count - a.count)
      .map((x, idx, src) => {
        if (idx !== src.length - 1) return x
        return { ...x, count: Math.max(0, x.count - (counted - totalPax)) }
      })
      .filter((x) => x.count > 0)
  }
  return arr
}

