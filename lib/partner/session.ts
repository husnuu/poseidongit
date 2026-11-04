import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getPartnerAccountById, type PartnerAccount } from '@/lib/partner/partners'

/**
 * Partner paneli (/partner) oturumu — admin ve ekip oturumlarından bağımsız.
 * Secret bilerek ADMIN_JWT_SECRET'e düşmez: aynı anahtarla imzalanan partner
 * token'ı admin doğrulamasından geçebilirdi.
 */
export const PARTNER_SESSION_COOKIE = 'pb_partner_session'
export const PARTNER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 gün

const JWT_ALG = 'HS256'

function partnerJwtSecret(): Uint8Array | null {
  const s = process.env.PARTNER_JWT_SECRET?.trim()
  return s && s.length >= 24 ? new TextEncoder().encode(s) : null
}

export function isPartnerSessionConfigured(): boolean {
  return partnerJwtSecret() !== null
}

export async function signPartnerSessionToken(partnerId: string): Promise<string> {
  const secret = partnerJwtSecret()
  if (!secret) throw new Error('PARTNER_JWT_SECRET tanımlı olmalı (en az 24 karakter).')
  return new SignJWT({ role: 'partner' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(partnerId)
    .setIssuedAt()
    .setExpirationTime(`${PARTNER_SESSION_MAX_AGE_SEC}s`)
    .sign(secret)
}

export function partnerSessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}

/**
 * Oturumdaki partneri döndürür. Her çağrıda veritabanına bakılır: pasife alınan
 * partner hemen düşer, şifre değişince eski oturumlar geçersiz olur.
 */
export async function getPartnerFromSession(): Promise<PartnerAccount | null> {
  const secret = partnerJwtSecret()
  if (!secret) return null
  const jar = await cookies()
  const token = jar.get(PARTNER_SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [JWT_ALG] })
    if (payload.role !== 'partner' || typeof payload.sub !== 'string') return null
    const partner = await getPartnerAccountById(payload.sub)
    if (!partner?.isActive) return null
    const changedAtSec = Math.floor(new Date(partner.passwordChangedAt).getTime() / 1000)
    if (typeof payload.iat === 'number' && payload.iat < changedAtSec) return null
    return partner
  } catch {
    return null
  }
}
