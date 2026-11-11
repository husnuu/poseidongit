import { ShieldCheck } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { EMBED_COPY } from '@/lib/embed/copy'

/** Küçük "Poseidon güvencesi" satırı — widget'ın kime ait olduğu belli olsun. */
export default function EmbedFooter({ locale }: { locale: SiteLocale }) {
  return (
    <p className="m-0 flex items-center justify-center gap-1.5 py-4 text-[12px] font-semibold text-zinc-400">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {EMBED_COPY[locale].poweredBy}
      <span aria-hidden>·</span>
      <a href="https://cesmetekneturu.net" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">
        cesmetekneturu.net
      </a>
    </p>
  )
}
