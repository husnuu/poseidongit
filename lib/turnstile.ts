/**
 * Cloudflare Turnstile server-side verification.
 * POST https://challenges.cloudflare.com/turnstile/v0/siteverify
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
  success: boolean
  /** error codes when success is false */
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstileToken(
  token: string,
  options?: { remoteip?: string }
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set')
    return { success: false, 'error-codes': ['missing-secret'] }
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    ...(options?.remoteip ? { remoteip: options.remoteip } : {}),
  })

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    return { success: false, 'error-codes': ['verify-request-failed'] }
  }

  const data = (await res.json()) as TurnstileVerifyResult
  return data
}
