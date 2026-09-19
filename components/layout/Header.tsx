import { client } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { headerNavWithHelpCenter } from '@/lib/i18n/headerNavWithHelpCenter'
import type { AnnouncementBarData } from './announcementBarTypes'
import HeaderClient from './HeaderClient'
import { translateText } from '@/lib/i18n/runtimeTranslate'

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
    let bar = settings.announcementBar ?? null
    if (bar?.enabled && bar.text?.trim() && locale !== 'tr') {
      const needsEn = locale === 'en' && !bar.textEn?.trim()
      const needsDe = locale === 'de' && !bar.textDe?.trim()
      if (needsEn || needsDe) {
        const translated = await translateText(bar.text, locale)
        bar = {
          ...bar,
          ...(needsEn ? { textEn: translated } : {}),
          ...(needsDe ? { textDe: translated } : {}),
        }
      }
    }
    let cta = settings.cta ?? null
    if (cta?.text?.trim() && locale !== 'tr') {
      const needsEn = locale === 'en' && !cta.textEn?.trim()
      const needsDe = locale === 'de' && !cta.textDe?.trim()
      if (needsEn || needsDe) {
        const translated = await translateText(cta.text, locale)
        cta = {
          ...cta,
          ...(needsEn ? { textEn: translated } : {}),
          ...(needsDe ? { textDe: translated } : {}),
        }
      }
    }
    const settingsWithHelp = {
      ...settings,
      ...(cta ? { cta } : {}),
      headerNav: headerNavWithHelpCenter(settings.headerNav),
    }
    return <HeaderClient locale={locale} settings={settingsWithHelp} announcementBar={bar} />
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
