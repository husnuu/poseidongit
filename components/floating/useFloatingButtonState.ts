'use client'

import { useLayoutEffect, useState } from 'react'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import { COOKIE_CONSENT_BANNER_ID } from '@/lib/cookieBannerId'

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= 1023
}

function isElementVisible(id: string): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  const st = window.getComputedStyle(el)
  // Not: opacity'e bakmıyoruz — çerez bannerı gibi `transition: opacity` ile
  // açılan öğelerde, tam bu satırın çalıştığı an (mutation gözlemcisi class
  // değişimini yakaladığı an) opacity animasyonu henüz 0'dan başlamış oluyor;
  // CSS geçişleri kendileri birer DOM mutasyonu SAYILMADIĞINDAN gözlemci bir
  // daha tetiklenmiyor ve sonuç kalıcı olarak yanlış kalıyordu. `pointer-events`
  // aynı class değişiminde ANINDA (geçişsiz) değiştiği için güvenilir sinyal.
  if (st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') {
    return false
  }
  const rect = el.getBoundingClientRect()
  return rect.height > 0 && rect.width > 0
}

/**
 * Sağ alttaki sabit butonların (WhatsApp, sohbet asistanı) ortak görünürlük
 * kuralları:
 *  - relaxBottom: mobilde alt şerit yoksa buton ekranın dibine yaklaşır
 *  - hidden: mobilde çerez bannerı açıkken ("Kabul Et" gibi butonların üstüne
 *    binmesin) ve rezervasyon modalları açıkken — modallar hep aynı şekilde
 *    `document.body.style.overflow = 'hidden'` ayarlıyor, ortak sinyal o.
 */
export function useFloatingButtonState(): { relaxBottom: boolean; hidden: boolean } {
  const [relaxBottom, setRelaxBottom] = useState(false)
  const [hideForCookieBanner, setHideForCookieBanner] = useState(false)
  const [hideForOpenModal, setHideForOpenModal] = useState(false)

  useLayoutEffect(() => {
    const sync = () => {
      // data-chat-open: sohbet asistanı penceresi açık (ChatWidget) — masaüstünde
      // kaydırmayı kilitlemediği için ayrı işaret.
      setHideForOpenModal(document.body.style.overflow === 'hidden' || document.body.dataset.chatOpen === '1')

      if (!isMobileViewport()) {
        setRelaxBottom(false)
        setHideForCookieBanner(false)
        return
      }
      setRelaxBottom(!isElementVisible(MOBILE_BOTTOM_CTA_BAR_ID))
      setHideForCookieBanner(isElementVisible(COOKIE_CONSENT_BANNER_ID))
    }

    sync()
    window.addEventListener('resize', sync)

    const mo = new MutationObserver(sync)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-chat-open'] })

    return () => {
      window.removeEventListener('resize', sync)
      mo.disconnect()
    }
  }, [])

  return { relaxBottom, hidden: hideForCookieBanner || hideForOpenModal }
}
