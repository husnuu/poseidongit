import Image from 'next/image'
import { Lock } from 'lucide-react'
import { urlFor } from '@/lib/sanity'

export type FooterLegalData = {
  copyrightText?: string | null
  companyLine1?: string | null
  companyLine2?: string | null
  secure3dLabel?: string | null
  paymentLogos?: Array<{
    asset?: { _ref?: string } | null
    alt?: string | null
    filename?: string | null
  }> | null
  /** ETBİS doğrulama adresi (Sanity'de doldurulunca rozet görünür). */
  etbisUrl?: string | null
  etbisQr?: { _ref?: string } | null
  etbisLabel?: string | null
} | null

const CARD_BRAND_NAMES: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  troy: 'Troy',
  maestro: 'Maestro',
}

/** Alt metni boş logolar için yüklenen dosyanın adından marka adı (visa.svg → Visa). */
function paymentLogoAlt(alt: string | null | undefined, filename: string | null | undefined): string {
  if (alt?.trim()) return alt.trim()
  const stem = (filename ?? '').replace(/\.[a-z0-9]+$/i, '').trim().toLowerCase()
  if (!stem) return 'Payment method'
  return CARD_BRAND_NAMES[stem] ?? stem.charAt(0).toUpperCase() + stem.slice(1)
}

type FooterLegalProps = {
  data: FooterLegalData
  inline?: boolean
  /** Bölge etiketi (erişilebilirlik); dil ile uyumlu metin geçin */
  regionAriaLabel?: string
}

export default function FooterLegal({ data, inline, regionAriaLabel = 'Legal and payment information' }: FooterLegalProps) {
  if (!data) return null

  const hasText =
    data.copyrightText || data.companyLine1 || data.companyLine2
  const hasSecureLabel = data.secure3dLabel
  const logos = data.paymentLogos?.filter((item) => item?.asset) ?? []

  const etbisUrl = data.etbisUrl && /^https?:\/\//i.test(data.etbisUrl) ? data.etbisUrl : null

  if (!hasText && !hasSecureLabel && logos.length === 0 && !etbisUrl) return null

  const content = (
    <>
      {hasText && (
        <div className="max-w-[1000px] space-y-1 text-sm font-medium leading-7 text-white">
          {data.copyrightText && (
            <p className="font-semibold text-white">{data.copyrightText}</p>
          )}
          {data.companyLine1 && <p>{data.companyLine1}</p>}
          {data.companyLine2 && <p>{data.companyLine2}</p>}
        </div>
      )}

      {hasSecureLabel && (
        <p
          className={`inline-flex items-center gap-2 text-xs font-semibold text-white ${hasText ? 'mt-4' : 'mt-0'}`}
        >
          <Lock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          {data.secure3dLabel}
        </p>
      )}

      {logos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {logos.map((item, index) => {
            const asset = item?.asset
            if (!asset) return null
            const src = urlFor(asset).width(32).height(22).auto('format').url()
            const alt = paymentLogoAlt(item?.alt, item?.filename)
            return (
              <span
                key={index}
                className="flex items-center justify-center rounded bg-white px-1.5 py-1 shadow-sm"
              >
                <Image
                  src={src}
                  alt={alt}
                  width={32}
                  height={22}
                  className="h-5 w-auto max-h-5 object-contain"
                />
              </span>
            )
          })}
        </div>
      )}

      {etbisUrl && (
        <a
          href={etbisUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-3 rounded-lg bg-white py-1.5 pl-1.5 pr-3 text-[11px] font-bold uppercase leading-tight tracking-wide text-[#131719] shadow-sm transition-opacity hover:opacity-90"
        >
          {data.etbisQr?._ref ? (
            <Image
              src={urlFor(data.etbisQr).width(112).height(112).url()}
              alt="ETBİS"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          ) : null}
          <span>{data.etbisLabel || "ETBİS'e kayıtlıdır"}</span>
        </a>
      )}
    </>
  )

  if (inline) {
    return (
      <div className="min-w-0 flex-1" aria-label={regionAriaLabel}>
        {content}
      </div>
    )
  }

  return (
    <section
      className="border-t border-[#20293a] bg-[#101729] py-10 md:py-12"
      aria-label={regionAriaLabel}
    >
      <div className="mx-auto max-w-6xl px-6">{content}</div>
    </section>
  )
}
