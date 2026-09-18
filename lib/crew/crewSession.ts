import { SignJWT, jwtVerify } from 'jose'

/** Ekip uygulaması (/ekip) — tek ortak şifreyle giriş, admin panelinden bağımsız oturum. */
export const CREW_SESSION_COOKIE = 'pb_crew_session'
export const CREW_SESSION_MAX_AGE_SEC = 60 * 60 * 12 // 12 saat (vardiya boyu)

const JWT_ALG = 'HS256'

function getCrewJwtSecretKey(): Uint8Array {
  const s = process.env.CREW_JWT_SECRET?.trim() || process.env.ADMIN_JWT_SECRET?.trim()
  if (!s || s.length < 24) {
    throw new Error('CREW_JWT_SECRET (veya ADMIN_JWT_SECRET) tanımlı olmalı (en az 24 karakter).')
  }
  return new TextEncoder().encode(s)
}

export async function signCrewSessionToken(): Promise<string> {
  return new SignJWT({ role: 'crew' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject('crew')
    .setIssuedAt()
    .setExpirationTime(`${CREW_SESSION_MAX_AGE_SEC}s`)
    .sign(getCrewJwtSecretKey())
}

export async function verifyCrewSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token.trim(), getCrewJwtSecretKey(), {
      algorithms: [JWT_ALG],
    })
    return payload.role === 'crew'
  } catch {
    return false
  }
}

export function crewSessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}

/** Sunucu bileşenlerinde/route'larda ekip oturumunu doğrular. */
export async function getCrewSessionFromCookieValue(value: string | undefined): Promise<boolean> {
  if (!value?.trim()) return false
  return verifyCrewSessionToken(value)
}

function extractCrewTokenFromRequest(request: Request): string | null {
  const raw = request.headers.get('cookie')
  if (!raw) return null
  for (const seg of raw.split(';')) {
    const part = seg.trim()
    const eq = part.indexOf('=')
    if (eq <= 0) continue
    const name = part.slice(0, eq).trim()
    if (name !== CREW_SESSION_COOKIE) continue
    const value = part.slice(eq + 1).trim()
    if (value) return decodeURIComponent(value)
  }
  return null
}

/** API route'larında ekip oturumu şart koşar. */
export async function requireCrewSession(request: Request): Promise<boolean> {
  const token = extractCrewTokenFromRequest(request)
  if (!token) return false
  return verifyCrewSessionToken(token)
}
