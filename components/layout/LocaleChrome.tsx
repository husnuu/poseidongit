'use client'

import { useEffect } from 'react'
import { useSelectedLayoutSegments } from 'next/navigation'

/**
 * Header/Footer'ı sade sayfalarda (rezervasyon yönetimi) gizler. Eskiden
 * [locale]/layout.tsx bunu `headers()` ile yapıyordu; bu da sitedeki TÜM
 * sayfaları her istekte yeniden render olmaya zorluyor, önbelleği (ISR/CDN)
 * tamamen kapatıyordu. Segmentler istemci tarafında da (SSR dahil) bilinir.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments()
  if (segments[0] === 'rezervasyon' && segments[1] === 'yonet') return null
  return <>{children}</>
}

/**
 * Kök layout statik kalsın diye `<html lang>` sunucuda "tr" üretilir; içerik
 * zaten `<div lang=…>` ile sarılı ve middleware `Content-Language` başlığı
 * gönderiyor. Bu bileşen ekran okuyucular için <html lang>'ı da eşitler.
 */
export function HtmlLangSync({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
