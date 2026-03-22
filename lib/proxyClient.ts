/**
 * Fixie (FIXIE_URL) üzerinden çıkan sabit IP ile dış HTTPS istekleri için axios instance.
 * Banka / ödeme entegrasyonlarında bu client'ı kullanın; FIXIE_URL yoksa normal axios davranır (yerel geliştirme).
 * Yalnızca Node.js runtime (API route, Server Action); Edge’de çalışmaz.
 */
import axios, { type AxiosInstance } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

function createProxyAxios(): AxiosInstance {
  const fixieUrl = process.env.FIXIE_URL?.trim()
  if (fixieUrl) {
    const agent = new HttpsProxyAgent(fixieUrl)
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

/** Çıkış IP’sini döndürür. FIXIE_URL tanımlıysa Fixie panelindeki statik IP ile eşleşmeli. */
export async function testProxyIP(): Promise<IpifyResponse> {
  const { data } = await proxyClient.get<IpifyResponse>('https://api.ipify.org?format=json')
  return data
}
