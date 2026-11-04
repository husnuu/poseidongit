'use client'

import { useState } from 'react'
import { Check, Copy, Download, Printer } from 'lucide-react'
import { partnerQrImagePath, partnerShareUrl } from '@/lib/partner/links'

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Kopyalayın:', text)
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-[#131719] hover:bg-zinc-50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Kopyalandı' : label}
    </button>
  )
}

/** QR kodu, oda kartı baskısı, paylaşım bağlantısı ve WhatsApp mesajı. Admin ve partner paneli ortak. */
export default function PartnerShareKit({
  slug,
  name,
  logoData,
  baseUrl,
}: {
  slug: string
  name: string
  logoData?: string | null
  baseUrl: string
}) {
  const link = partnerShareUrl(baseUrl, slug, 'link')
  const whatsappText = [
    `Merhaba, ${name} misafirlerine özel Çeşme tekne turlarını buradan inceleyip online rezervasyon yapabilirsiniz:`,
    link,
    '',
    `Hello! As a guest of ${name}, you can browse Çeşme boat tours and book online here:`,
    link,
  ].join('\n')

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Yalnızca bu kart yazdırılır (A6 oda kartı). */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 print:border-0 print:p-0">
        <div
          id="partner-qr-card"
          className="mx-auto flex w-full max-w-[300px] flex-col items-center rounded-lg border border-zinc-200 p-5 text-center print:max-w-[105mm] print:border-zinc-300"
        >
          {logoData && (
            // eslint-disable-next-line @next/next/no-img-element -- küçük data URL
            <img src={logoData} alt="" className="mb-2 h-14 w-14 object-contain" />
          )}
          <p className="break-words text-base font-black text-[#131719]">{name}</p>
          <p className="mt-1 text-xs text-zinc-600">Misafirlerimize özel Çeşme tekne turları</p>
          <p className="text-xs text-zinc-500">Boat tours for our guests</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- API'den üretilen QR */}
          <img src={partnerQrImagePath(slug)} alt={`${name} QR kodu`} className="mt-3 h-48 w-48" />
          <p className="mt-2 text-xs font-bold text-[#131719]">Telefonunuzla okutun · Scan with your phone</p>
          <p className="mt-1 text-[11px] text-zinc-500">Rezervasyonlar Poseidon güvencesiyle</p>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 print:hidden">
          <a
            href={partnerQrImagePath(slug, { download: true })}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            QR indir (PNG)
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-[#131719] hover:bg-zinc-50"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Oda kartını yazdır
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 print:hidden">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-black text-[#131719]">Paylaşım bağlantısı</p>
          <p className="mt-1 text-xs text-zinc-500">Misafirlerinize gönderin; rezervasyonlar otomatik size yazılır.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 basis-52 break-all rounded-md bg-zinc-50 px-3 py-2 text-xs text-[#131719]">{link}</code>
            <CopyButton text={link} label="Kopyala" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-black text-[#131719]">WhatsApp karşılama mesajı</p>
          <p className="mt-1 text-xs text-zinc-500">Check-in öncesi veya sonrasında misafire gönderebilirsiniz.</p>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-zinc-50 p-3 text-xs leading-relaxed text-[#131719]" style={{ fontFamily: 'inherit' }}>
            {whatsappText}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={whatsappText} label="Mesajı kopyala" />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              WhatsApp’ta aç
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
