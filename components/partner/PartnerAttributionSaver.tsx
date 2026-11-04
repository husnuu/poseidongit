'use client'

import { useEffect } from 'react'
import { savePartnerRef } from '@/lib/partner/attribution'

/** Mini sayfaya gelen misafirin sonraki rezervasyonu bu partnere yazılır. */
export default function PartnerAttributionSaver({ slug }: { slug: string }) {
  useEffect(() => {
    const channel = new URLSearchParams(window.location.search).get('k') === 'qr' ? 'qr' : 'link'
    savePartnerRef({ slug, channel })
  }, [slug])
  return null
}
