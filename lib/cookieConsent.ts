/**
 * Ziyaretçi çerez tercihi (analitik / reklam). Admin oturumu (`pb_admin_session`) gibi
 * httpOnly zorunlu çerezler bu katmana dahil değildir ve bu seçimlerden etkilenmez.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'pb_cookie_consent_v1'

/** Tercih geçerlilik süresi (ms) — 1 yıl */
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export type CookieConsentPreferences = {
  analytics: boolean
  ads: boolean
}

export type StoredCookieConsent = CookieConsentPreferences & {
  savedAt: number
}

export const DEFAULT_POLICY_PATH = '/yasal/cerez-politikasi'

function normalizePath(p: string): string {
  const t = p.trim()
  return t.startsWith('/') ? t : `/${t}`
}

/**
 * Öncelik: Sanity’den gelen yol → NEXT_PUBLIC_COOKIE_POLICY_PATH → varsayılan.
 */
export function resolveCookiePolicyHref(sanityPath?: string | null): string {
  const fromSanity = sanityPath?.trim()
  if (fromSanity) return normalizePath(fromSanity)
  const fromEnv = process.env.NEXT_PUBLIC_COOKIE_POLICY_PATH?.trim()
  if (fromEnv) return normalizePath(fromEnv)
  return DEFAULT_POLICY_PATH
}

export function loadStoredConsent(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredCookieConsent>
    if (
      typeof parsed.savedAt !== 'number' ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.ads !== 'boolean'
    ) {
      return null
    }
    if (Date.now() - parsed.savedAt > COOKIE_CONSENT_MAX_AGE_MS) {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
      return null
    }
    return {
      savedAt: parsed.savedAt,
      analytics: parsed.analytics,
      ads: parsed.ads,
    }
  } catch {
    return null
  }
}

export function saveConsent(prefs: CookieConsentPreferences): void {
  if (typeof window === 'undefined') return
  const payload: StoredCookieConsent = {
    ...prefs,
    savedAt: Date.now(),
  }
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload))
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** GA4 Consent Mode v2 — yalnızca etiket; admin çerezlerine dokunmaz. */
export function applyGtagConsent(prefs: CookieConsentPreferences): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const analytics = prefs.analytics ? 'granted' : 'denied'
  const ads = prefs.ads ? 'granted' : 'denied'
  window.gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  })
}
