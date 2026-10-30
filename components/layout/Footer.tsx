import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { footerPopularToursQuery, siteFooterQuery, siteSettingsLogoQuery } from '@/lib/queries'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import headerStyles from '@/components/layout/Header.module.css'
import { getSiteName } from '@/lib/seo'
import { DISPLAYED_GOOGLE_RATING } from '@/lib/siteTrustRating'
import type { SiteLocale } from '@/lib/i18n/config'
import { localizeNavHref } from '@/lib/i18n/localizeNavHref'
import {
  awardFallbackAlts,
  exploreLinksFallback,
  footerUi,
  legalLinksFallback,
  NUMBER_LOCALE,
  pickLocalizedString,
  pickLocalizedStringTranslated,
  pickOptionalLinkLabel,
  translateNavLabelText,
} from '@/lib/i18n/localizedLabels'
import { exploreLinksWithHelpCenter } from '@/lib/i18n/headerNavWithHelpCenter'
import FooterLegal from '@/components/layout/FooterLegal'
import type { FooterLegalData } from '@/components/layout/FooterLegal'
import InstagramModern from '@/components/icons/InstagramModern'
import {
  Youtube,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  ChevronRight,
  Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type SiteSettingsLogo = {
  siteName?: string | null
  logo?: { asset?: { _ref?: string }; url?: string; alt?: string | null } | null
} | null

type SiteFooterLegalRaw = {
  copyrightText?: string | null
  copyrightTextEn?: string | null
  copyrightTextDe?: string | null
  companyLine1?: string | null
  companyLine1En?: string | null
  companyLine1De?: string | null
  companyLine2?: string | null
  companyLine2En?: string | null
  companyLine2De?: string | null
  secure3dLabel?: string | null
  secure3dLabelEn?: string | null
  secure3dLabelDe?: string | null
  paymentLogos?: Array<{
    asset?: { _ref?: string } | null
    alt?: string | null
  }> | null
}

type SiteFooterData = {
  brandName?: string | null
  logo?: { asset?: { _ref?: string }; url?: string; alt?: string | null } | null
  topRated?: {
    enabled?: boolean
    label?: string | null
    labelEn?: string | null
    labelDe?: string | null
    ratingValue?: number | null
    ratingMax?: number | null
    reviewCount?: number | null
  } | null
  contact?: {
    email?: string | null
    phone?: string | null
    addressTitle?: string | null
    addressTitleEn?: string | null
    addressTitleDe?: string | null
    addressLines?: string[] | null
    chatTitle?: string | null
    chatTitleEn?: string | null
    chatTitleDe?: string | null
    chatValue?: string | null
    openingTitle?: string | null
    openingTitleEn?: string | null
    openingTitleDe?: string | null
    openingValue?: string | null
    openingValueEn?: string | null
    openingValueDe?: string | null
  } | null
  explore?: {
    title?: string | null
    titleEn?: string | null
    titleDe?: string | null
    links?: Array<{
      label?: string | null
      labelEn?: string | null
      labelDe?: string | null
      href?: string | null
      openInNewTab?: boolean
    }> | null
  } | null
  social?: {
    title?: string | null
    titleEn?: string | null
    titleDe?: string | null
    items?: Array<{ platform?: string | null; href?: string | null; enabled?: boolean }> | null
  } | null
  brag?: {
    enabled?: boolean | null
    title?: string | null
    titleEn?: string | null
    titleDe?: string | null
    badges?: Array<{
      type?: string | null
      enabled?: boolean
      alt?: string | null
      altEn?: string | null
      altDe?: string | null
      href?: string | null
      image?: { asset?: { _ref?: string } } | null
      imageUrl?: string | null
    }> | null
  } | null
  legalLinks?: {
    items?: Array<{
      label?: string | null
      labelEn?: string | null
      labelDe?: string | null
      href?: string | null
      enabled?: boolean
    }> | null
  } | null
  footerLegal?: SiteFooterLegalRaw | null
  craftedBy?: {
    name?: string | null
    linkedInUrl?: string | null
  } | null
}

const AWARD_IMAGES_FALLBACK_PATHS = [
  '/awards/badge1.svg',
  '/awards/badge2.svg',
  '/awards/badge3.svg',
  '/awards/badge4.svg',
]

/** Google'ın kendi marka renkleriyle "Google" yazısı — referans siteki gibi
    ikon değil, doğrudan renkli logotype metni. */
function GoogleWordmark({ className }: { className?: string }) {
  const letters: Array<[string, string]> = [
    ['G', '#4285F4'],
    ['o', '#EA4335'],
    ['o', '#FBBC05'],
    ['g', '#4285F4'],
    ['l', '#34A853'],
    ['e', '#EA4335'],
  ]
  return (
    <span className={`font-bold leading-none ${className ?? ''}`}>
      {letters.map(([ch, color], i) => (
        <span key={i} style={{ color }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

const SOCIAL_ICONS: Record<string, LucideIcon | typeof InstagramModern> = {
  instagram: InstagramModern,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Youtube,
  x: Youtube,
  linkedin: Youtube,
}

/** Üstüne gelince ikonun kendi marka rengine dönmesi için (referans site ile birebir). */
const SOCIAL_HOVER_CLASS: Record<string, string> = {
  instagram: 'hover:bg-gradient-to-br hover:from-[#feda75] hover:via-[#d62976] hover:to-[#4f5bd5]',
  youtube: 'hover:bg-[#FF0000]',
  facebook: 'hover:bg-[#1877F2]',
  tiktok: 'hover:bg-black',
  x: 'hover:bg-black',
  linkedin: 'hover:bg-[#0A66C2]',
}

async function getFooterData(): Promise<SiteFooterData | null> {
  noStore()
  try {
    return await client.fetch<SiteFooterData | null>(siteFooterQuery, {}, { useCdn: false })
  } catch {
    return null
  }
}

async function getSiteSettingsLogo(): Promise<SiteSettingsLogo> {
  noStore()
  try {
    return await client.fetch<SiteSettingsLogo>(siteSettingsLogoQuery, {}, { useCdn: false })
  } catch {
    return null
  }
}

type FooterPopularToursRaw = {
  enabled?: boolean | null
  items?: Array<{ _id: string; title?: string | null; slug?: string | null; translations?: unknown }> | null
} | null

/** Ana sayfadaki "En Popüler Turlarımız" seçkisinin aynısı — footer sütunu için. */
async function getFooterPopularTours(): Promise<FooterPopularToursRaw> {
  noStore()
  try {
    return await client.fetch<FooterPopularToursRaw>(footerPopularToursQuery, {}, { useCdn: false })
  } catch {
    return null
  }
}

/** Anasayfadaki "Sizden Gelenler" bölümüyle aynı mantık: turlardan herhangi
    birinin gerçek Google yorumları linkini al — hepsi aynı işletme profiline
    gittiği için footerdaki puan rozetini buraya yönlendirmek için kullanılır. */
async function getFooterGoogleReviewsUrl(): Promise<string | null> {
  noStore()
  try {
    const url = await client.fetch<string | null>(
      `*[_type == "tour" && defined(reviewsUrl)][0].reviewsUrl`,
      {},
      { useCdn: false }
    )
    return url ?? null
  } catch {
    return null
  }
}

const POPULAR_TOURS_TITLE: Record<SiteLocale, string> = {
  tr: 'En Popüler Turlarımız',
  en: 'Our Most Popular Tours',
  de: 'Unsere beliebtesten Touren',
  ru: 'Наши самые популярные туры',
}

/** Referans siteki "AWARD-WINNING EXPERIENCES" sütununun karşılığı — bizde
    gerçek veri olan resmi üyelik rozetlerimiz (TÜRSAB, Deniz Ticaret Odası). */
const MEMBERSHIPS_TITLE: Record<SiteLocale, string> = {
  tr: 'Yetkili Üyeliklerimiz',
  en: 'Our Certifications',
  de: 'Unsere Zertifizierungen',
  ru: 'Наши сертификаты',
}

function locHref(locale: SiteLocale, href: string | null | undefined): string {
  return localizeNavHref(locale, href)
}

async function mergeFooterLegal(raw: SiteFooterLegalRaw | null | undefined, locale: SiteLocale): Promise<FooterLegalData | null> {
  if (!raw) return null
  const pick = async (b: string | null | undefined, e: string | null | undefined, d: string | null | undefined) => {
    const v = (await pickLocalizedStringTranslated(b, e, d, locale, '')).trim()
    return v || b?.trim() || null
  }
  const [copyrightText, companyLine1, companyLine2, secure3dLabel] = await Promise.all([
    pick(raw.copyrightText, raw.copyrightTextEn, raw.copyrightTextDe),
    pick(raw.companyLine1, raw.companyLine1En, raw.companyLine1De),
    pick(raw.companyLine2, raw.companyLine2En, raw.companyLine2De),
    pick(raw.secure3dLabel, raw.secure3dLabelEn, raw.secure3dLabelDe),
  ])
  return {
    copyrightText,
    companyLine1,
    companyLine2,
    secure3dLabel,
    paymentLogos: raw.paymentLogos ?? null,
  }
}

export default async function Footer({ locale }: { locale: SiteLocale }) {
  const [data, settingsForLogo, popularToursRaw, googleReviewsUrl] = await Promise.all([
    getFooterData(),
    getSiteSettingsLogo(),
    getFooterPopularTours(),
    getFooterGoogleReviewsUrl(),
  ])
  const f = footerUi(locale)
  const numLoc = NUMBER_LOCALE[locale]

  const brandName = (data?.brandName ?? getSiteName()) || 'Site'
  const logoAsset = settingsForLogo?.logo?.asset ?? data?.logo?.asset
  const logoUrl =
    safeSanityImageUrl(logoAsset, (b) => b.width(220).height(60)) ??
    settingsForLogo?.logo?.url ??
    data?.logo?.url ??
    null
  const logoAlt =
    settingsForLogo?.logo?.alt?.trim() ||
    data?.logo?.alt?.trim() ||
    settingsForLogo?.siteName?.trim() ||
    brandName

  const topRated = data?.topRated
  const showTopRated = topRated?.enabled !== false
  const ratingMax = topRated?.ratingMax ?? 5
  const reviewCount = topRated?.reviewCount ?? 0
  const openingValueFallback: Record<SiteLocale, string> = {
    tr: 'Pazartesi - Cuma: 09:00 - 17:00',
    en: 'Monday - Friday: 09:00 - 17:00',
    de: 'Montag - Freitag: 09:00 - 17:00',
    ru: 'Понедельник - Пятница: 09:00 - 17:00',
  }
  const [topRatedLabel, chatTitle, openingTitle, openingValue, exploreTitle] = await Promise.all([
    pickLocalizedStringTranslated(topRated?.label, topRated?.labelEn, topRated?.labelDe, locale, 'TOP RATED'),
    pickLocalizedStringTranslated(
      data?.contact?.chatTitle,
      data?.contact?.chatTitleEn,
      data?.contact?.chatTitleDe,
      locale,
      'Chat With Our Team'
    ),
    pickLocalizedStringTranslated(
      data?.contact?.openingTitle,
      data?.contact?.openingTitleEn,
      data?.contact?.openingTitleDe,
      locale,
      'Opening Hours'
    ),
    pickLocalizedStringTranslated(
      data?.contact?.openingValue,
      data?.contact?.openingValueEn,
      data?.contact?.openingValueDe,
      locale,
      openingValueFallback[locale]
    ),
    pickLocalizedStringTranslated(
      data?.explore?.title,
      data?.explore?.titleEn,
      data?.explore?.titleDe,
      locale,
      locale === 'de' ? 'Entdecken' : locale === 'en' ? 'Explore' : 'Keşfet'
    ),
  ])

  const contact = data?.contact ?? {}
  const email = contact?.email ?? undefined
  const phone = contact?.phone ?? undefined
  const addressLines = contact?.addressLines ?? []
  const addressText = addressLines.filter(Boolean).join(', ') || undefined

  const exploreFromCms = (data?.explore?.links ?? []).filter((l) => l?.label && l?.href)
  const exploreLinksRaw =
    exploreFromCms.length > 0
      ? await Promise.all(
          exploreFromCms.map(async (l) => ({
            href: l.href as string,
            label:
              (locale === 'en' && l.labelEn?.trim()) || (locale === 'de' && l.labelDe?.trim())
                ? pickOptionalLinkLabel(l, locale)
                : await translateNavLabelText(l.label, locale),
            openInNewTab: l.openInNewTab === true,
          }))
        )
      : exploreLinksFallback(locale)
  const exploreLinks = exploreLinksWithHelpCenter(locale, exploreLinksRaw)

  // Footer "En Popüler Turlarımız": ana sayfadaki seçkinin aynısı, başlıklar
  // ana sayfadaki gibi yerelleştirilir (elle çeviri varsa o, yoksa anlık çeviri).
  const popularTourLinks =
    popularToursRaw?.enabled === false
      ? []
      : await Promise.all(
          (popularToursRaw?.items ?? [])
            .filter((t) => t && t.slug && t.title)
            .map(async (t) => {
              const raw = t as unknown as Record<string, unknown>
              const merged = mergeTourForLocale(raw, locale) as unknown as { title?: string | null; slug?: string | null }
              const title = tourFieldHasManualTranslation(raw, locale, 'title')
                ? merged.title
                : await translateText(merged.title, locale)
              return { href: `/tur/${t.slug}`, label: (title || merged.title || t.title || '').trim() }
            })
        )

  const socialItems =
    data?.social?.items?.filter((i) => i?.enabled !== false && i?.href) ?? []

  const showBragSection = data?.brag?.enabled !== false
  const bragTitle = await pickLocalizedStringTranslated(
    data?.brag?.title,
    data?.brag?.titleEn,
    data?.brag?.titleDe,
    locale,
    'Not to brag, but…'
  )
  const bragBadges = data?.brag?.badges?.filter((b) => b?.enabled !== false) ?? []
  const hasBragImages = bragBadges.some((b) => b?.image?.asset || b?.imageUrl)
  const awardAlts = awardFallbackAlts(locale)
  const awardImages = hasBragImages
    ? await Promise.all(
        bragBadges.map(async (b) => ({
          src:
            safeSanityImageUrl(b?.image?.asset ?? null, (img) => img.width(80).height(80)) ??
            b?.imageUrl ??
            '',
          alt: await pickLocalizedStringTranslated(b?.alt, b?.altEn, b?.altDe, locale, 'Badge'),
          href: b?.href,
        }))
      )
    : AWARD_IMAGES_FALLBACK_PATHS.map((src, i) => ({
        src,
        alt: awardAlts[i] ?? `Award ${i + 1}`,
        href: undefined as string | undefined,
      }))

  const legalFromCms =
    data?.legalLinks?.items?.filter((l) => l?.enabled !== false && l?.label && l?.href) ?? []
  const legalLinks =
    legalFromCms.length > 0
      ? await Promise.all(
          legalFromCms.map(async (l) => ({
            href: l.href as string,
            label:
              (locale === 'en' && l.labelEn?.trim()) || (locale === 'de' && l.labelDe?.trim())
                ? pickOptionalLinkLabel(l, locale)
                : await translateNavLabelText(l.label, locale),
          }))
        )
      : legalLinksFallback(locale)

  const footerLegalMerged = await mergeFooterLegal(data?.footerLegal ?? null, locale)

  return (
    <footer
      className="text-white print:hidden"
      style={{
        background: 'linear-gradient(to left, var(--primary, #2168b8), #373b44)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 md:px-8 md:py-20 lg:px-10 xl:px-12">
        <div
          className={`grid gap-14 lg:grid-cols-2 lg:gap-x-16 xl:grid-cols-4 xl:gap-x-20`}
        >
          <div className="space-y-7">
            <Link
              href={locHref(locale, '/')}
              className={headerStyles.logoLink}
              prefetch={false}
              aria-label={f.home}
            >
              <div className={headerStyles.logoWrapper}>
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={logoAlt}
                    width={220}
                    height={55}
                    className={`${headerStyles.logoImage} ${headerStyles.logoImageOnDark}`}
                  />
                ) : (
                  <span className="text-2xl font-black tracking-tight text-white">{brandName}</span>
                )}
              </div>
            </Link>
            {showTopRated && (
              <div className="space-y-4">
                <span
                  className="inline-flex w-fit items-center justify-center bg-white py-1 px-6 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%)',
                    color: 'var(--primary, #2168b8)',
                  }}
                >
                  {topRatedLabel}
                </span>
                <div>
                  {(() => {
                    const ratingRowInner = (
                      <>
                        <GoogleWordmark className="text-xl leading-none" />
                        <span className="h-4 w-px flex-shrink-0 bg-white/30" aria-hidden />
                        {/* Sanity'deki topRated.ratingValue alanı şu an 5 — bkz. lib/siteTrustRating.ts */}
                        <span className="text-base font-bold leading-none text-white">
                          {DISPLAYED_GOOGLE_RATING}
                        </span>
                        {reviewCount > 0 && (
                          <>
                            <span className="h-4 w-px flex-shrink-0 bg-white/30" aria-hidden />
                            <span className="text-sm font-medium leading-none text-white/85">
                              {f.reviews(reviewCount.toLocaleString(numLoc))}
                            </span>
                          </>
                        )}
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/70" aria-hidden />
                      </>
                    )
                    return googleReviewsUrl ? (
                      <a
                        href={googleReviewsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-fit items-center gap-2.5"
                        aria-label={f.reviews(reviewCount.toLocaleString(numLoc))}
                      >
                        {ratingRowInner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2.5">{ratingRowInner}</div>
                    )
                  })()}
                  <div className="mt-1.5 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-y-4">
              <div className="max-w-[320px] space-y-4 text-left">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="group flex items-start gap-3 text-sm font-medium text-white transition-colors"
                  >
                    <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span className="relative inline-block after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 group-hover:after:scale-x-100">
                      {email}
                    </span>
                  </a>
                )}
                {addressText && (
                  <div className="flex items-start gap-3 text-sm font-medium text-white">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>{addressText}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4 text-left">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="group flex items-center gap-3 text-sm font-medium text-white transition-colors"
                  >
                    <Phone className="h-5 w-5 flex-shrink-0" />
                    <span className="relative inline-block whitespace-nowrap after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 group-hover:after:scale-x-100">
                      {chatTitle}
                    </span>
                  </a>
                )}
                <div className="flex items-start gap-3 text-sm font-medium text-white">
                  <span className="text-white/85">{openingTitle}:</span>
                  <span>{openingValue}</span>
                </div>
              </div>
            </div>
            {socialItems.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4">
                {socialItems.map((item, index) => {
                  const platform = (item?.platform ?? '').toLowerCase()
                  const Icon = SOCIAL_ICONS[platform] ?? InstagramModern
                  const href = item?.href ?? '#'
                  const label = item?.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : 'Social'
                  return (
                    <a
                      key={`${platform}-${index}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-white/40 bg-transparent bg-clip-padding text-white transition-all duration-200 hover:scale-110 hover:border-transparent ${SOCIAL_HOVER_CLASS[platform] ?? 'hover:bg-white/15'}`}
                      aria-label={label}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c1220] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100">
                        {label}
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {popularTourLinks.length > 0 && (
            <div>
              <h2 className="mb-6 text-xl font-black uppercase tracking-wide text-white md:text-2xl lg:whitespace-nowrap">
                {POPULAR_TOURS_TITLE[locale]}
              </h2>
              <ul className="space-y-4">
                {popularTourLinks.map((item) => (
                  <li key={item.href} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/70" aria-hidden />
                    <Link
                      href={locHref(locale, item.href)}
                      className={`${headerStyles.footerLink} text-sm font-medium text-white transition-colors duration-200 hover:text-white/75`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lg:pl-6 xl:pl-10">
            <h2 className="mb-6 text-xl font-black uppercase tracking-wide text-white md:text-2xl">
              {exploreTitle}
            </h2>
            <ul className="space-y-4">
              {exploreLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    href={locHref(locale, item.href || '#')}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors duration-200 hover:text-white"
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 flex-shrink-0 -translate-x-2 text-[var(--primary,#2168b8)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="relative inline-block transition-transform duration-200 after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 group-hover:translate-x-0.5 group-hover:after:scale-x-100">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {showBragSection ? (
            <div>
              <h2 className="mb-6 text-xl font-black uppercase tracking-wide text-white md:text-2xl">
                {bragTitle}
              </h2>
              <div className="grid grid-cols-2 gap-5">
                {awardImages.map((item, index) => {
                  const content = (
                    <div
                      key={index}
                      className="flex items-center justify-center rounded-xl bg-white/10 p-4"
                    >
                      {item.src ? (
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={80}
                          height={80}
                          className="h-20 w-20 object-contain"
                        />
                      ) : (
                        <span className="h-20 w-20" />
                      )}
                    </div>
                  )
                  const linkHref =
                    item.href && typeof item.href === 'string' ? item.href : null
                  return linkHref ? (
                    <a key={index} href={linkHref} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  ) : (
                    <div key={index}>{content}</div>
                  )
                })}
              </div>
            </div>
          ) : null}
          <div>
            <h2 className="mb-6 text-xl font-black uppercase tracking-wide text-white md:text-2xl">
              {MEMBERSHIPS_TITLE[locale]}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://www.tursab.org.tr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TÜRSAB"
                className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-white/10 p-5 text-center transition-colors hover:bg-white/15"
              >
                <ExternalLink
                  aria-hidden
                  className="absolute right-3 top-3 h-3.5 w-3.5 text-white/70 transition-colors group-hover:text-white/85"
                />
                <Image
                  src="/memberships/tursab.png"
                  alt="TÜRSAB"
                  width={200}
                  height={50}
                  className="h-10 w-auto object-contain brightness-0 invert opacity-70"
                />
                <span className="relative inline-block text-xs font-semibold uppercase leading-snug tracking-wide text-white after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 group-hover:after:scale-x-100">
                  TÜRSAB Üyesi
                </span>
              </a>
              <a
                href="https://www.denizticaretodasi.org.tr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="İMEAK Deniz Ticaret Odası"
                className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-white/10 p-5 text-center transition-colors hover:bg-white/15"
              >
                <ExternalLink
                  aria-hidden
                  className="absolute right-3 top-3 h-3.5 w-3.5 text-white/70 transition-colors group-hover:text-white/85"
                />
                <Image
                  src="/memberships/imeak-deniz-ticaret-odasi.png"
                  alt="İMEAK Deniz Ticaret Odası"
                  width={396}
                  height={80}
                  className="h-9 w-auto object-contain brightness-0 invert opacity-70"
                />
                <span className="relative inline-block text-xs font-semibold uppercase leading-snug tracking-wide text-white after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 group-hover:after:scale-x-100">
                  Deniz Ticaret Odası Üyesi
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {data?.footerLegal && footerLegalMerged && (
              <FooterLegal data={footerLegalMerged} inline regionAriaLabel={f.legalRegion} />
            )}
            <div
              className={`flex flex-wrap gap-x-12 gap-y-4 text-xs font-semibold text-white ${data?.footerLegal ? 'justify-center md:justify-end' : 'justify-center'}`}
            >
              {legalLinks.map((item, index) => (
                <Link
                  key={index}
                  href={locHref(locale, item.href || '#')}
                  className={`${headerStyles.footerLink} transition-colors hover:text-white`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {data?.craftedBy?.name && (
            <div className="mt-6 border-t border-white/15 pt-6 text-center text-sm font-medium text-white/85">
              {f.craftedByPrefix}{' '}
              {data.craftedBy.linkedInUrl ? (
                <a
                  href={data.craftedBy.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline transition-colors hover:text-white"
                >
                  {data.craftedBy.name}
                </a>
              ) : (
                <span className="text-white">{data.craftedBy.name}</span>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-white/70">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 fill-current text-rose-500" aria-hidden />
            <span>in İyidere, Rize</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
