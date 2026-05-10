'use client'

import { useMemo, useState } from 'react'
import HelpCategoryCard from '@/components/help-center/HelpCategoryCard'
import HelpHero from '@/components/help-center/HelpHero'
import HelpSearch from '@/components/help-center/HelpSearch'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import type { HelpCategoryWithArticles, HelpCenterPageDoc } from '@/lib/sanity/types/helpCenter'
import type { SiteLocale } from '@/lib/i18n/config'
import { getHelpCenterUiStrings, helpSearchLocaleTag } from '@/lib/i18n/strings/helpCenter'

function normalizeSearch(s: string, locale: SiteLocale) {
  return s.toLocaleLowerCase(helpSearchLocaleTag(locale)).trim()
}

function articleMatches(
  q: string,
  locale: SiteLocale,
  title?: string | null,
  desc?: string | null,
) {
  if (!q) return true
  const n = normalizeSearch(q, locale)
  return normalizeSearch(title ?? '', locale).includes(n) || normalizeSearch(desc ?? '', locale).includes(n)
}

type Props = {
  page: HelpCenterPageDoc | null
  categories: HelpCategoryWithArticles[]
  whatsappHref: string | null
  locale: SiteLocale
  contactHref: string
}

export default function HelpCenterHome({ page, categories, whatsappHref, locale, contactHref }: Props) {
  const ui = useMemo(() => getHelpCenterUiStrings(locale), [locale])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim()
    return categories
      .map((c) => ({
        ...c,
        articles: (c.articles ?? []).filter((a) =>
          articleMatches(q, locale, a.title, a.shortDescription),
        ),
      }))
      .filter((c) => c.articles.length > 0)
  }, [categories, search, locale])

  const resultCount = useMemo(
    () => filtered.reduce((acc, c) => acc + c.articles.length, 0),
    [filtered]
  )

  const title = page?.title?.trim() || ui.metaHelpTitleFallback
  const desc = page?.shortDescription
  const eyebrow = page?.heroEyebrow?.trim() || null

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100/90 via-white to-zinc-50">
      <HelpHero
        title={title}
        description={desc}
        eyebrow={eyebrow}
        heroImage={page?.heroImage ?? null}
      >
        <HelpSearch
          id="help-center-search"
          value={search}
          onChange={setSearch}
          placeholder={ui.searchPlaceholder}
          labelSrOnly={ui.searchLabelSrOnly}
          countNone={ui.searchCountNone}
          countListed={ui.searchCountListed}
          resultCount={resultCount}
          showCount
        />
      </HelpHero>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 lg:max-w-6xl lg:px-8 lg:pb-20 lg:pt-14">
        <section aria-labelledby="help-categories-heading">
          <header className="mb-10 md:mb-12">
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e3a8a]"
            >
              {ui.homeSectionEyebrow}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <h2
                id="help-categories-heading"
                className="max-w-3xl text-[26px] font-black uppercase leading-[1.12] tracking-tight sm:text-[30px] md:text-[34px]"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
              >
                <span style={{ color: '#1e3a8a' }}>{ui.homeTopicsHeadingPrimary}</span>
                <span className="text-zinc-900">{ui.homeTopicsHeadingSecondary}</span>
              </h2>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-[#1e3a8a]/25 to-transparent sm:block md:mb-2" aria-hidden />
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200/90 bg-white/90 px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <p className="mx-auto max-w-md text-[15px] leading-relaxed text-zinc-600">
                {search.trim() ? ui.homeEmptySearch : ui.homeEmptyNoArticles}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
              {filtered.map((c) =>
                c.slug ? (
                  <HelpCategoryCard
                    key={c._id}
                    locale={locale}
                    categorySlug={c.slug}
                    title={c.title ?? ui.categoryFallbackTitle}
                    shortDescription={c.shortDescription}
                    iconName={c.iconName}
                    articles={c.articles}
                    categoryEyebrowFallback={ui.categoryCardEyebrowFallback}
                    noArticlesMessage={ui.noArticlesInCategoryCard}
                    articleFallbackTitle={ui.articleFallbackTitle}
                  />
                ) : null
              )}
            </div>
          )}
        </section>

        <HelpSupportCTA
          whatsappHref={whatsappHref}
          className="mt-16 lg:mt-20"
          heading={ui.supportHeading}
          description={ui.supportBody}
          whatsappCta={ui.supportWhatsappCta}
          whatsappUnavailable={ui.supportWhatsappMissing}
          contactLabel={ui.supportContactCta}
          contactHref={contactHref}
        />
      </div>
    </div>
  )
}
