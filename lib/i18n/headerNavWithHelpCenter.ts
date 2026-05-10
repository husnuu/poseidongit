import type { SiteLocale } from './config'

export type HeaderNavItem = {
  label: string
  href: string
  labelEn?: string
  labelDe?: string
}

const HELP_CENTER_ITEM: HeaderNavItem = {
  label: 'Yardım Merkezi',
  href: '/yardim-merkezi',
  labelEn: 'Help Center',
  labelDe: 'Hilfezentrum',
}

/** /en/foo, /de/foo, /tr/foo → /foo */
function canonicalInternalPath(href: string): string {
  const t = href.trim()
  if (!t.startsWith('/')) return t
  let p = t
  for (const pref of ['/en', '/de', '/tr'] as const) {
    if (p === pref) return '/'
    if (p.startsWith(`${pref}/`)) {
      p = p.slice(pref.length)
      return p.startsWith('/') ? p : `/${p}`
    }
  }
  return p
}

function stripTrailingSlash(p: string): string {
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

/** Menü eşleştirmesi: tam site URL’si, /en/… öneki, sorgu dilimleri */
function pathForMatch(href: string): string {
  const t = href.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) {
    try {
      const u = new URL(t)
      return stripTrailingSlash(u.pathname).toLowerCase()
    } catch {
      return ''
    }
  }
  const pathOnly = t.split('?')[0] ?? t
  return stripTrailingSlash(canonicalInternalPath(pathOnly)).toLowerCase()
}

function isContactHref(href: string): boolean {
  const p = pathForMatch(href)
  return p === '/contact' || p === '/iletisim'
}

function isHelpCenterHref(href: string): boolean {
  return pathForMatch(href) === '/yardim-merkezi'
}

/**
 * Yardım Merkezi satırını İletişim’in hemen üstüne koyar.
 * Önce listedeki tüm Yardım Merkezi girişlerini çıkarır (çift veya yanlış sıra için),
 * sonra tek bir Yardım Merkezi eklenir.
 */
export function headerNavWithHelpCenter(nav: HeaderNavItem[] | null | undefined): HeaderNavItem[] {
  const items = [...(nav ?? [])].filter((n) => !isHelpCenterHref(n.href))
  const row = { ...HELP_CENTER_ITEM }
  const contactIdx = items.findIndex((n) => isContactHref(n.href))
  if (contactIdx >= 0) {
    items.splice(contactIdx, 0, row)
  } else {
    items.push(row)
  }
  return items
}

export type ExploreLinkItem = { label: string; href: string; openInNewTab?: boolean }

/** Footer «Keşfet» listesi: Yardım Merkezi → İletişim’in hemen üstü */
export function exploreLinksWithHelpCenter(locale: SiteLocale, links: ExploreLinkItem[]): ExploreLinkItem[] {
  const items = links.filter((n) => !isHelpCenterHref(n.href))
  const label =
    locale === 'en'
      ? HELP_CENTER_ITEM.labelEn ?? HELP_CENTER_ITEM.label
      : locale === 'de'
        ? HELP_CENTER_ITEM.labelDe ?? HELP_CENTER_ITEM.label
        : HELP_CENTER_ITEM.label
  const row: ExploreLinkItem = { label, href: HELP_CENTER_ITEM.href }
  const contactIdx = items.findIndex((n) => isContactHref(n.href))
  if (contactIdx >= 0) {
    items.splice(contactIdx, 0, row)
  } else {
    items.push(row)
  }
  return items
}
