import { client } from '@/lib/sanity'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

export default async function WhatsAppFloatButtonRoot() {
  let whatsapp: string | null | undefined
  try {
    const row = await client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery)
    whatsapp = row?.whatsapp?.trim() || undefined
  } catch {
    whatsapp = undefined
  }
  const href = buildWhatsAppHref(whatsapp ?? null)
  if (!href) return null
  return <WhatsAppFloatButton href={href} />
}
