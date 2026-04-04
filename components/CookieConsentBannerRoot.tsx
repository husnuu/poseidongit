import { client } from '@/lib/sanity'
import { resolveCookiePolicyHref } from '@/lib/cookieConsent'
import { siteSettingsCookiePolicyQuery } from '@/lib/queries'
import CookieConsentBanner from '@/components/CookieConsentBanner'

export default async function CookieConsentBannerRoot() {
  let cookiePolicyPath: string | null | undefined
  try {
    const row = await client.fetch<{ cookiePolicyPath?: string | null } | null>(
      siteSettingsCookiePolicyQuery
    )
    cookiePolicyPath = row?.cookiePolicyPath ?? undefined
  } catch {
    cookiePolicyPath = undefined
  }
  const policyHref = resolveCookiePolicyHref(cookiePolicyPath)
  return <CookieConsentBanner policyHref={policyHref} />
}
