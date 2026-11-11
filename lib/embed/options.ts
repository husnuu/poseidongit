/**
 * Partner web sitesi widget'ı (iframe) — ayarlar URL'de taşınır, veritabanı
 * gerekmez. Hem sunucu (embed sayfaları) hem tarayıcı (widget oluşturucu) kullanır.
 */
import { isTourCategory, type TourCategory } from '@/lib/tourCategories'

/** iframe ↔ sayfa mesajlarında kaynak etiketi (public/widget.js ile aynı olmalı). */
export const EMBED_MESSAGE_SOURCE = 'poseidon-widget'

export const EMBED_CONTENTS = ['all', 'tours', 'yachts'] as const
export type EmbedContent = (typeof EMBED_CONTENTS)[number]

export type EmbedOptions = {
  /** Listede ne gösterilir: turlar, tekne kiralama ya da ikisi (sekmeli). */
  content: EmbedContent
  /** İkisi birden gösterilirken açık sekme. */
  tab: 'tours' | 'yachts'
  /** Ana renk (#rrggbb); null → sitenin kendi rengi. */
  color: string | null
  /** false → kartlarda fiyat gösterilmez. */
  prices: boolean
  /** Gösterilecek turların Sanity _id listesi; boş → hepsi. */
  tours: string[]
  category: TourCategory | null
  /** Tek tur modu: liste/geri bağlantısı gösterilmez. */
  single: boolean
  /** Aynı sayfadaki birden fazla widget'ı ayırt eden kimlik (widget.js verir). */
  wid: string | null
}

type RawParams = Record<string, string | string[] | undefined>

const COLOR_REGEX = /^#?([0-9a-f]{6})$/i
const ID_REGEX = /^[A-Za-z0-9._-]{1,128}$/

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export function parseEmbedOptions(params: RawParams): EmbedOptions {
  const color = first(params.color)?.trim().match(COLOR_REGEX)?.[1]
  const tours = (first(params.tours) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => ID_REGEX.test(s))
    .slice(0, 50)
  const category = first(params.category)
  const wid = first(params.wid)?.trim()
  const content = first(params.content)
  return {
    content: (EMBED_CONTENTS as readonly string[]).includes(content ?? '') ? (content as EmbedContent) : 'all',
    tab: first(params.tab) === 'yachts' ? 'yachts' : 'tours',
    color: color ? `#${color.toLowerCase()}` : null,
    prices: first(params.prices) !== '0',
    tours,
    category: isTourCategory(category) ? category : null,
    single: first(params.single) === '1',
    wid: wid && /^[a-z0-9]{1,24}$/i.test(wid) ? wid : null,
  }
}

/** Embed içi bağlantılarda ayarların korunması için sorgu dizesi ("?..." ya da ""). */
export function embedQuery(opts: EmbedOptions): string {
  const q = new URLSearchParams()
  if (opts.content !== 'all') q.set('content', opts.content)
  if (opts.tab === 'yachts') q.set('tab', 'yachts')
  if (opts.color) q.set('color', opts.color.slice(1))
  if (!opts.prices) q.set('prices', '0')
  if (opts.tours.length > 0) q.set('tours', opts.tours.join(','))
  if (opts.category) q.set('category', opts.category)
  if (opts.single) q.set('single', '1')
  if (opts.wid) q.set('wid', opts.wid)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function embedListPath(locale: string, partnerSlug: string): string {
  return `/embed/${locale}/${partnerSlug}`
}

export function embedTourPath(locale: string, partnerSlug: string, tourSlug: string): string {
  return `/embed/${locale}/${partnerSlug}/tur/${encodeURIComponent(tourSlug)}`
}
