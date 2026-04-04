import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_SESSION_COOKIE = 'pb_admin_session'

const JWT_ALG = 'HS256'
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 gün

function getJwtSecretKey(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET?.trim()
  if (!s || s.length < 24) {
    throw new Error('ADMIN_JWT_SECRET tanımlı olmalı (en az 24 karakter).')
  }
  return new TextEncoder().encode(s)
}

export async function signAdminSessionToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getJwtSecretKey())
}

export async function verifyAdminSessionToken(
  token: string
): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token.trim(), getJwtSecretKey(), {
      algorithms: [JWT_ALG],
    })
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : ''
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
    if (!sub || !email) return null
    return { sub, email }
  } catch {
    return null
  }
}

/** Cookie veya `Authorization: Bearer` (JWT) */
export function extractAdminSessionTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim()
    if (t) return t
  }
  const raw = request.headers.get('cookie')
  if (!raw) return null
  const segments = raw.split(';')
  for (const seg of segments) {
    const part = seg.trim()
    const eq = part.indexOf('=')
    if (eq <= 0) continue
    const name = part.slice(0, eq).trim()
    if (name !== ADMIN_SESSION_COOKIE) continue
    const value = part.slice(eq + 1).trim()
    if (value) return decodeURIComponent(value)
  }
  return null
}

export async function verifyAdminSessionFromRequest(
  request: Request
): Promise<{ sub: string; email: string } | null> {
  const raw = extractAdminSessionTokenFromRequest(request)
  if (!raw) return null
  return verifyAdminSessionToken(raw)
}

export function adminSessionCookieOptions(maxAgeSec: number): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSec,
  }
}
