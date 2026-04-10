import { client } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import type { AnnouncementBarData } from './announcementBarTypes'
import HeaderClient from './HeaderClient'

interface SiteSettings {
  siteName?: string
  tagline?: string
  logo?: {
    asset?: { _id?: string; _type?: string }
    url?: string
    metadata?: {
      lqip?: string
      dimensions?: { width: number; height: number }
    }
  }
  headerNav?: Array<{ label: string; href: string; labelEn?: string; labelDe?: string }>
  cta?: { text?: string; href?: string; textEn?: string; textDe?: string }
  announcementBar?: AnnouncementBarData | null
  languages?: string[]
  footerNav?: Array<{ label: string; href: string; labelEn?: string; labelDe?: string }>
  legalNav?: Array<{ label: string; href: string; labelEn?: string; labelDe?: string }>
  socialLinks?: Array<{ platform: string; href: string }>
}

async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const settings = await client.fetch<SiteSettings | null>(siteSettingsQuery)
    return settings
  } catch {
    return null
  }
}

export default async function Header({ locale }: { locale: SiteLocale }) {
  try {
    const settings = await getSiteSettings()
    const fallbackName = getSiteName() || 'Site'
    if (!settings) {
      return (
        <HeaderClient
          locale={locale}
          settings={{ siteName: fallbackName, headerNav: [{ label: 'Anasayfa', href: '/' }] }}
          announcementBar={null}
        />
      )
    }
    const bar = settings.announcementBar ?? null
    return <HeaderClient locale={locale} settings={settings} announcementBar={bar} />
  } catch {
    const fallbackName = getSiteName() || 'Site'
    return (
      <HeaderClient
        locale={locale}
        settings={{ siteName: fallbackName, headerNav: [{ label: 'Anasayfa', href: '/' }] }}
        announcementBar={null}
      />
    )
  }
}
