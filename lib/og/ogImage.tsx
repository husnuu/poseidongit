import { ImageResponse } from 'next/og'
import { client, urlFor } from '@/lib/sanity'
import { siteSettingsLogoQuery } from '@/lib/queries'
import type { SiteLocale } from '@/lib/i18n/config'
import { loadSatoriFonts, SATORI_FONT_FAMILY, toDataUrl } from './satoriAssets'

/**
 * Kendi kapak görseli olmayan sayfalar için markalı sosyal paylaşım görseli
 * (og:image / twitter:image), 1200×630. Arka planda ana sayfa hero
 * fotoğrafı, üstünde logo + sayfa başlığı. WhatsApp, Facebook, X ve
 * LinkedIn önizlemeleri ile Google Discover bu görseli kullanır.
 */

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

const NAVY = '#0b2a55'

const TAGLINE: Record<SiteLocale, string> = {
  tr: 'Çeşme tekne turları · Online bilet',
  en: 'Çeşme boat tours · Online tickets',
  de: 'Çeşme Bootstouren · Online-Tickets',
  ru: 'Морские прогулки в Чешме · Онлайн-билеты',
}

type OgBrandAssets = { logo: string | null; photo: string | null }
let assetsPromise: Promise<OgBrandAssets> | null = null
let assetsLoadedAt = 0
const ASSET_TTL_MS = 60 * 60 * 1000

/** Logo + hero fotoğrafı; Sanity'de değişirse en geç bir saat içinde yenilenir. */
function loadBrandAssets(): Promise<OgBrandAssets> {
  if (!assetsPromise || Date.now() - assetsLoadedAt > ASSET_TTL_MS) {
    assetsLoadedAt = Date.now()
    assetsPromise = (async () => {
      const [logoRow, heroRow] = await Promise.all([
        client.fetch<{ logo?: { url?: string | null } | null } | null>(siteSettingsLogoQuery).catch(() => null),
        client
          .fetch<{ asset?: { _ref?: string } } | null>(`*[_type == "homePage"][0].hero.heroImage`)
          .catch(() => null),
      ])
      const logoUrl = logoRow?.logo?.url?.trim()
      const photoUrl = heroRow?.asset
        ? urlFor(heroRow.asset).width(OG_WIDTH).height(OG_HEIGHT).fit('crop').format('jpg').quality(80).url()
        : null
      const [logo, photo] = await Promise.all([
        toDataUrl(logoUrl ? `${logoUrl}?fm=png&h=120` : null),
        toDataUrl(photoUrl),
      ])
      return { logo, photo }
    })()
  }
  return assetsPromise
}

/** Başlık uzunluğuna göre punto — 3 satırı geçmesin. */
function titleFontSize(title: string): number {
  const n = title.length
  if (n <= 28) return 76
  if (n <= 45) return 66
  if (n <= 70) return 56
  return 46
}

export async function renderOgImage(input: {
  title: string
  kicker?: string
  locale: SiteLocale
}): Promise<ImageResponse> {
  const [fonts, { logo, photo }] = await Promise.all([loadSatoriFonts(), loadBrandAssets()])
  const tag = input.locale === 'tr' ? 'tr-TR' : input.locale === 'de' ? 'de-DE' : input.locale === 'ru' ? 'ru-RU' : 'en-GB'
  const kicker = input.kicker?.trim().toLocaleUpperCase(tag)

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: 'flex',
          position: 'relative',
          background: `linear-gradient(135deg, ${NAVY} 0%, #2168b8 100%)`,
          fontFamily: SATORI_FONT_FAMILY,
          color: '#ffffff',
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={OG_WIDTH}
            height={OG_HEIGHT}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: OG_WIDTH, height: OG_HEIGHT, objectFit: 'cover' }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            display: 'flex',
            backgroundImage:
              'linear-gradient(90deg, rgba(8,28,58,0.92) 0%, rgba(8,28,58,0.78) 45%, rgba(8,28,58,0.25) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '56px 72px 52px',
          }}
        >
          <div style={{ display: 'flex' }}>
            {logo ? (
              <div style={{ display: 'flex', background: '#ffffff', borderRadius: 18, padding: '12px 22px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} height={48} style={{ height: 48 }} alt="" />
              </div>
            ) : (
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>POSEIDON</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
            {kicker ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: 4,
                  color: '#9cc9f5',
                  marginBottom: 18,
                }}
              >
                {kicker}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                fontSize: titleFontSize(input.title),
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              {input.title}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 26,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
            }}
          >
            <div style={{ display: 'flex' }}>{TAGLINE[input.locale] ?? TAGLINE.tr}</div>
            <div style={{ display: 'flex', fontWeight: 800, color: '#ffffff' }}>cesmetekneturu.net</div>
          </div>
        </div>
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT, fonts }
  )
}
