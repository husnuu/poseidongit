import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import { yachtDepositPageQuery } from '@/lib/queries'
import {
  mergeYachtDepositPageLocale,
  type YachtDepositPageData,
} from '@/lib/i18n/mergeYachtDepositPageLocale'
import { getYachtDepositPageUi } from '@/lib/i18n/strings/yachtDepositPage'
import { getYachtDepositPageContent } from '@/lib/yachtDepositDefaults'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import {
  buildYachtDepositCharterConfig,
  yachtDepositContextLine,
} from '@/lib/yachtDepositCharter'
import YachtDepositCheckoutForm from '@/components/yacht/YachtDepositCheckoutForm'
import YachtDepositCharterSummary from '@/components/yacht/YachtDepositCharterSummary'
import listStyles from '../turlar/page.module.css'

export const dynamic = 'force-dynamic'

type PageData = YachtDepositPageData & {
  formOverlay?: Record<string, unknown> | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = (isSiteLocale(loc) ? loc : 'tr') as SiteLocale
  let page: PageData | null = null
  try {
    page = await client.fetch<PageData | null>(yachtDepositPageQuery, {}, { useCdn: true })
    page = mergeYachtDepositPageLocale(page, locale)
  } catch {
    page = null
  }
  const content = getYachtDepositPageContent(locale)
  const title = content.seo.title
  const description = content.seo.description
  const site = getSiteName()
  const path = locale === 'en' ? '/en/yacht-deposit' : '/yat-kapora'
  return {
    title: site ? `${title} | ${site}` : title,
    description,
    alternates: { canonical: `${getBaseUrl()}${path}` },
    robots: page?.enabled === false ? { index: false, follow: false } : undefined,
  }
}

export default async function YachtDepositPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let page: PageData | null = null
  try {
    page = await client.fetch<PageData | null>(yachtDepositPageQuery, {}, { useCdn: true })
    page = mergeYachtDepositPageLocale(page, locale)
  } catch {
    page = null
  }

  const ui = getYachtDepositPageUi(locale)

  if (!page || page.enabled === false) {
    return (
      <div className="min-h-screen bg-white">
        <section className="w-full py-20">
          <div className="mx-auto max-w-[720px] px-4 text-center">
            <p className="text-lg text-zinc-600">{ui.disabledMessage}</p>
          </div>
        </section>
      </div>
    )
  }

  const depositAmount = Number(page.depositAmount)
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) notFound()

  const { titleTop, titleBottom, intro, bullets } = getYachtDepositPageContent(locale)
  const charterConfig = buildYachtDepositCharterConfig(
    page.yacht,
    page.charterDateStart,
    page.charterDateEnd,
    locale
  )
  const contextLine = charterConfig ? yachtDepositContextLine(charterConfig, locale) : null

  return (
    <div className="min-h-screen bg-zinc-50/60">
      <section
        className="w-full py-10 pb-12 md:py-20 md:pb-20"
        aria-labelledby="yacht-deposit-heading"
      >
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-8 max-w-2xl">
            <h1 id="yacht-deposit-heading" className={listStyles.heading}>
              <span className={listStyles.headingLine1}>{titleTop}</span>
              <span className={listStyles.headingLine2}>{titleBottom}</span>
            </h1>
            <p
              className="mt-4 md:mt-6 text-base md:text-lg leading-relaxed text-black/70 whitespace-pre-wrap"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {intro}
            </p>
            {contextLine ? (
              <p
                className="mt-4 rounded-xl border border-sky-200/60 bg-sky-50/80 px-4 py-3 text-sm font-semibold leading-relaxed text-sky-950"
                style={{ fontFamily: 'var(--font-family)' }}
              >
                {contextLine}
              </p>
            ) : null}
          </header>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <aside className="order-1 w-full lg:order-2 lg:w-[400px] lg:flex-shrink-0">
              <YachtDepositCheckoutForm
                depositAmount={depositAmount}
                locale={locale}
                ui={ui}
                charterConfig={charterConfig}
              />
            </aside>

            <div className="order-2 max-w-2xl lg:order-1 lg:flex-1 lg:min-w-0">
              {charterConfig ? (
                <YachtDepositCharterSummary config={charterConfig} locale={locale} />
              ) : null}
              <ul className="m-0 list-none space-y-3 p-0">
                {bullets.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-[15px] font-medium leading-snug text-zinc-700"
                    style={{ fontFamily: 'var(--font-family)' }}
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
