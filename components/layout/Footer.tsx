import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { client, urlFor } from '@/lib/sanity'
import { siteFooterQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'
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

type SiteFooterData = {
  brandName?: string | null
  logo?: { asset?: { _ref?: string }; url?: string; alt?: string | null } | null
  topRated?: {
    enabled?: boolean
    label?: string | null
    ratingValue?: number | null
    ratingMax?: number | null
    reviewCount?: number | null
  } | null
  contact?: {
    email?: string | null
    phone?: string | null
    addressTitle?: string | null
    addressLines?: string[] | null
    chatTitle?: string | null
    chatValue?: string | null
    openingTitle?: string | null
    openingValue?: string | null
  } | null
  explore?: {
    title?: string | null
    links?: Array<{ label?: string | null; href?: string | null; openInNewTab?: boolean }> | null
  } | null
  social?: {
    title?: string | null
    items?: Array<{ platform?: string | null; href?: string | null; enabled?: boolean }> | null
  } | null
  brag?: {
    title?: string | null
    badges?: Array<{
      type?: string | null
      enabled?: boolean
      alt?: string | null
      href?: string | null
      image?: { asset?: { _ref?: string } } | null
      imageUrl?: string | null
    }> | null
  } | null
  legalLinks?: {
    items?: Array<{ label?: string | null; href?: string | null; enabled?: boolean }> | null
  } | null
  footerLegal?: FooterLegalData
  craftedBy?: {
    name?: string | null
    linkedInUrl?: string | null
  } | null
}

const AWARD_IMAGES_FALLBACK = [
  { src: '/awards/badge1.svg', alt: 'Award 1' },
  { src: '/awards/badge2.svg', alt: 'Award 2' },
  { src: '/awards/badge3.svg', alt: 'Award 3' },
  { src: '/awards/badge4.svg', alt: 'Award 4' },
]

const EXPLORE_LINKS_FALLBACK = [
  { label: 'Turlar', href: '/turlar' },
  { label: 'Koylar', href: '/koylar' },
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Blog', href: '/blog' },
  { label: 'İletişim', href: '/contact' },
]

const LEGAL_LINKS_FALLBACK = [
  { label: 'Terms and Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
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

export default async function Footer() {
  const data = await getFooterData()

  const brandName = (data?.brandName ?? getSiteName()) || 'Site'
  const logoAsset = data?.logo?.asset
  const logoUrl = logoAsset
    ? urlFor(logoAsset).width(140).height(44).url()
    : data?.logo?.url ?? null
  const logoAlt = data?.logo?.alt ?? brandName

  const topRated = data?.topRated
  const showTopRated = topRated?.enabled !== false
  const ratingValue = topRated?.ratingValue ?? 5
  const ratingMax = topRated?.ratingMax ?? 5
  const reviewCount = topRated?.reviewCount ?? 0
  const topRatedLabel = topRated?.label ?? 'TOP RATED'

  const contact = data?.contact ?? {}
  const email = contact?.email ?? undefined
  const phone = contact?.phone ?? undefined
  const addressLines = contact?.addressLines ?? []
  const addressText = addressLines.filter(Boolean).join(', ') || undefined
  const chatTitle = contact?.chatTitle ?? 'Chat With Our Team'
  const openingTitle = contact?.openingTitle ?? 'Opening Hours'
  const openingValue = contact?.openingValue ?? 'Pazartesi - Cuma: 09:00 - 17:00'

  const exploreLinks =
    data?.explore?.links && data.explore.links.length > 0
      ? data.explore.links.filter((l) => l?.label && l?.href)
      : EXPLORE_LINKS_FALLBACK
  const exploreTitle = data?.explore?.title ?? 'Explore'

  const socialItems =
    data?.social?.items?.filter((i) => i?.enabled !== false && i?.href) ?? []
  const socialTitle = data?.social?.title

  const bragTitle = data?.brag?.title ?? 'Not to brag, but…'
  const bragBadges = data?.brag?.badges?.filter((b) => b?.enabled !== false) ?? []
  const hasBragImages = bragBadges.some((b) => b?.image?.asset || b?.imageUrl)
  const awardImages = hasBragImages
    ? bragBadges.map((b) => ({
        src: b?.image?.asset ? urlFor(b.image.asset).width(80).height(80).url() : b?.imageUrl ?? '',
        alt: b?.alt ?? 'Badge',
        href: b?.href,
      }))
    : AWARD_IMAGES_FALLBACK

  const legalItems =
    data?.legalLinks?.items?.filter((l) => l?.enabled !== false && l?.label && l?.href) ?? []
  const legalLinks = legalItems.length > 0 ? legalItems : LEGAL_LINKS_FALLBACK

  return (
    <footer
      className="text-white/90"
      style={{
        background: 'linear-gradient(to right, #1e3a5f 0%, #1e4976 35%, #2563eb 70%, #38bdf8 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 md:px-8 md:py-20 lg:px-10 xl:px-12">
        <div className="grid gap-14 lg:grid-cols-3 lg:gap-x-24 xl:gap-x-32">
          {/* Sol kolon: Logo + Top Rated + Contact + Social */}
          <div className="space-y-7">
            <Link href="/" className="inline-block" prefetch={false}>
              {logoUrl ? (
                <div className="relative h-12 w-[160px]">
                  <Image
                    src={logoUrl}
                    alt={logoAlt}
                    fill
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold text-white">{brandName}</span>
              )}
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
                    {reviewCount.toLocaleString('tr-TR')} yorum
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

          {/* Orta kolon: EXPLORE */}
          <div className="lg:pl-16 xl:pl-24">
            <h3 className="mb-6 text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
              {exploreTitle}
            </h3>
            <ul className="space-y-4">
              {exploreLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href || '#'}
                    className="text-base text-white/90 transition-colors hover:text-white hover:underline"
                    target={'openInNewTab' in item && item.openInNewTab ? '_blank' : undefined}
                    rel={'openInNewTab' in item && item.openInNewTab ? 'noopener noreferrer' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sağ kolon: NOT TO BRAG + rozetler */}
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
                const linkHref = 'href' in item && item.href && typeof item.href === 'string' ? item.href : null
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
        </div>

        {/* Bottom bar: Sol = Legal + Ödeme, Sağ = Terms & Privacy */}
        <div className="mt-14 border-t border-white/20 pt-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {data?.footerLegal && <FooterLegal data={data.footerLegal} inline />}
            <div
              className={`flex flex-wrap gap-12 text-base text-white/80 ${data?.footerLegal ? 'justify-center md:justify-end' : 'justify-center'}`}
            >
              {legalLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.href || '#'}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Crafted by */}
          {data?.craftedBy?.name && (
            <div className="mt-6 border-t border-white/20 pt-6 text-center text-sm text-white/70">
              Crafted by{' '}
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
