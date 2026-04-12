/**
 * Edge middleware için HS256 JWT doğrulama (jose yok — Edge’te jose/CompressionStream uyumsuz).
 * `signAdminSessionToken` / `jwtVerify` ile aynı format (protected header alg: HS256).
 */
const encoder = new TextEncoder()

function base64UrlToBytes(s: string): Uint8Array {
  const padLen = (4 - (s.length % 4)) % 4
  const base64 = (s + '='.repeat(padLen)).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let x = 0
  for (let i = 0; i < a.length; i++) x |= a[i] ^ b[i]
  return x === 0
}

/**
 * Admin oturum çerezindeki JWT’yi doğrular (middleware / Edge).
 */
export async function verifyAdminSessionTokenEdge(
  token: string,
  secret: string,
): Promise<{ sub: string; email: string } | null> {
  const t = token.trim()
  if (!secret || secret.length < 24 || !t) return null

  const parts = t.split('.')
  if (parts.length !== 3) return null
  const [h64, p64, s64] = parts

  let headerRaw: unknown
  let payloadRaw: unknown
  try {
    headerRaw = JSON.parse(new TextDecoder().decode(base64UrlToBytes(h64)))
    payloadRaw = JSON.parse(new TextDecoder().decode(base64UrlToBytes(p64)))
  } catch {
    return null
  }

  const header = headerRaw as { alg?: string }
  if (header.alg !== 'HS256') return null

  const payload = payloadRaw as { sub?: unknown; email?: unknown; exp?: unknown }
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return null

  const sub = typeof payload.sub === 'string' ? payload.sub.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!sub || !email) return null

  let sigBytes: Uint8Array
  try {
    sigBytes = base64UrlToBytes(s64)
  } catch {
    return null
  }

  const signingInput = `${h64}.${p64}`
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signingInput)),
  )
  if (!timingSafeEqual(mac, sigBytes)) return null

  return { sub, email }
}
