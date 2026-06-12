export function parseMissingColumnFromSupabaseError(
  message: string,
  table = 'bookings'
): string | null {
  const m = message.match(new RegExp(`Could not find the '([^']+)' column of '${table}'`, 'i'))
  if (m?.[1]) return m[1]
  const m2 = message.match(
    new RegExp(`column\\s+"([^"]+)"\\s+of\\s+relation\\s+"${table}"\\s+does not exist`, 'i')
  )
  return m2?.[1] ?? null
}

/** Eksik kolon hatasında ilgili alanı düşürüp tekrar dener (şema sürüm farkları). */
export async function insertBookingWithColumnFallback(
  insert: (payload: Record<string, unknown>) => Promise<{ data: { id: string } | null; error: { message: string } | null }>,
  payload: Record<string, unknown>
): Promise<{ id: string }> {
  let mutable = { ...payload }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await insert(mutable)
    if (!error && data?.id) return data
    if (error) {
      const missingColumn = parseMissingColumnFromSupabaseError(error.message)
      if (missingColumn && Object.prototype.hasOwnProperty.call(mutable, missingColumn)) {
        delete mutable[missingColumn]
        continue
      }
      throw new Error(error.message)
    }
    throw new Error('No id returned')
  }
  throw new Error('Insert failed after column fallback retries')
}
