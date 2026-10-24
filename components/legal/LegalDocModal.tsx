'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import { X } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { legalPageComponents } from './legalPortableComponents'
import styles from './LegalDocModal.module.css'

const UI: Record<SiteLocale, { close: string; loading: string; error: string; openPage: string }> = {
  tr: { close: 'Kapat', loading: 'Yükleniyor…', error: 'Metin yüklenemedi.', openPage: 'Sayfada aç' },
  en: { close: 'Close', loading: 'Loading…', error: 'Could not load the text.', openPage: 'Open page' },
  de: { close: 'Schließen', loading: 'Wird geladen…', error: 'Text konnte nicht geladen werden.', openPage: 'Seite öffnen' },
  ru: { close: 'Закрыть', loading: 'Загрузка…', error: 'Не удалось загрузить текст.', openPage: 'Открыть страницу' },
}

/** Bağlantının son yol parçası — ".../yasal/mesafeli-satis-sozlesmesi" → slug. */
export function legalSlugFromHref(href: string): string {
  try {
    const path = new URL(href, 'https://x.local').pathname
    return path.split('/').filter(Boolean).pop() ?? ''
  } catch {
    return href.split('/').filter(Boolean).pop() ?? ''
  }
}

/**
 * Yasal metni (Mesafeli Satış Sözleşmesi, Şartlar ve Koşullar…) yeni sekme
 * yerine ekranda ortalı bir pop-up'ta gösterir. İçerik Sanity'deki yasal
 * sayfadan gelir (/api/legal-pages/[slug]) — /yasal/[slug] sayfasıyla aynı
 * kaynak ve aynı tipografi.
 */
export default function LegalDocModal({
  href,
  locale = 'tr',
  onClose,
}: {
  href: string
  locale?: SiteLocale
  onClose: () => void
}) {
  const t = UI[locale] ?? UI.tr
  const slug = legalSlugFromHref(href)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'error' } | { kind: 'ok'; title: string; content: PortableTextBlock[] }
  >({ kind: 'loading' })

  useEffect(() => {
    setPortalEl(document.body)
  }, [])

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    fetch(`/api/legal-pages/${encodeURIComponent(slug)}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { title?: string; content?: PortableTextBlock[] }) => {
        if (!cancelled) setState({ kind: 'ok', title: d.title ?? '', content: d.content ?? [] })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [slug, locale])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  if (!portalEl) return null

  const title = state.kind === 'ok' ? state.title : ''

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal
      aria-label={title || slug}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.sheet}>
        <span className={styles.handle} aria-hidden />
        <div className={styles.header}>
          <p className={styles.title}>{title}</p>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t.close}>
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.body}>
          {state.kind === 'loading' && <p className={styles.status}>{t.loading}</p>}
          {state.kind === 'error' && (
            <p className={styles.status}>
              {t.error}{' '}
              <a href={href} target="_blank" rel="noopener noreferrer" className={styles.fallbackLink}>
                {t.openPage}
              </a>
            </p>
          )}
          {state.kind === 'ok' && <PortableText value={state.content} components={legalPageComponents} />}
        </div>
      </div>
    </div>,
    portalEl
  )
}
