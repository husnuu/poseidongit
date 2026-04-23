import { type AxiosInstance } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { getOutboundHttpsProxyUrl, proxyClient } from '@/lib/proxyClient'

/**
 * Bankanın whitelist için bildirdiği çıkış IP’leri (referans).
 *
 * **Yalnızca `FIXIE_URL`:** `proxyClient` / `createNestpayOutboundAxios` sunucudan giden trafiği
 * sadece bu adresle proxy’ler (başka `*_PROXY` env yok).
 *
 * **Sınır:** 3D ödeme formu (`est3Dgate`) hâlâ **kullanıcının tarayıcısından** NestPay’e gider; bu adımda
 * Fixie devreye girmez (bankanın gördüğü IP müşteri çıkışıdır). Fixie yalnızca **sunucunun** HTTPS
 * çıkışları için (ör. `/fim/api`, callback doğrulama için sunucu çağrısı vb.) geçerlidir.
 */

/** Bankanın istenen çıkış IP’leri — yalnızca dokümantasyon / referans. */
export const NESTPAY_BANK_DECLARED_EGRESS_IPS = ['54.195.3.54', '54.217.142.99'] as const

/** Sunucudan NestPay / Asseco HTTPS çağrıları için — Fixie dahil `getOutboundHttpsProxyUrl()` zinciriyle aynı axios. */
export function createNestpayOutboundAxios(): AxiosInstance {
  return proxyClient
}

/** İhtiyaç halinde (ör. özel fetch) doğrudan agent; URL `getOutboundHttpsProxyUrl()` ile aynı kaynaktan. */
export function createNestpayHttpsProxyAgent(): HttpsProxyAgent<string> | undefined {
  const url = getOutboundHttpsProxyUrl()
  if (!url) return undefined
  return new HttpsProxyAgent(url)
}
