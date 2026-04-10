import { timingSafeEqual } from 'crypto'

/** Tanımlıysa POST /api/admin/session/login gövdesinde `panelToken` zorunlu ve buna eşit olmalı. */
export function adminLoginPanelTokenConfigured(): boolean {
  const t = process.env.ADMIN_LOGIN_TOKEN?.trim()
  return !!t && t.length > 0
}

export function verifyAdminLoginPanelToken(provided: unknown): boolean {
  const expected = process.env.ADMIN_LOGIN_TOKEN?.trim()
  if (!expected) return true
  const p = typeof provided === 'string' ? provided : ''
  try {
    const a = Buffer.from(p, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
