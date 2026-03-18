'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !(window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) return
    if (pathname === prevPathRef.current) return
    prevPathRef.current = pathname
    ;(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('config', GA_MEASUREMENT_ID, {
      page_path: pathname || '/',
    })
  }, [pathname])

  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  )
}
