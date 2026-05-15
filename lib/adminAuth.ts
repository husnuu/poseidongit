/**
 * Admin auth: Bearer token + isteğe bağlı e-posta allowlist.
 * ADMIN_TOKEN: tam erişim. ALLOWED_ADMIN_EMAILS tanımlıysa girişte e-posta da kontrol edilir.
 * Biletçi: POST /api/admin/agent/login ile AGENT_LOGIN_EMAIL + şifre → JWT (AGENT_JWT_SECRET).
 *         Eski uyumluluk: Authorization: Bearer AGENT_TOKEN + X-Admin-Email (ALLOWED_AGENT_EMAILS).
 *
 * Supabase ile giriş: API rotaları `authorizeAdmin` / `authorizeAdminOrAgent` kullanır (adminAuthServer).
 */

import { ADMIN_EMAIL_HEADER as ADMIN_EMAIL_HEADER_CONST } from '@/lib/adminApiHeaders'

export const ADMIN_EMAIL_HEADER = ADMIN_EMAIL_HEADER_CONST

function parseAllowedEmails(envValue: string | undefined): string[] {
  if (!envValue || typeof envValue !== 'string') return []
  return envValue
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

const allowedAdminEmails = () => parseAllowedEmails(process.env.ALLOWED_ADMIN_EMAILS)
const allowedAgentEmails = () => parseAllowedEmails(process.env.ALLOWED_AGENT_EMAILS)

export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export function getAdminEmail(request: Request): string | null {
  const email = request.headers.get(ADMIN_EMAIL_HEADER)?.trim()
  if (!email) return null
  return email.toLowerCase()
}

export function isAdminToken(token: string | null): boolean {
  const adminToken = process.env.ADMIN_TOKEN
  return !!(token && adminToken && token === adminToken)
}

export function isAgentToken(token: string | null): boolean {
  const agentToken = process.env.AGENT_TOKEN
  return !!(token && agentToken && token === agentToken)
}

export function requireAdmin(token: string | null, email: string | null = null): boolean {
  if (!isAdminToken(token)) return false
  const allowed = allowedAdminEmails()
  if (allowed.length === 0) return true
  return !!email && allowed.includes(email)
}

/** Biletçi JWT veya statik AGENT_TOKEN sonrası e-posta allowlist (boş = her e-posta kabul). */
export function isAgentEmailAllowed(email: string | null | undefined): boolean {
  const e = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!e) return false
  const allowed = allowedAgentEmails()
  if (allowed.length === 0) return true
  return allowed.includes(e)
}

export function requireAdminOrAgent(token: string | null, email: string | null = null): boolean {
  if (isAdminToken(token)) {
    const allowed = allowedAdminEmails()
    if (allowed.length === 0) return true
    return !!email && allowed.includes(email)
  }
  if (!isAgentToken(token)) return false
  return isAgentEmailAllowed(email)
}
