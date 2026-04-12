'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  applyGtagConsent,
  loadStoredConsent,
  saveConsent,
  type CookieConsentPreferences,
} from '@/lib/cookieConsent'
import styles from './CookieConsentBanner.module.css'

function Toggle({
  pressed,
  onChange,
  label,
}: {
  pressed: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      className={styles.switch}
      data-on={pressed}
      onClick={() => onChange(!pressed)}
    >
      <span className={styles.switchKnob} />
    </button>
  )
}

type Props = {
  policyHref: string
}

export default function CookieConsentBanner({ policyHref }: Props) {
  const [ready, setReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState<CookieConsentPreferences>({
    analytics: false,
    ads: false,
  })

  const persistAndClose = useCallback((prefs: CookieConsentPreferences) => {
    saveConsent(prefs)
    applyGtagConsent(prefs)
    setShowBanner(false)
    setSettingsOpen(false)
  }, [])

  useEffect(() => {
    const stored = loadStoredConsent()
    if (stored) {
      applyGtagConsent(stored)
      setShowBanner(false)
    } else {
      setShowBanner(true)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen])

  const openSettings = useCallback(() => {
    const stored = loadStoredConsent()
    setDraft(
      stored
        ? { analytics: stored.analytics, ads: stored.ads }
        : { analytics: false, ads: false }
    )
    setSettingsOpen(true)
  }, [])

  if (!ready || !showBanner) return null

  return (
    <>
      {settingsOpen ? (
        <>
          <div
            className={styles.backdrop}
            role="presentation"
            aria-hidden
            onClick={() => setSettingsOpen(false)}
          />
          <div
            className={styles.settingsPanel}
            role="dialog"
            aria-labelledby="cookie-settings-title"
            aria-modal="true"
          >
            <h2 id="cookie-settings-title">Çerez ayarları</h2>
            <p>
              İsteğe bağlı çerezleri buradan açıp kapatabilirsiniz. Tercihinizi kaydettiğinizde ana
              bildirim kapanır.
            </p>
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <strong>Analitik</strong>
              </div>
              <Toggle
                label="Analitik çerezleri aç veya kapat"
                pressed={draft.analytics}
                onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <strong>Reklam</strong>
              </div>
              <Toggle
                label="Reklam çerezlerini aç veya kapat"
                pressed={draft.ads}
                onChange={(v) => setDraft((d) => ({ ...d, ads: v }))}
              />
            </div>
            <div className={styles.settingsActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => persistAndClose(draft)}
              >
                Seçimleri kaydet
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setSettingsOpen(false)}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className={styles.banner} role="region" aria-label="Çerez tercihleri">
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.textBlock}>
              <p>
                Size daha iyi hizmet sunabilmek için çerezlerden faydalanıyoruz.{' '}
                <Link href={policyHref} className={styles.policyLink}>
                  Çerez politikamızı okuyun
                </Link>
                .
              </p>
            </div>
            <div className={styles.actionsWrap}>
              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.btnAccept}
                  onClick={() => persistAndClose({ analytics: true, ads: true })}
                >
                  Hepsini kabul et
                </button>
                <button
                  type="button"
                  className={styles.btnReject}
                  onClick={() => persistAndClose({ analytics: false, ads: false })}
                >
                  Reddet
                </button>
              </div>
              <button type="button" className={styles.linkSettings} onClick={openSettings}>
                Çerez ayarları
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
