import type { ContactPageUiStrings } from '@/lib/i18n/strings/contactPage'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'

// schemaTypes/contactPage.ts'deki instagramLabel/youtubeLabel alanlarının
// hiç değiştirilmemiş varsayılan (initialValue) metinleri — bkz. aşağıdaki
// instagramText/youtubeText hesaplaması.
const PLACEHOLDER_INSTAGRAM_LABEL = 'Follow us on Instagram'
const PLACEHOLDER_YOUTUBE_LABEL = 'Find us on Youtube'
// İkonlar mavi kutu içinde değil, sade koyu çizgi ikon (sitenin genel dili).
const ICON_COLOR = 'var(--secondary, #131719)'
const ICON_SIZE = 24

export interface ContactSidebarData {
  mapEmbedUrl?: string | null
  locationMapLink?: string | null
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

// Instagram satırının ikonu: markanın gerçek uygulama ikonu gibi, rozet
// şeklinde renkli conic-gradient arka plan üzerinde beyaz glif.
const INSTAGRAM_BADGE_GRADIENT =
  'conic-gradient(from 103591deg, rgb(254, 218, 117), rgb(250, 126, 30), rgb(214, 41, 118), rgb(150, 47, 191), rgb(79, 91, 213), rgb(254, 218, 117))'

function InstagramIcon() {
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{ width: ICON_SIZE, height: ICON_SIZE, background: INSTAGRAM_BADGE_GRADIENT }}
    >
      <svg viewBox="0 0 24 24" fill="#fff" style={{ width: ICON_SIZE * 0.6, height: ICON_SIZE * 0.6 }} aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </span>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
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
  | 'instagramFallbackLabel'
  | 'youtubeFallbackLabel'
  | 'officeTitle'
  | 'directionsCta'
  | 'socialTitle'
  | 'mapIframeTitle'
>

/** Büyük harfli etiketleri ("BİZİ ARAYIN") kutularda cümle düzeninde göstermek
    yerine olduğu gibi küçük, aralıklı başlık olarak kullanıyoruz. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted,#81848b)]">{children}</span>
  )
}

/** Sayfanın üstündeki hızlı iletişim kutuları: Ara / WhatsApp / E-posta.
    Her biri tek dokunuşla ilgili uygulamayı açan büyük bir bağlantı. */
export function ContactQuickActions({ data, labels }: { data: ContactSidebarData; labels: ContactSidebarLabels }) {
  const whatsappHref = buildWhatsAppHref(data.whatsapp)
  const items = [
    data.phone
      ? {
          key: 'phone',
          href: `tel:${data.phone.replace(/\s/g, '')}`,
          label: labels.rowPhone,
          value: data.phone,
          aria: `${labels.ariaCall}: ${data.phone}`,
          icon: <PhoneIcon />,
          external: false,
        }
      : null,
    whatsappHref
      ? {
          key: 'whatsapp',
          href: whatsappHref,
          label: labels.rowWhatsapp,
          value: data.whatsapp || data.phone || '',
          aria: labels.ariaWhatsapp,
          icon: <WhatsappIcon />,
          external: true,
        }
      : null,
    data.email
      ? {
          key: 'email',
          href: `mailto:${data.email}`,
          label: labels.rowEmail,
          value: data.email,
          aria: `${labels.ariaEmailSend}: ${data.email}`,
          icon: <EmailIcon />,
          external: false,
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x != null)

  if (items.length === 0) return null

  return (
    <ul
      className={`m-0 grid list-none grid-cols-1 gap-3 p-0 sm:gap-4 ${items.length === 3 ? 'sm:grid-cols-3' : items.length === 2 ? 'sm:grid-cols-2' : ''}`}
    >
      {items.map((it) => (
        <li key={it.key}>
          <a
            href={it.href}
            aria-label={it.aria}
            {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group flex h-full items-center gap-4 rounded-2xl border border-[#d3dce6] bg-white px-5 py-4 transition-colors duration-200 hover:border-[#8a9db3] sm:py-5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">{it.icon}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Eyebrow>{it.label}</Eyebrow>
              <span className="truncate text-[16px] font-extrabold text-[var(--secondary,#131719)]">{it.value}</span>
            </span>
            <span className="shrink-0 text-[var(--muted,#81848b)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary,#2168b8)]">
              <ArrowUpRightIcon />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Sağ sütun: ofis adresi, çalışma saatleri, küçük harita + yol tarifi ve
    sosyal medya bağlantıları. Kart yok — açık gri zemin üzerinde tek panel. */
export default function ContactSidebar({
  data,
  labels,
}: {
  data: ContactSidebarData
  labels: ContactSidebarLabels
}) {
  const hasAny = data.businessHours || data.address || data.mapEmbedUrl || data.youtubeUrl || data.instagramUrl
  if (!hasAny) return null

  const directionsHref =
    data.locationMapLink?.trim() ||
    (data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : null)

  // Sanity alanı boşken şemanın kendi İngilizce placeholder metnini ("Follow
  // us on Instagram" / "Find us on Youtube") gerçek içerik sanıp olduğu gibi
  // basmayalım — editör gerçekten özel bir metin girerse ona saygı gösterilir.
  const instagramText =
    data.instagramLabel && data.instagramLabel.trim() !== PLACEHOLDER_INSTAGRAM_LABEL
      ? data.instagramLabel
      : labels.instagramFallbackLabel
  const youtubeText =
    data.youtubeLabel && data.youtubeLabel.trim() !== PLACEHOLDER_YOUTUBE_LABEL
      ? data.youtubeLabel
      : labels.youtubeFallbackLabel

  return (
    <aside className="w-full lg:sticky lg:top-28 lg:self-start" aria-label={labels.sidebarAria}>
      <div className="overflow-hidden rounded-2xl border border-[#d3dce6] bg-[#f7f8fa]">
        <div className="p-6">
          <h2
            className="m-0 mb-5 text-[19px] font-extrabold uppercase leading-snug text-[var(--secondary,#131719)]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {labels.officeTitle}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {data.address && (
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center"><MapPinIcon /></span>
                <div className="min-w-0">
                  <Eyebrow>{labels.rowAddress}</Eyebrow>
                  <p className="m-0 mt-0.5 text-[15px] font-bold leading-snug text-[var(--secondary,#131719)]">{data.address}</p>
                </div>
              </li>
            )}
            {data.businessHours && (
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center"><ClockIcon /></span>
                <div className="min-w-0">
                  <Eyebrow>{labels.rowHours}</Eyebrow>
                  <p className="m-0 mt-0.5 text-[15px] font-bold leading-snug text-[var(--secondary,#131719)]">{data.businessHours}</p>
                </div>
              </li>
            )}
          </ul>
        </div>

        {data.mapEmbedUrl && (
          <div className="border-y border-[#d3dce6] bg-zinc-100">
            <iframe
              src={data.mapEmbedUrl}
              title={labels.mapIframeTitle}
              className="block h-[240px] w-full"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        <div className="flex flex-col gap-5 p-6">
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.ariaOpenMaps}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[var(--primary,#2168b8)] bg-white text-[14px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:bg-[var(--primary,#2168b8)]/[0.06]"
            >
              {labels.directionsCta}
              <ArrowUpRightIcon />
            </a>
          )}

          {(data.instagramUrl || data.youtubeUrl) && (
            <div>
              <Eyebrow>{labels.socialTitle}</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {data.instagramUrl && (
                  <a
                    href={data.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={labels.ariaInstagram}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d3dce6] bg-white py-1.5 pl-1.5 pr-4 text-[13px] font-bold text-[var(--secondary,#131719)] transition-colors hover:border-[#8a9db3]"
                  >
                    <InstagramIcon />
                    {instagramText}
                  </a>
                )}
                {data.youtubeUrl && (
                  <a
                    href={data.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={labels.ariaYoutube}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d3dce6] bg-white py-1.5 pl-3 pr-4 text-[13px] font-bold text-[var(--secondary,#131719)] transition-colors hover:border-[#8a9db3]"
                  >
                    <YoutubeIcon />
                    {youtubeText}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
