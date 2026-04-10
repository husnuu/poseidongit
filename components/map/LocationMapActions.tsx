'use client'

import { MessageCircle, Navigation } from 'lucide-react'
import {
  buildDirectionsUrlFromManagedLocationLink,
  buildGoogleDirectionsUrl,
  buildWhatsappShareLocationUrl,
  buildWhatsappUrlFromManagedLocationLink,
} from '@/lib/mapLinks'

type LocationMapActionsProps = {
  /** Sanity: Paylaş → Bağlantıyı kopyala. Doluysa yol tarifi ve WhatsApp yalnızca buna gider. */
  managedLocationUrl?: string | null
  address?: string | null
  mapEmbedUrl?: string | null
  /** WhatsApp metninin ilk satırı (örn. tur adı veya "Ofis") */
  contextLabel?: string | null
  /** Tur sayfası: daha kompakt; iletişim: daha büyük */
  variant?: 'tour' | 'contact'
  className?: string
  /** Boşsa Türkçe varsayılan (tur sayfası uyumluluğu) */
  directionsLabel?: string
  shareWhatsappLabel?: string
  ariaLabel?: string
}

export default function LocationMapActions({
  managedLocationUrl,
  address,
  mapEmbedUrl,
  contextLabel,
  variant = 'contact',
  className = '',
  directionsLabel = 'Yol tarifi al',
  shareWhatsappLabel = 'Konumu WhatsApp’ta paylaş',
  ariaLabel = 'Konum işlemleri',
}: LocationMapActionsProps) {
  const managed = typeof managedLocationUrl === 'string' ? managedLocationUrl.trim() : ''
  const directionsHref = managed
    ? buildDirectionsUrlFromManagedLocationLink(managed)
    : buildGoogleDirectionsUrl(address, mapEmbedUrl)
  const whatsappHref = managed
    ? buildWhatsappUrlFromManagedLocationLink(managed, contextLabel)
    : buildWhatsappShareLocationUrl(address, mapEmbedUrl, contextLabel)

  if (!directionsHref && !whatsappHref) return null

  const isTour = variant === 'tour'
  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a8a]'
  const btnTour =
    'border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 sm:text-sm'
  const btnContact =
    'border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50 sm:px-5 sm:py-3'
  const btnClass = `${btnBase} ${isTour ? btnTour : btnContact}`
  const waClass = `${btnClass} text-[#128C7E] border-[#128C7E]/30 hover:bg-[#128C7E]/5`

  return (
    <div
      className={`flex flex-wrap gap-2 sm:gap-3 ${isTour ? 'mt-3' : 'mt-4'} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {directionsHref && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          style={{ color: '#1e3a5f', borderColor: 'rgba(30, 58, 95, 0.25)' }}
        >
          <Navigation className="h-4 w-4 shrink-0" aria-hidden />
          {directionsLabel}
        </a>
      )}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={waClass}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {shareWhatsappLabel}
        </a>
      )}
    </div>
  )
}
