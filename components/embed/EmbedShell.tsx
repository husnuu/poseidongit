'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { EMBED_MESSAGE_SOURCE } from '@/lib/embed/options'

function widgetId(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('wid')
  } catch {
    return null
  }
}

/** Widget'ı gömen sayfaya mesaj (yükseklik, yukarı kaydırma). Gömülü değilse sessizce geçer. */
export function postToEmbedParent(type: 'height' | 'scrollTop' | 'navigate', payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || window.parent === window) return
  // Buton modunda iframe kendi içinde kayar; otomatik yükseklikte bu çağrı etkisizdir.
  if (type === 'scrollTop') window.scrollTo(0, 0)
  window.parent.postMessage({ source: EMBED_MESSAGE_SOURCE, id: widgetId(), type, ...payload }, '*')
}

/**
 * Misafiri widget'tan sitemize götürür (ödeme/onay sayfası): dış sayfanın
 * kendisi yönlenir, iframe içinde kalınmaz. widget.js mesajı alıp sayfayı
 * yönlendirir; widget doğrudan <iframe> ile gömülmüşse üst sayfayı biz
 * yönlendirmeyi deneriz (tarayıcı izin vermezse ekrandaki bağlantı kalır).
 */
export function navigateEmbedTop(path: string) {
  const url = new URL(path, window.location.origin).toString()
  if (window.parent === window) {
    window.location.assign(url)
    return
  }
  postToEmbedParent('navigate', { url })
  window.setTimeout(() => {
    try {
      if (window.top) window.top.location.href = url
    } catch {
      /* çapraz kaynak engeli: "Açılmadıysa tıklayın" bağlantısı kullanılır */
    }
  }, 900)
}

/**
 * Widget kabuğu: içerik yüksekliğini dış sayfaya bildirir (iframe kendini
 * boyutlandırır, iç kaydırma çubuğu çıkmaz) ve widget dışına giden
 * bağlantıları yeni sekmede açar — sitenin geri kalanı iframe içinde
 * açılamadığı için (X-Frame-Options) aksi halde boş kutu görünürdü.
 */
export default function EmbedShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const firstPath = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let last = 0
    const report = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      if (h !== last) {
        last = h
        postToEmbedParent('height', { height: h })
      }
    }
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false
      return
    }
    postToEmbedParent('scrollTop')
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      // Hedefi açıkça verilmiş bağlantılara (_blank, _top) dokunulmaz.
      if (!a || (a.target && a.target !== '_self')) return
      let url: URL
      try {
        url = new URL(a.href, window.location.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return
      if (url.origin === window.location.origin && url.pathname.startsWith('/embed/')) return
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <div ref={ref} className="bg-white" style={{ fontFamily: 'var(--font-family)' }}>
      {children}
    </div>
  )
}
