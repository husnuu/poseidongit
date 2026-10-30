import { client } from '@/lib/sanity'
import { siteSettingsLogoQuery } from '@/lib/queries'

/** Site logosunun PNG'ye çevrilmiş Sanity adresi (görsel bilet üretimi için). */
export async function siteLogoPngUrl(): Promise<string | null> {
  try {
    const row = await client.fetch<{ logo?: { url?: string | null } | null } | null>(siteSettingsLogoQuery)
    const u = row?.logo?.url?.trim()
    return u ? `${u}?fm=png&h=120` : null
  } catch {
    return null
  }
}
