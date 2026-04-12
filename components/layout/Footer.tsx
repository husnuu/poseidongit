import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { siteFooterQuery, siteSettingsLogoQuery } from '@/lib/queries'
import headerStyles from '@/components/layout/Header.module.css'
import { getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { localizeNavHref } from '@/lib/i18n/localizeNavHref'
import {
  awardFallbackAlts,
  exploreLinksFallback,
  footerUi,
  legalLinksFallback,
  NUMBER_LOCALE,
  pickLocalizedString,
  pickOptionalLinkLabel,
} from '@/lib/i18n/localizedLabels'
import FooterLegal from '@/components/layout/FooterLegal'
import type { FooterLegalData } from '@/components/layout/FooterLegal'
import {
  Instagram,
  Youtube,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Star,
} from 'lucide-react'

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

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Youtube,
  x: Youtube,
  linkedin: Youtube,
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

function locHref(locale: SiteLocale, href: string | null | undefined): string {
  return localizeNavHref(locale, href)
}

function mergeFooterLegal(raw: SiteFooterLegalRaw | null | undefined, locale: SiteLocale): FooterLegalData | null {
  if (!raw) return null
  const pick = (b: string | null | undefined, e: string | null | undefined, d: string | null | undefined) => {
    const v = pickLocalizedString(b, e, d, locale, '').trim()
    return v || b?.trim() || null
  }
  return {
    copyrightText: pick(raw.copyrightText, raw.copyrightTextEn, raw.copyrightTextDe),
    companyLine1: pick(raw.companyLine1, raw.companyLine1En, raw.companyLine1De),
    companyLine2: pick(raw.companyLine2, raw.companyLine2En, raw.companyLine2De),
    secure3dLabel: pick(raw.secure3dLabel, raw.secure3dLabelEn, raw.secure3dLabelDe),
    paymentLogos: raw.paymentLogos ?? null,
  }
}

export default async function Footer({ locale }: { locale: SiteLocale }) {
  const [data, settingsForLogo] = await Promise.all([getFooterData(), getSiteSettingsLogo()])
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
  const ratingValue = topRated?.ratingValue ?? 5
  const ratingMax = topRated?.ratingMax ?? 5
  const reviewCount = topRated?.reviewCount ?? 0
  const topRatedLabel = pickLocalizedString(
    topRated?.label,
    topRated?.labelEn,
    topRated?.labelDe,
    locale,
    'TOP RATED'
  )

  const contact = data?.contact ?? {}
  const email = contact?.email ?? undefined
  const phone = contact?.phone ?? undefined
  const addressLines = contact?.addressLines ?? []
  const addressText = addressLines.filter(Boolean).join(', ') || undefined
  const chatTitle = pickLocalizedString(
    contact?.chatTitle,
    contact?.chatTitleEn,
    contact?.chatTitleDe,
    locale,
    'Chat With Our Team'
  )
  const openingTitle = pickLocalizedString(
    contact?.openingTitle,
    contact?.openingTitleEn,
    contact?.openingTitleDe,
    locale,
    'Opening Hours'
  )
  const openingValue = pickLocalizedString(
    contact?.openingValue,
    contact?.openingValueEn,
    contact?.openingValueDe,
    locale,
    'Pazartesi - Cuma: 09:00 - 17:00'
  )

  const exploreDefaultTitle =
    locale === 'de' ? 'Entdecken' : locale === 'en' ? 'Explore' : 'Keşfet'
  const exploreTitle = pickLocalizedString(
    data?.explore?.title,
    data?.explore?.titleEn,
    data?.explore?.titleDe,
    locale,
    exploreDefaultTitle
  )

  const exploreFromCms = (data?.explore?.links ?? []).filter((l) => l?.label && l?.href)
  const exploreLinks =
    exploreFromCms.length > 0
      ? exploreFromCms.map((l) => ({
          href: l.href as string,
          label: pickOptionalLinkLabel(l, locale),
          openInNewTab: l.openInNewTab === true,
        }))
      : exploreLinksFallback(locale)

  const socialItems =
    data?.social?.items?.filter((i) => i?.enabled !== false && i?.href) ?? []

  const showBragSection = data?.brag?.enabled !== false
  const bragTitle = pickLocalizedString(
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
    ? bragBadges.map((b) => ({
        src:
          safeSanityImageUrl(b?.image?.asset ?? null, (img) => img.width(80).height(80)) ??
          b?.imageUrl ??
          '',
        alt: pickLocalizedString(b?.alt, b?.altEn, b?.altDe, locale, 'Badge'),
        href: b?.href,
      }))
    : AWARD_IMAGES_FALLBACK_PATHS.map((src, i) => ({
        src,
        alt: awardAlts[i] ?? `Award ${i + 1}`,
        href: undefined as string | undefined,
      }))

  const legalFromCms =
    data?.legalLinks?.items?.filter((l) => l?.enabled !== false && l?.label && l?.href) ?? []
  const legalLinks =
    legalFromCms.length > 0
      ? legalFromCms.map((l) => ({
          href: l.href as string,
          label: pickOptionalLinkLabel(l, locale),
        }))
      : legalLinksFallback(locale)

  const footerLegalMerged = mergeFooterLegal(data?.footerLegal ?? null, locale)

  return (
    <footer
      className="text-white/90 print:hidden"
      style={{
        background: 'linear-gradient(to right, #1e3a5f 0%, #1e4976 35%, #2563eb 70%, #38bdf8 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 md:px-8 md:py-20 lg:px-10 xl:px-12">
        <div
          className={`grid gap-14 lg:gap-x-24 xl:gap-x-32 ${showBragSection ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
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
                  <span className="text-2xl font-bold text-white">{brandName}</span>
                )}
              </div>
            </Link>
            {showTopRated && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white">
                  {topRatedLabel}
                </span>
                <span className="inline-flex items-center gap-2 text-base text-white/90">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="font-semibold text-white">
                    {ratingValue} / {ratingMax}
                  </span>
                </span>
                {reviewCount > 0 && (
                  <span className="text-base text-white/80">
                    {f.reviews(reviewCount.toLocaleString(numLoc))}
                  </span>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-x-24 gap-y-6 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="max-w-[320px] space-y-4 text-left">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-3 text-base text-white/90 hover:text-white transition-colors"
                  >
                    <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>{email}</span>
                  </a>
                )}
                {addressText && (
                  <div className="flex items-start gap-3 text-base text-white/90">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>{addressText}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4 text-left">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 text-base text-white/90 hover:text-white transition-colors"
                  >
                    <Phone className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{chatTitle}</span>
                  </a>
                )}
                <div className="flex items-start gap-3 text-base text-white/90">
                  <span className="text-white/70">{openingTitle}:</span>
                  <span>{openingValue}</span>
                </div>
              </div>
            </div>
            {socialItems.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4">
                {socialItems.map((item, index) => {
                  const platform = (item?.platform ?? '').toLowerCase()
                  const Icon = SOCIAL_ICONS[platform] ?? Instagram
                  const href = item?.href ?? '#'
                  return (
                    <a
                      key={`${platform}-${index}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-[#D07A2B] transition-opacity hover:opacity-90"
                      aria-label={item?.platform ?? 'Social'}
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          <div className={showBragSection ? 'lg:pl-16 xl:pl-24' : ''}>
            <h3 className="mb-6 text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
              {exploreTitle}
            </h3>
            <ul className="space-y-4">
              {exploreLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    href={locHref(locale, item.href || '#')}
                    className="text-base text-white/90 transition-colors hover:text-white hover:underline"
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {showBragSection ? (
            <div>
              <h3 className="mb-6 text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
                {bragTitle}
              </h3>
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
        </div>

        <div className="mt-14 border-t border-white/20 pt-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {data?.footerLegal && footerLegalMerged && (
              <FooterLegal data={footerLegalMerged} inline regionAriaLabel={f.legalRegion} />
            )}
            <div
              className={`flex flex-wrap gap-x-12 gap-y-4 text-sm text-white/80 ${data?.footerLegal ? 'justify-center md:justify-end' : 'justify-center'}`}
            >
              {legalLinks.map((item, index) => (
                <Link
                  key={index}
                  href={locHref(locale, item.href || '#')}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {data?.craftedBy?.name && (
            <div className="mt-6 border-t border-white/20 pt-6 text-center text-sm text-white/70">
              {f.craftedByPrefix}{' '}
              {data.craftedBy.linkedInUrl ? (
                <a
                  href={data.craftedBy.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 underline transition-colors hover:text-white"
                >
                  {data.craftedBy.name}
                </a>
              ) : (
                <span className="text-white/90">{data.craftedBy.name}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
