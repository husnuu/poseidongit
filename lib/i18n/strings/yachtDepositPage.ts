import type { SiteLocale } from '@/lib/i18n/config'
import {
  getYachtDepositFormUi,
  getYachtDepositPageContent,
  type YachtDepositFormUi,
} from '@/lib/yachtDepositDefaults'

export type YachtDepositPageUi = YachtDepositFormUi & {
  metaTitle: string
  metaDescription: string
  defaultBullets: string[]
  defaultIntro: string
}

function toUi(locale: SiteLocale): YachtDepositPageUi {
  const form = getYachtDepositFormUi(locale)
  const content = getYachtDepositPageContent(locale)
  return {
    ...form,
    metaTitle: content.seo.title,
    metaDescription: content.seo.description,
    defaultIntro: content.intro,
    defaultBullets: content.bullets,
  }
}

export function getYachtDepositPageUi(locale: SiteLocale): YachtDepositPageUi {
  return toUi(locale)
}

export function mergeYachtDepositUiFromSanity(
  ui: YachtDepositPageUi,
  formOverlay?: Record<string, unknown> | null
): YachtDepositPageUi {
  if (!formOverlay) return ui
  const pick = (key: keyof YachtDepositFormUi, sanityKey: string): string => {
    const v = formOverlay[sanityKey]
    if (typeof v === 'string' && v.trim()) return v
    const fallback = ui[key]
    return typeof fallback === 'string' ? fallback : String(fallback)
  }
  return {
    ...ui,
    formSectionTitle: pick('formSectionTitle', 'sectionTitle'),
    depositLabel: pick('depositLabel', 'depositLabel'),
    calendarTitle: pick('calendarTitle', 'calendarTitle'),
    yachtNameLabel: pick('yachtNameLabel', 'yachtNameLabel'),
    messageLabel: pick('messageLabel', 'messageLabel'),
    submitLabel: pick('submitLabel', 'submitLabel'),
    secureNote: pick('secureNote', 'secureNote'),
    redirectNote: pick('redirectNote', 'successRedirectNote'),
  }
}
