import { SignJWT, jwtVerify } from 'jose'

const JWT_ALG = 'HS256'

/** Biletçi oturumu (tarayıcıda sessionStorage Bearer). */
export const AGENT_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 gün

function getAgentJwtSecretBytes(): Uint8Array {
  const s = process.env.AGENT_JWT_SECRET?.trim()
  if (!s || s.length < 24) {
    throw new Error('AGENT_JWT_SECRET tanımlı olmalı (en az 24 karakter).')
  }
  return new TextEncoder().encode(s)
}

export async function signAgentSessionToken(email: string): Promise<string> {
  const em = email.trim().toLowerCase()
  return new SignJWT({ role: 'agent', email: em })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject('agent')
    .setIssuedAt()
    .setExpirationTime(`${AGENT_SESSION_MAX_AGE_SEC}s`)
    .sign(getAgentJwtSecretBytes())
}

/** AGENT_JWT_SECRET yoksa veya token geçersizse null döner (throw etmez). */
export async function verifyAgentSessionToken(token: string): Promise<{ email: string } | null> {
  const s = process.env.AGENT_JWT_SECRET?.trim()
  if (!s || s.length < 24) return null
  try {
    const { payload } = await jwtVerify(token.trim(), new TextEncoder().encode(s), {
      algorithms: [JWT_ALG],
    })
    if (payload.role !== 'agent') return null
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
    if (!email) return null
    return { email }
  } catch {
    return null
  }
}
