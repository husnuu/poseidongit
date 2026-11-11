'use client'

import { ArrowRight, Check, Loader2 } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { EMBED_COPY } from '@/lib/embed/copy'

export type EmbedHandoff = { kind: 'pay' | 'cash'; href: string }

/**
 * Widget'ta rezervasyon kaydedildikten sonra, misafir sitemize yönlendirilirken
 * görünen ekran. Yönlendirme tarayıcıca engellenirse bağlantı (target="_top",
 * kullanıcı tıklaması) aynı işi görür.
 */
export default function EmbedHandoffPanel({
  handoff,
  locale,
  onNewBooking,
}: {
  handoff: EmbedHandoff
  locale: SiteLocale
  onNewBooking: () => void
}) {
  const copy = EMBED_COPY[locale]
  const pay = handoff.kind === 'pay'
  return (
    <div role="status" className="py-4 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="m-0 text-[20px] font-extrabold text-[#131719]">{pay ? copy.redirectTitle : copy.cashTitle}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-zinc-600">
        {pay ? copy.redirectBody : copy.cashBody}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        cesmetekneturu.net
      </p>
      <a
        href={handoff.href}
        target="_top"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary,#2168b8)] px-5 text-[15px] font-bold text-white hover:opacity-95"
      >
        {pay ? copy.redirectCta : copy.cashCta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
      <button
        type="button"
        onClick={onNewBooking}
        className="mt-4 text-[13px] font-semibold text-zinc-500 underline-offset-2 hover:text-[#131719] hover:underline"
      >
        {copy.newBooking}
      </button>
    </div>
  )
}
