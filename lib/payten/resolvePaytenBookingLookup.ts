import { supabase } from '@/lib/supabase'

export { extractPaytenOrderLookupTokenFromPostRecord, isSafePaytenOrderLookupToken } from '@/lib/payten/paytenOrderToken'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function expandPaytenOrderCandidates(raw: string): string[] {
  const t = raw.trim()
  if (!t) return []
  const out: string[] = []
  const seen = new Set<string>()
  const push = (s: string) => {
    const x = s.trim()
    if (!x || seen.has(x)) return
    seen.add(x)
    out.push(x)
  }
  push(t)
  push(t.toLowerCase())
  push(t.toUpperCase())
  const hexOnly = t.replace(/-/g, '')
  if (/^[0-9a-f]{32}$/i.test(hexOnly)) {
    const dashed = `${hexOnly.slice(0, 8)}-${hexOnly.slice(8, 12)}-${hexOnly.slice(12, 16)}-${hexOnly.slice(16, 20)}-${hexOnly.slice(20, 32)}`.toLowerCase()
    push(dashed)
  }
  return out
}

async function lookupSinglePaytenOrderField(raw: string): Promise<string | null> {
  const candidates = expandPaytenOrderCandidates(raw)
  for (const c of candidates) {
    if (UUID_REGEX.test(c)) {
      const { data, error } = await supabase.from('bookings').select('id').eq('id', c).maybeSingle()
      if (!error && data?.id) return data.id
    }
  }
  for (const c of candidates) {
    const ref = c.trim()
    if (!ref || ref.length > 80) continue
    if (UUID_REGEX.test(ref)) continue
    const variants = ref === ref.toUpperCase() ? [ref] : [ref, ref.toUpperCase()]
    for (const v of variants) {
      const { data, error } = await supabase.from('bookings').select('id').eq('reference', v).maybeSingle()
      if (!error && data?.id) return data.id
    }
  }
  return null
}

/**
 * NestPay `oid` / `ReturnOid` → Supabase `bookings.id` (UUID).
 * - UUID (tireli veya 32 hex) ile doğrudan eşleşme
 * - `reference` kolonu ile eşleşme (manuel rezervasyon kodları vb.)
 * - İki alan doluysa ve farklı rezervasyona çözülüyorsa `null` (güvenlik)
 */
export async function resolveSupabaseBookingIdFromPaytenOrderFields(
  oid: string,
  returnOid: string
): Promise<string | null> {
  const o = oid.trim()
  const r = returnOid.trim()
  if (!o && !r) return null

  const idFromOid = o ? await lookupSinglePaytenOrderField(o) : null
  const idFromReturn = r ? await lookupSinglePaytenOrderField(r) : null

  if (idFromOid && idFromReturn && idFromOid !== idFromReturn) {
    console.warn('[payten:resolve] oid ve ReturnOid farklı rezervasyonlara çözüldü', {
      idFromOid,
      idFromReturn,
    })
    return null
  }

  return idFromOid ?? idFromReturn ?? null
}
