import { Mail, Phone } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getHelpBannerStrings } from '@/lib/i18n/strings/helpBanner'
import { buildWhatsAppLink } from '@/lib/whatsapp'

const iconClass = 'h-8 w-8 shrink-0 text-zinc-900'

/** Konuşma balonu çizgisi (WhatsApp sütunu için nötr, ince stroke) */
function ChatBubbleOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type HelpContactBannerProps = {
  locale: SiteLocale
  email?: string | null
  phone?: string | null
  chatValue?: string | null
  openingHoursLine?: string | null
}

export default function HelpContactBanner({
  locale,
  email,
  phone,
  chatValue,
  openingHoursLine,
}: HelpContactBannerProps) {
  const t = getHelpBannerStrings(locale)
  const waUrl = buildWhatsAppLink(chatValue, phone)
  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null
  const numberForDisplay = phone?.trim() || chatValue?.trim() || ''

  const showPhoneCol = Boolean(phone && telHref)
  const showWaCol = Boolean(waUrl && numberForDisplay)
  const showEmailCol = Boolean(email)

  if (!showPhoneCol && !showWaCol && !showEmailCol) return null

  /** Mobil: telefon + WA yan yana iki sütun; masaüstü: yan yana üç blok */
  const mobileTwoCol = showPhoneCol && showWaCol

  const contactColBase =
    'flex flex-col gap-3 text-center lg:items-start lg:text-left lg:gap-2'
  const labelClass = 'text-sm font-normal text-zinc-600'
  const valueLinkClass =
    'font-bold tabular-nums text-[#1e3a5f] underline-offset-2 hover:underline'

  return (
    <section
      className="w-full border-y border-sky-100/80"
      style={{ background: 'var(--section-turquoise-bg)' }}
      aria-labelledby="help-banner-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:py-14 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:items-start">
          <div className="min-w-0 text-center lg:text-left">
            <h2
              id="help-banner-heading"
              className="mx-auto max-w-xl text-xl font-black uppercase leading-tight tracking-tight text-[#1e3a5f] sm:text-2xl md:text-[30px] lg:mx-0 lg:max-w-none"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {t.heading}
            </h2>
            <p
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-800 md:text-[17px] lg:mx-0 lg:max-w-xl"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {t.lead}
            </p>
            <div className="mx-auto mt-6 max-w-xl space-y-1.5 text-sm text-zinc-600 lg:mx-0">
              {openingHoursLine?.trim() && <p>{openingHoursLine.trim()}</p>}
              <p>{t.languagesLine}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div
              className={`grid gap-x-8 gap-y-10 lg:flex lg:flex-nowrap lg:justify-end lg:gap-10 ${
                mobileTwoCol ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {showPhoneCol && (
                <div className={`${contactColBase} items-center lg:items-start`}>
                  <Phone className={iconClass} strokeWidth={1.5} aria-hidden />
                  <span className={labelClass}>{t.phoneRegionLabel}</span>
                  <a
                    href={telHref!}
                    className={`text-lg ${valueLinkClass}`}
                    style={{ fontFamily: 'var(--font-family)' }}
                  >
                    {phone}
                  </a>
                </div>
              )}

              {showWaCol && (
                <div className={`${contactColBase} items-center lg:items-start`}>
                  <ChatBubbleOutlineIcon className={`${iconClass} h-8 w-8`} />
                  <span className={labelClass}>{t.whatsappLabel}</span>
                  <a
                    href={waUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-lg ${valueLinkClass}`}
                    style={{ fontFamily: 'var(--font-family)' }}
                  >
                    {phone?.trim() ? phone : numberForDisplay}
                  </a>
                </div>
              )}

              {showEmailCol && (
                <div
                  className={`${contactColBase} items-center lg:items-start ${mobileTwoCol ? 'col-span-2' : ''}`}
                >
                  <Mail className={iconClass} strokeWidth={1.5} aria-hidden />
                  <span className={labelClass}>{t.emailLabel}</span>
                  <a
                    href={`mailto:${email}`}
                    className={`break-all text-base ${valueLinkClass} sm:text-lg`}
                    style={{ fontFamily: 'var(--font-family)' }}
                  >
                    {email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
