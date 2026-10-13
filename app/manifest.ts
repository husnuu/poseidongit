import type { MetadataRoute } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'

export const revalidate = 3600

/**
 * PWA/tarayıcı manifesti yoktu (bkz. SEO denetimi) — Next bu dosyayı otomatik
 * /manifest.webmanifest olarak sunar ve <head>'e kendi link etiketini ekler.
 * İkon: Sanity'deki gerçek favicon görseli büyük boyutlarda yeniden
 * boyutlandırılıyor — uydurma bir logo dosyası eklenmedi.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteName = getSiteName() || 'Poseidon'

  let icons: MetadataRoute.Manifest['icons'] = []
  try {
    const settings = await client.fetch<{ favicon?: { asset?: { _ref?: string } } | null } | null>(
      siteSettingsQuery
    )
    if (settings?.favicon?.asset) {
      icons = [
        { src: urlFor(settings.favicon.asset).width(192).height(192).url(), sizes: '192x192', type: 'image/png' },
        { src: urlFor(settings.favicon.asset).width(512).height(512).url(), sizes: '512x512', type: 'image/png' },
      ]
    }
  } catch {
    icons = []
  }

  return {
    name: siteName,
    short_name: siteName,
    description: 'Çeşme tekne turları ve yat kiralama — online rezervasyon.',
    start_url: '/',
    display: 'standalone',
    // Poseidon ana marka rengi — admin panelinde ve tüm CTA'larda kullanılan
    // gerçek --primary değeri (app/globals.css).
    background_color: '#ffffff',
    theme_color: '#2168b8',
    icons,
  }
}
