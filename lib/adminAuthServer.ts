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
  isAgentEmailAllowed,
} from '@/lib/adminAuth'
import { verifyAgentSessionToken } from '@/lib/agentSession'

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
  const emailHeader = getAdminEmail(request)
  if (token) {
    const agentSession = await verifyAgentSessionToken(token)
    if (agentSession) {
      if (!isAgentEmailAllowed(agentSession.email)) return false
      return true
    }
  }
  if (!token) return false
  return requireAdminOrAgent(token, emailHeader)
}
