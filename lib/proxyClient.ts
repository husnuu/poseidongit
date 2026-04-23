/**
 * Sabit çıkış IP: yalnızca **Fixie** (`FIXIE_URL`). Banka whitelist’i bu IP’lere göre tanımlıysa
 * sunucudan yapılan tüm dış HTTPS istekleri (bu modülü kullananlar) bu proxy üzerinden çıkar.
 *
 * `NESTPAY_HTTPS_PROXY` / `HTTPS_PROXY` bilinçli olarak kullanılmıyor.
 *
 * Yalnızca Node.js runtime (API route, Server Action); Edge’de çalışmaz.
 */
import axios, { type AxiosInstance } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

/** Dışarı çıkış proxy’si: sadece Fixie. */
export function getOutboundHttpsProxyUrl(): string | undefined {
  return process.env.FIXIE_URL?.trim() || undefined
}

function createProxyAxios(): AxiosInstance {
  const proxyUrl = getOutboundHttpsProxyUrl()
  if (proxyUrl) {
    const agent = new HttpsProxyAgent(proxyUrl)
    return axios.create({
      httpsAgent: agent,
      httpAgent: agent,
      proxy: false,
      timeout: 60_000,
    })
  }
  return axios.create({
    proxy: false,
    timeout: 60_000,
  })
}

export const proxyClient: AxiosInstance = createProxyAxios()

export type IpifyResponse = { ip: string }

/** Çıkış IP’sini döndürür. Fixie/proxy tanımlıysa bankanın whitelist IP’leri ile eşleşmeli. */
export async function testProxyIP(): Promise<IpifyResponse> {
  const { data } = await proxyClient.get<IpifyResponse>('https://api.ipify.org?format=json')
  return data
}
