import { client, urlFor } from '@/lib/sanity'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import { isChatbotEnabled } from '@/lib/chatbot/config'
import ChatWidget from './ChatWidget'

/** Pencerenin avatarı ve karşılama fotoğrafı: en popüler turun kapak fotoğrafı. */
const CHAT_PHOTO_QUERY = `*[_type == "tour" && defined(mainImage.asset) && !(_id in path("drafts.**"))]
  | order(coalesce(isPopular, false) desc, _updatedAt desc)[0].mainImage.asset`

/** ANTHROPIC_API_KEY tanımlı değilse (veya CHATBOT_DISABLED) hiçbir şey çizilmez. */
export default async function ChatWidgetRoot() {
  if (!isChatbotEnabled()) return null
  const [waRow, photo] = await Promise.all([
    client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery).catch(() => null),
    client.fetch<unknown>(CHAT_PHOTO_QUERY).catch(() => null),
  ])
  const img = (w: number, h: number) =>
    photo ? urlFor(photo as Parameters<typeof urlFor>[0]).width(w).height(h).fit('crop').auto('format').url() : null
  return (
    <ChatWidget
      whatsappHref={buildWhatsAppHref(waRow?.whatsapp?.trim() || null)}
      avatarUrl={img(96, 96)}
      heroUrl={img(820, 420)}
    />
  )
}
