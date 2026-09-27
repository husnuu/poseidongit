'use client'

import type { ContactPageUiStrings } from '@/lib/i18n/strings/contactPage'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'

const CARD_BG = '#f5f6f7'
const TITLE_COLOR = 'var(--secondary, #131719)'
const VALUE_COLOR = 'var(--secondary, #131719)'
const ACCENT_COLOR = 'var(--primary, #2168b8)'
// Referans siteyle birebir: satır ikonları mavi değil, koyu/siyah çizgi ikon
const ICON_COLOR = 'var(--secondary, #131719)'
const ICON_SIZE = 26

export interface ContactSidebarData {
  email?: string | null
  businessHours?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  youtubeUrl?: string | null
  youtubeLabel?: string | null
  instagramUrl?: string | null
  instagramLabel?: string | null
}

const iconStyle = { width: ICON_SIZE, height: ICON_SIZE, color: ICON_COLOR }

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle} aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function Row({
  title,
  children,
  icon,
}: {
  title: string
  children: React.ReactNode
  icon: React.ReactNode
}) {
  return (
    <li className="flex gap-4 first:mt-0 mt-4" style={{ gap: 14 }}>
      <span className="flex-shrink-0 flex items-center justify-center" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="uppercase tracking-wide font-extrabold"
          style={{ fontSize: 12, color: TITLE_COLOR, lineHeight: 1.3, fontWeight: 800 }}
        >
          {title}
        </div>
        <div
          className="mt-0.5 text-[15px] leading-snug font-bold"
          style={{ color: VALUE_COLOR, fontSize: 14, fontWeight: 700 }}
        >
          {children}
        </div>
      </div>
    </li>
  )
}

function AccentLink({
  href,
  children,
  ariaLabel,
}: {
  href: string
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="hover:underline transition-colors hover:opacity-90 font-bold"
      style={{ color: ACCENT_COLOR, fontWeight: 700 }}
    >
      {children}
    </a>
  )
}

/** Instagram satırı: referans siteyle birebir — düz mavi değil, markanın
    turuncu/pembe/mor gradyanıyla renklendirilmiş kalın metin. */
function InstagramGradientLink({
  href,
  children,
  ariaLabel,
}: {
  href: string
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-block bg-clip-text font-bold text-transparent transition-opacity hover:opacity-85"
      style={{
        backgroundImage: 'linear-gradient(90deg, #f9a34b 0%, #e0507a 45%, #8b3bb8 100%)',
        fontWeight: 700,
      }}
    >
      {children}
    </a>
  )
}

export type ContactSidebarLabels = Pick<
  ContactPageUiStrings,
  | 'sidebarAria'
  | 'rowEmail'
  | 'rowHours'
  | 'rowAddress'
  | 'rowPhone'
  | 'rowWhatsapp'
  | 'rowFriends'
  | 'rowInspired'
  | 'ariaEmailSend'
  | 'ariaOpenMaps'
  | 'ariaCall'
  | 'ariaWhatsapp'
  | 'ariaYoutube'
  | 'ariaInstagram'
>

export default function ContactSidebar({
  data,
  labels,
}: {
  data: ContactSidebarData
  labels: ContactSidebarLabels
}) {
  const hasAny =
    data.email ||
    data.businessHours ||
    data.address ||
    data.phone ||
    data.whatsapp ||
    data.youtubeUrl ||
    data.instagramUrl

  if (!hasAny) return null

  const mapsHref = data.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
    : null
  const whatsappHref = buildWhatsAppHref(data.whatsapp)

  return (
    <aside
      className="w-full lg:sticky lg:self-start"
      style={{ top: 32 }}
      aria-label={labels.sidebarAria}
    >
      <div
        className="rounded-xl w-full"
        style={{
          backgroundColor: CARD_BG,
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          borderRadius: 12,
          padding: '22px 24px',
        }}
      >
        <ul className="list-none p-0 m-0">
          {data.email && (
            <Row title={labels.rowEmail} icon={<EmailIcon />}>
              <AccentLink href={`mailto:${data.email}`} ariaLabel={`${labels.ariaEmailSend}: ${data.email}`}>
                {data.email}
              </AccentLink>
            </Row>
          )}
          {data.businessHours && (
            <Row title={labels.rowHours} icon={<ClockIcon />}>
              <span>{data.businessHours}</span>
            </Row>
          )}
          {data.address && (
            <Row title={labels.rowAddress} icon={<MapPinIcon />}>
              {mapsHref ? (
                <AccentLink href={mapsHref} ariaLabel={labels.ariaOpenMaps}>
                  {data.address}
                </AccentLink>
              ) : (
                <span>{data.address}</span>
              )}
            </Row>
          )}
          {data.phone && (
            <Row title={labels.rowPhone} icon={<PhoneIcon />}>
              <AccentLink href={`tel:${data.phone.replace(/\s/g, '')}`} ariaLabel={`${labels.ariaCall}: ${data.phone}`}>
                {data.phone}
              </AccentLink>
            </Row>
          )}
          {whatsappHref && (
            <Row title={labels.rowWhatsapp} icon={<WhatsappIcon />}>
              <AccentLink href={whatsappHref} ariaLabel={labels.ariaWhatsapp}>
                {data.phone || data.whatsapp}
              </AccentLink>
            </Row>
          )}
          {data.instagramUrl && (
            <Row title={labels.rowInspired} icon={<InstagramIcon />}>
              <InstagramGradientLink href={data.instagramUrl} ariaLabel={labels.ariaInstagram}>
                {data.instagramLabel || 'Follow us on Instagram'}
              </InstagramGradientLink>
            </Row>
          )}
          {data.youtubeUrl && (
            <Row title={labels.rowFriends} icon={<YoutubeIcon />}>
              <AccentLink href={data.youtubeUrl} ariaLabel={labels.ariaYoutube}>
                {data.youtubeLabel || 'Find us on Youtube'}
              </AccentLink>
            </Row>
          )}
        </ul>
      </div>
    </aside>
  )
}
