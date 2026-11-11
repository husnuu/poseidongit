import { client } from '@/lib/sanity'

/**
 * Footer'da gösterilen sosyal medya profilleri (Sanity → siteFooter.social) —
 * işletme şemasının sameAs listesi sayfada görünen bağlantılarla aynı olsun diye.
 * Studio'da yeni bir hesap eklenince şemaya da kendiliğinden girer.
 */
export async function getFooterSocialProfileUrls(): Promise<string[]> {
  try {
    const hrefs = await client.fetch<(string | null)[] | null>(
      `*[_type == "siteFooter"][0].social.items[enabled != false].href`
    )
    return (hrefs ?? []).filter((h): h is string => typeof h === 'string' && /^https?:\/\//i.test(h.trim()))
  } catch {
    return []
  }
}
