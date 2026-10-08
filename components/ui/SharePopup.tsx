'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Facebook, Link2, Mail, MessageCircle, Send, Twitter, X as XIcon } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import styles from './SharePopup.module.css'

const SHARE_LABELS: Record<
  SiteLocale,
  {
    title: string
    copyLink: string
    copied: string
    close: string
    whatsapp: string
    email: string
    telegram: string
    facebook: string
    x: string
  }
> = {
  tr: {
    title: 'BUNU PAYLAŞ',
    copyLink: 'Bağlantıyı Kopyala',
    copied: 'Kopyalandı!',
    close: 'Kapat',
    whatsapp: 'WhatsApp',
    email: 'E-posta',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
  },
  en: {
    title: 'SHARE THIS',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    close: 'Close',
    whatsapp: 'WhatsApp',
    email: 'Email',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
  },
  de: {
    title: 'TEILEN',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    close: 'Schließen',
    whatsapp: 'WhatsApp',
    email: 'E-Mail',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
  },
  ru: {
    title: 'ПОДЕЛИТЬСЯ',
    copyLink: 'Скопировать ссылку',
    copied: 'Скопировано!',
    close: 'Закрыть',
    whatsapp: 'WhatsApp',
    email: 'Эл. почта',
    telegram: 'Telegram',
    facebook: 'Facebook',
    x: 'X',
  },
}

interface SharePopupProps {
  title: string
  description?: string | null
  imageUrl?: string | null
  /** Paylaşılacak sayfanın locale önekli yolu, ör. "/tur/cesme-tekne-turu". */
  path: string
  locale: SiteLocale
  onClose: () => void
}

/** PhotoGrid'deki (tur sayfası) paylaşım penceresiyle birebir aynı görünüm ve
    işlev — kopyala / WhatsApp / e-posta / Telegram / Facebook / X. Kart
    bileşenlerinden açıldığında (hover'da transform uygulayan ata'lar
    yüzünden `position: fixed` bozulmasın diye) her zaman document.body'ye
    portal ile render edilir. */
export default function SharePopup({ title, description, imageUrl, path, locale, onClose }: SharePopupProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const ui = SHARE_LABELS[locale] ?? SHARE_LABELS.tr

  useEffect(() => {
    setMounted(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!mounted) return null

  const url = `${window.location.origin}${path}`
  const textEncoded = encodeURIComponent(title)
  const urlEncoded = encodeURIComponent(url)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano erişimi yoksa sessizce yok say */
    }
  }

  const openShareTarget = (targetUrl: string) => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }

  return createPortal(
    <div
      className={styles.shareOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ui.title}
    >
      <div className={styles.sharePanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sharePanelHeader}>
          <span className={styles.sharePanelTitle}>{ui.title}</span>
          <button type="button" className={styles.sharePanelClose} onClick={onClose} aria-label={ui.close}>
            <XIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.sharePreview}>
          {imageUrl && (
            <span className={styles.sharePreviewThumb}>
              <Image src={imageUrl} alt={title} width={64} height={64} className={styles.sharePreviewThumbImg} />
            </span>
          )}
          <span className={styles.sharePreviewInfo}>
            <span className={styles.sharePreviewTitle}>{title}</span>
            {description && <span className={styles.sharePreviewDesc}>{description}</span>}
          </span>
        </div>

        <div className={styles.shareOptions}>
          <button type="button" className={styles.shareOption} onClick={handleCopyLink}>
            <Link2
              className={styles.shareOptionIcon}
              style={{ color: 'var(--primary, #2168b8)' }}
              strokeWidth={2}
              aria-hidden
            />
            {copied ? ui.copied : ui.copyLink}
          </button>
          <button
            type="button"
            className={styles.shareOption}
            onClick={() => openShareTarget(`https://wa.me/?text=${textEncoded}%20${urlEncoded}`)}
          >
            <MessageCircle
              className={styles.shareOptionIcon}
              style={{ color: '#25d366' }}
              strokeWidth={2}
              aria-hidden
            />
            {ui.whatsapp}
          </button>
          <a className={styles.shareOption} href={`mailto:?subject=${textEncoded}&body=${urlEncoded}`}>
            <Mail
              className={styles.shareOptionIcon}
              style={{ color: 'var(--primary, #2168b8)' }}
              strokeWidth={2}
              aria-hidden
            />
            {ui.email}
          </a>
          <button
            type="button"
            className={styles.shareOption}
            onClick={() => openShareTarget(`https://t.me/share/url?url=${urlEncoded}&text=${textEncoded}`)}
          >
            <span className={styles.shareOptionIconBadge} style={{ background: '#229ed9' }}>
              <Send className={styles.shareOptionIcon} strokeWidth={2} fill="currentColor" aria-hidden />
            </span>
            {ui.telegram}
          </button>
          <button
            type="button"
            className={styles.shareOption}
            onClick={() => openShareTarget(`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`)}
          >
            <span className={styles.shareOptionIconBadge} style={{ background: '#1877f2' }}>
              <Facebook className={styles.shareOptionIcon} strokeWidth={2} fill="currentColor" aria-hidden />
            </span>
            {ui.facebook}
          </button>
          <button
            type="button"
            className={styles.shareOption}
            onClick={() => openShareTarget(`https://twitter.com/intent/tweet?url=${urlEncoded}&text=${textEncoded}`)}
          >
            <Twitter
              className={styles.shareOptionIcon}
              style={{ color: 'var(--secondary, #131719)' }}
              strokeWidth={2}
              aria-hidden
            />
            {ui.x}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
