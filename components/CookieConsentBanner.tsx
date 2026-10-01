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
import styles from './CookieConsentBanner.module.css'

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
  if (!ready || !showBanner) return null

  return (
    <div
      id={COOKIE_CONSENT_BANNER_ID}
      className={`${styles.banner} ${visible ? styles.bannerVisible : ''}`}
      role="region"
      aria-label="Çerez tercihleri"
    >
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Gizliliğinize değer veriyoruz</h3>
        <p className={styles.cardText}>
          Ziyaretçilerin sitemizi nasıl kullandığını anlamak ve deneyiminizi iyileştirmek için
          çerezleri kullanıyoruz. Kabul edebilir veya reddedebilirsiniz.{' '}
          <Link href={policyHref} className={styles.policyLink}>
            Daha fazla bilgi
          </Link>
        </p>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.btnReject}
            onClick={() => persistAndClose({ analytics: false, ads: false })}
          >
            Reddet
          </button>
          <button
            type="button"
            className={styles.btnAccept}
            onClick={() => persistAndClose({ analytics: true, ads: true })}
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  )
}
