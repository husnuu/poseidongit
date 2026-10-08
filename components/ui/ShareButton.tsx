'use client'

import { useState } from 'react'
import { Share } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import SharePopup from './SharePopup'

const SHARE_LABEL: Record<SiteLocale, string> = {
  tr: 'Paylaş',
  en: 'Share',
  de: 'Teilen',
  ru: 'Поделиться',
}

interface ShareButtonProps {
  title: string
  description?: string | null
  imageUrl?: string | null
  /** Paylaşılacak sayfanın locale önekli yolu, ör. "/tr/tur/cesme-tekne-turu". */
  path: string
  locale: SiteLocale
  className?: string
}

/** Kart görselinin üstünde, favori (kalp) butonunun altında duran yuvarlak
    paylaşım butonu — tur sayfasındaki (PhotoGrid) paylaşım penceresiyle
    birebir aynı popup'ı açar (kopyala / WhatsApp / e-posta / Telegram /
    Facebook / X). */
export default function ShareButton({ title, description, imageUrl, path, locale, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={SHARE_LABEL[locale]}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={
          className ??
          'flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40'
        }
      >
        <Share className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <SharePopup
          title={title}
          description={description}
          imageUrl={imageUrl}
          path={path}
          locale={locale}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
