function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Deep-merge `patch` over `base`. Arrays from patch replace when non-empty.
 * Skips patch keys that are null, undefined, or (for strings) empty after trim.
 */
export function mergeDeep<T extends Record<string, unknown>>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch) return base
  const out = { ...base } as Record<string, unknown>
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[key] as unknown
    if (pv === undefined || pv === null) continue
    if (typeof pv === 'string' && pv.trim() === '') continue
    const bv = base[key] as unknown
    if (Array.isArray(pv)) {
      if (pv.length > 0) out[key as string] = pv
      continue
    }
    if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key as string] = mergeDeep(bv, pv as Record<string, unknown>)
      continue
    }
    out[key as string] = pv
  }
  return out as T
}
