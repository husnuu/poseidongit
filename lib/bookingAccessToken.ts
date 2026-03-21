/**
 * Secure access token for booking-specific routes (voucher PDF, ticket page).
 * Token is generated once per booking and stored in Firestore; required in URL for access.
 */

import { getFirestore } from '@/lib/firebaseAdmin'
import crypto from 'crypto'

const COLLECTION = 'bookings'

/** Minimum length for token (bytes before encoding). */
const TOKEN_BYTES = 32

/**
 * Generates a cryptographically secure random token for a booking.
 * Use this when creating a new booking and store the result in Firestore.
 */
export function generateBookingAccessToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url')
}

/**
 * Validates that the given token matches the booking's stored accessToken.
 * Returns true only if the booking exists and token matches (constant-time compare).
 * Old bookings without accessToken will fail validation (return false).
 */
export async function validateBookingAccessToken(
  bookingId: string,
  token: string | null | undefined
): Promise<boolean> {
  const t = typeof token === 'string' ? token.trim() : ''
  if (!bookingId?.trim() || !t) return false
  const db = getFirestore()
  const snap = await db.collection(COLLECTION).doc(bookingId.trim()).get()
  if (!snap.exists) return false
  const stored = (snap.data() as { accessToken?: string } | undefined)?.accessToken
  if (typeof stored !== 'string' || stored.length === 0) return false
  // URL'den gelen token'da boşluk + olarak gelmiş olabilir; karşılaştırmadan önce aynı forma getir
  const normalizedInput = t.includes(' ') ? t.replace(/ /g, '+') : t
  const a = Buffer.from(normalizedInput, 'utf8')
  const b = Buffer.from(stored, 'utf8')
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
