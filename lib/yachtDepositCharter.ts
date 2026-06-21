import type { SiteLocale } from '@/lib/i18n/config'
import { yachtTypeLabel } from '@/lib/yachtTypes'

export type YachtDepositYachtRef = {
  _id?: string | null
  name?: string | null
  slug?: string | null
  yachtType?: string | null
  locationTitle?: string | null
  marina?: string | null
  mainImage?: { url?: string | null; alt?: string | null } | null
  specifications?: {
    capacity?: number | null
    length?: string | null
    cabins?: number | null
  } | null
}

export type YachtDepositCharterConfig = {
  yachtId: string
  yachtName: string
  yachtSlug: string | null
  yachtType?: string | null
  yachtTypeLabel: string
  locationLabel: string | null
  coverImageUrl: string | null
  coverImageAlt: string
  specLine: string | null
  charterDateStart: string
  charterDateEnd: string | null
  dateSummary: string
}

function dateLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'en-US'
  if (locale === 'de') return 'de-DE'
  return 'tr-TR'
}

export function formatDepositDate(iso: string, locale: SiteLocale): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(dateLocale(locale), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatDepositCharterDateSummary(
  start: string,
  end: string | null | undefined,
  locale: SiteLocale
): string {
  const a = formatDepositDate(start, locale)
  if (!end || end === start) return a
  const b = formatDepositDate(end, locale)
  if (locale === 'en') return `${a} – ${b}`
  if (locale === 'de') return `${a} – ${b}`
  return `${a} – ${b}`
}

function specLineFromYacht(yacht: YachtDepositYachtRef): string | null {
  const spec = yacht.specifications
  if (!spec) return null
  const parts: string[] = []
  if (spec.capacity != null) parts.push(`${spec.capacity} kişi`)
  if (spec.cabins != null) parts.push(`${spec.cabins} kabin`)
  const len = spec.length?.trim()
  if (len) parts.push(len.includes('m') ? len : `${len} m`)
  return parts.length ? parts.join(' · ') : null
}

export function buildYachtDepositCharterConfig(
  yacht: YachtDepositYachtRef | null | undefined,
  charterDateStart: string | null | undefined,
  charterDateEnd: string | null | undefined,
  locale: SiteLocale
): YachtDepositCharterConfig | null {
  const yachtId = yacht?._id?.trim()
  const yachtName = yacht?.name?.trim()
  const start = charterDateStart?.trim()?.slice(0, 10)
  if (!yacht || !yachtId || !yachtName || !start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null

  const endRaw = charterDateEnd?.trim()?.slice(0, 10)
  const end =
    endRaw && /^\d{4}-\d{2}-\d{2}$/.test(endRaw) && endRaw > start ? endRaw : null

  const loc = [yacht.locationTitle, yacht.marina].filter((s) => s?.trim()).join(' · ') || null

  return {
    yachtId,
    yachtName,
    yachtSlug: yacht.slug?.trim() || null,
    yachtType: yacht.yachtType?.trim() || null,
    yachtTypeLabel: yachtTypeLabel(yacht.yachtType ?? undefined),
    locationLabel: loc,
    coverImageUrl: yacht.mainImage?.url?.trim() || null,
    coverImageAlt: yacht.mainImage?.alt?.trim() || yachtName,
    specLine: specLineFromYacht(yacht),
    charterDateStart: start,
    charterDateEnd: end,
    dateSummary: formatDepositCharterDateSummary(start, end, locale),
  }
}

export function yachtDepositContextLine(
  config: YachtDepositCharterConfig,
  locale: SiteLocale
): string {
  if (locale === 'en') {
    return `This deposit is for ${config.yachtName} on ${config.dateSummary}.`
  }
  if (locale === 'de') {
    return `Diese Anzahlung gilt für ${config.yachtName} am ${config.dateSummary}.`
  }
  return `Bu kapora, ${config.dateSummary} tarihleri için ${config.yachtName} teknesine aittir.`
}
