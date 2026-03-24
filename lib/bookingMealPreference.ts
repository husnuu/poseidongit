import { client } from '@/lib/sanity'

export interface StoredMealPreference {
  key: string
  label: string
}

type MealMenuRow = {
  mealMenu?: {
    enabled?: boolean
    options?: Array<{ key?: string; label?: string }>
  }
} | null

const mealMenuQuery = `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{
  mealMenu{
    enabled,
    options[]{ key, label }
  }
}`

async function fetchMealMenuState(tourSanityId: string): Promise<{
  menuActive: boolean
  options: Array<{ key: string; label: string }>
}> {
  const row = await client.fetch<MealMenuRow>(mealMenuQuery, { id: tourSanityId })
  const mm = row?.mealMenu
  const opts = (mm?.options ?? [])
    .filter((o) => o.key?.trim() && o.label?.trim())
    .map((o) => ({ key: o.key!.trim(), label: o.label!.trim() }))
  return { menuActive: Boolean(mm?.enabled && opts.length > 0), options: opts }
}

/**
 * Web / manuel rezervasyon: Sanity’deki mealMenu ile istemci key’ini doğrular.
 * Menü kapalıyken key gönderilirse hata; açıkken key zorunlu ve seçeneklerden biri olmalı.
 */
export async function resolveMealPreferenceForBooking(
  tourSanityId: string,
  clientKey: string | undefined
): Promise<
  | { ok: true; stored: StoredMealPreference | undefined }
  | { ok: false; message: string }
> {
  const { menuActive, options: opts } = await fetchMealMenuState(tourSanityId)

  if (!menuActive) {
    if (clientKey?.trim()) {
      return { ok: false, message: 'Bu tur için yemek menüsü tanımlı değil.' }
    }
    return { ok: true, stored: undefined }
  }

  const k = clientKey?.trim()
  if (!k) {
    return { ok: false, message: 'Yemek tercihi seçimi zorunludur.' }
  }
  const opt = opts.find((o) => o.key!.trim() === k)
  if (!opt) {
    return { ok: false, message: 'Geçersiz yemek tercihi.' }
  }
  return {
    ok: true,
    stored: { key: opt.key.trim(), label: opt.label.trim() },
  }
}

export async function resolveAdditionalTravelerMealPreferencesForBooking(
  tourSanityId: string,
  travelers: Array<{ mealPreferenceKey?: string }>
): Promise<
  | { ok: true; stored: Array<{ key: string; label: string } | undefined> }
  | { ok: false; message: string }
> {
  const { menuActive, options } = await fetchMealMenuState(tourSanityId)
  if (!menuActive) {
    return { ok: true, stored: travelers.map(() => undefined) }
  }
  const resolved: Array<{ key: string; label: string } | undefined> = []
  for (let i = 0; i < travelers.length; i++) {
    const k = travelers[i]?.mealPreferenceKey?.trim()
    if (!k) return { ok: false, message: `${i + 2}. yolcu için yemek tercihi zorunludur.` }
    const opt = options.find((o) => o.key === k)
    if (!opt) return { ok: false, message: `${i + 2}. yolcu için geçersiz yemek tercihi.` }
    resolved.push({ key: opt.key, label: opt.label })
  }
  return { ok: true, stored: resolved }
}
