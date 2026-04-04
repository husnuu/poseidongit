/** Sunucu tarafı: admin JWT çerezi / Bearer + isteğe bağlı ADMIN_TOKEN / AGENT_TOKEN. */
import {
  extractAdminSessionTokenFromRequest,
  verifyAdminSessionToken,
} from '@/lib/adminSession'
import {
  getAuthToken,
  getAdminEmail,
  requireAdmin,
  requireAdminOrAgent,
} from '@/lib/adminAuth'

async function isValidAdminJwtRequest(request: Request): Promise<boolean> {
  const raw = extractAdminSessionTokenFromRequest(request)
  if (!raw) return false
  const p = await verifyAdminSessionToken(raw)
  return !!(p?.sub && p.email)
}

export async function authorizeAdmin(request: Request): Promise<boolean> {
  if (await isValidAdminJwtRequest(request)) return true
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!token) return false
  return requireAdmin(token, email)
}

export async function authorizeAdminOrAgent(request: Request): Promise<boolean> {
  if (await isValidAdminJwtRequest(request)) return true
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!token) return false
  return requireAdminOrAgent(token, email)
}
