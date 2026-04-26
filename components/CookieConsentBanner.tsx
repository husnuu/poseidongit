'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const SHOW_DELAY_MS = 3500

export default function CookieConsentBanner({ policyHref }: Props) {
  const [ready, setReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState<CookieConsentPreferences>({
    analytics: false,
    ads: false,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistAndClose = useCallback((prefs: CookieConsentPreferences) => {
    saveConsent(prefs)
    applyGtagConsent(prefs)
    setVisible(false)
    setTimeout(() => {
      setShowBanner(false)
      setSettingsOpen(false)
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
            <h2 id="cookie-settings-title">Çerez Ayarları</h2>
            <p>
              İsteğe bağlı çerezleri buradan açıp kapatabilirsiniz. Tercihinizi kaydettiğinizde
              bildirim kapanır.
            </p>
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <strong>Analitik</strong>
                <span>Siteyi nasıl kullandığınızı anlamamıza yardımcı olur.</span>
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
                <span>Size ilgili reklamlar göstermemizi sağlar.</span>
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
                Seçimleri Kaydet
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

      <div
        className={`${styles.banner} ${visible ? styles.bannerVisible : ''}`}
        role="region"
        aria-label="Çerez tercihleri"
      >
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Gizliliğinize değer veriyoruz</h3>
          <p className={styles.cardText}>
            Deneyiminizi iyileştirmek için çerez kullanıyoruz.{' '}
            <Link href={policyHref} className={styles.policyLink}>
              Daha Fazla Bilgi
            </Link>
          </p>
          <div className={styles.btnRow}>
            <button type="button" className={styles.btnCustomize} onClick={openSettings}>
              Ayarlar
            </button>
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
    </>
  )
}
