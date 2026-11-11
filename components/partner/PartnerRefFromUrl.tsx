'use client'

import { useEffect } from 'react'
import { savePartnerRef } from '@/lib/partner/attribution'
import { PARTNER_REF_PARAM } from '@/lib/partner/links'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Partner widget'ından sitenin herhangi bir sayfasına gelen misafir
 * (`?pref=otel-adi&k=widget`, örn. yat kiralama): partner saklanır ve parametre
 * adres çubuğundan temizlenir (paylaşılan linkler/kanonik adres temiz kalsın).
 * Sonraki yat teklifi/kaporası veya tur rezervasyonu bu partnere yazılır.
 */
export default function PartnerRefFromUrl() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const slug = url.searchParams.get(PARTNER_REF_PARAM)
    if (!slug) return
    if (SLUG_REGEX.test(slug)) {
      savePartnerRef({ slug, channel: url.searchParams.get('k') === 'widget' ? 'widget' : 'link' })
    }
    url.searchParams.delete(PARTNER_REF_PARAM)
    url.searchParams.delete('k')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [])
  return null
}
