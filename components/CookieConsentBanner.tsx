'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyGtagConsent,
  loadStoredConsent,
  saveConsent,
  type CookieConsentPreferences,
} from '@/lib/cookieConsent'
import { COOKIE_CONSENT_BANNER_ID } from '@/lib/cookieBannerId'
import type { SiteLocale } from '@/lib/i18n/config'
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n/paths'
import styles from './CookieConsentBanner.module.css'

/** Bant kök layout'ta: dil, adres çubuğundaki önekten (/en, /de, /ru) okunur. */
const COPY: Record<SiteLocale, { region: string; title: string; text: string; more: string; reject: string; accept: string }> = {
  tr: {
    region: 'Çerez tercihleri',
    title: 'Gizliliğinize değer veriyoruz',
    text: 'Ziyaretçilerin sitemizi nasıl kullandığını anlamak ve deneyiminizi iyileştirmek için çerezleri kullanıyoruz. Kabul edebilir veya reddedebilirsiniz.',
    more: 'Daha fazla bilgi',
    reject: 'Reddet',
    accept: 'Kabul Et',
  },
  en: {
    region: 'Cookie preferences',
    title: 'We value your privacy',
    text: 'We use cookies to understand how visitors use our site and to improve your experience. You can accept or reject them.',
    more: 'Learn more',
    reject: 'Reject',
    accept: 'Accept',
  },
  de: {
    region: 'Cookie-Einstellungen',
    title: 'Ihre Privatsphäre ist uns wichtig',
    text: 'Wir verwenden Cookies, um zu verstehen, wie Besucher unsere Website nutzen, und um Ihr Erlebnis zu verbessern. Sie können sie akzeptieren oder ablehnen.',
    more: 'Mehr erfahren',
    reject: 'Ablehnen',
    accept: 'Akzeptieren',
  },
  ru: {
    region: 'Настройки cookie',
    title: 'Мы ценим вашу конфиденциальность',
    text: 'Мы используем файлы cookie, чтобы понять, как посетители пользуются сайтом, и улучшить ваш опыт. Вы можете принять или отклонить их.',
    more: 'Подробнее',
    reject: 'Отклонить',
    accept: 'Принять',
  },
}

type Props = {
  policyHref: string
}

const SHOW_DELAY_MS = 3500

export default function CookieConsentBanner({ policyHref }: Props) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistAndClose = useCallback((prefs: CookieConsentPreferences) => {
    saveConsent(prefs)
    applyGtagConsent(prefs)
    setVisible(false)
    setTimeout(() => {
      setShowBanner(false)
    }, 350)
  }, [])

  useEffect(() => {
    const stored = loadStoredConsent()
    if (stored) {
      applyGtagConsent(stored)
      setShowBanner(false)
      setReady(true)
    } else {
      setShowBanner(true)
      setReady(true)
      timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (pathname?.startsWith('/ekip')) return null
  // Partner sitelerine gömülen widget: çerez bildirimi dış sitenin sorumluluğunda.
  if (pathname?.startsWith('/embed/')) return null
  if (!ready || !showBanner) return null

  const locale = parseLocaleFromPathname(pathname ?? '/').locale
  const copy = COPY[locale]

  return (
    <div
      id={COOKIE_CONSENT_BANNER_ID}
      className={`${styles.banner} ${visible ? styles.bannerVisible : ''}`}
      role="region"
      aria-label={copy.region}
    >
      <div className={styles.card}>
        <p className={styles.cardTitle}>{copy.title}</p>
        <p className={styles.cardText}>
          {copy.text}{' '}
          <Link href={withLocalePath(locale, policyHref)} className={styles.policyLink}>
            {copy.more}
          </Link>
        </p>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.btnReject}
            onClick={() => persistAndClose({ analytics: false, ads: false })}
          >
            {copy.reject}
          </button>
          <button
            type="button"
            className={styles.btnAccept}
            onClick={() => persistAndClose({ analytics: true, ads: true })}
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
