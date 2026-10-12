'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, FileText, Link2, XCircle, Check } from 'lucide-react'

interface BookingRowActionsProps {
  onDetail: () => void
  pdfHref: string
  onCopyLink: () => void
  copied: boolean
  onCancel?: () => void
  cancelDisabled?: boolean
  /** İptal zaten gerçekleşmişse "İptal" seçeneği menüde gösterilmez. */
  showCancel: boolean
}

/** Önceden 3-4 ayrı buton yan yana diziliyordu (Detay / PDF / Link / İptal).
    Artık birincil "Detay" + ikincil işlemleri toplayan tek bir "•••" menüsü —
    satır başına kaplanan genişlik/yükseklik ciddi şekilde azalıyor. */
export default function BookingRowActions({
  onDetail,
  pdfHref,
  onCopyLink,
  copied,
  onCancel,
  cancelDisabled,
  showCancel,
}: BookingRowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDetail}
        className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-blue-100"
      >
        Detay
      </button>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Diğer işlemler"
          className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[170px] overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(19,23,25,0.12)]"
          >
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <FileText className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
              PDF indir
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onCopyLink()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? (
                <Check className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Link2 className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
              )}
              {copied ? 'Kopyalandı' : 'Linki kopyala'}
            </button>
            {showCancel && (
              <button
                type="button"
                role="menuitem"
                disabled={cancelDisabled}
                onClick={() => {
                  setOpen(false)
                  onCancel?.()
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="size-3.5 shrink-0" aria-hidden />
                Rezervasyonu iptal et
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
