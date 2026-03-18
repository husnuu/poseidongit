import { client } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'
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
  headerNav?: Array<{ label: string; href: string }>
  cta?: { text?: string; href?: string }
  languages?: string[]
  footerNav?: Array<{ label: string; href: string }>
  legalNav?: Array<{ label: string; href: string }>
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

export default async function Header() {
  try {
    const settings = await getSiteSettings()
    const fallbackName = getSiteName() || 'Site'
    if (!settings) {
      return <HeaderClient settings={{ siteName: fallbackName, headerNav: [{ label: 'Anasayfa', href: '/' }] }} />
    }
    return <HeaderClient settings={settings} />
  } catch {
    const fallbackName = getSiteName() || 'Site'
    return <HeaderClient settings={{ siteName: fallbackName, headerNav: [{ label: 'Anasayfa', href: '/' }] }} />
  }
}
