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
  }> | null
} | null

type FooterLegalProps = {
  data: FooterLegalData
  inline?: boolean
}

export default function FooterLegal({ data, inline }: FooterLegalProps) {
  if (!data) return null

  const hasText =
    data.copyrightText || data.companyLine1 || data.companyLine2
  const hasSecureLabel = data.secure3dLabel
  const logos = data.paymentLogos?.filter((item) => item?.asset) ?? []

  if (!hasText && !hasSecureLabel && logos.length === 0) return null

  const content = (
    <>
      {hasText && (
        <div className="max-w-[1000px] space-y-1 leading-7 text-white/80">
          {data.copyrightText && (
            <p className="text-white">{data.copyrightText}</p>
          )}
          {data.companyLine1 && <p>{data.companyLine1}</p>}
          {data.companyLine2 && <p>{data.companyLine2}</p>}
        </div>
      )}

      {hasSecureLabel && (
        <p className={`flex items-center gap-2 font-semibold text-white ${hasText ? 'mt-4' : 'mt-0'}`}>
          <Lock className="h-5 w-5 flex-shrink-0" aria-hidden />
          {data.secure3dLabel}
        </p>
      )}

      {logos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {logos.map((item, index) => {
            const asset = item?.asset
            if (!asset) return null
            const src = urlFor(asset).width(24).height(16).url()
            const alt = item?.alt || 'Payment method'
            return (
              <span
                key={index}
                className="flex items-center justify-center rounded bg-white px-1.5 py-1 shadow-sm"
              >
                <Image
                  src={src}
                  alt={alt}
                  width={24}
                  height={16}
                  className="h-4 w-auto object-contain"
                />
              </span>
            )
          })}
        </div>
      )}
    </>
  )

  if (inline) {
    return (
      <div className="min-w-0 flex-1" aria-label="Legal and payment information">
        {content}
      </div>
    )
  }

  return (
    <section
      className="border-t border-white/10 bg-gradient-to-b from-[#2d3b4f] to-[#1f2a3a] py-10 md:py-12"
      aria-label="Legal and payment information"
    >
      <div className="mx-auto max-w-6xl px-6">{content}</div>
    </section>
  )
}
