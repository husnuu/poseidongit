'use client'

import { useMemo, useState } from 'react'
import HelpCategoryCard from '@/components/help-center/HelpCategoryCard'
import HelpHero from '@/components/help-center/HelpHero'
import HelpSearch from '@/components/help-center/HelpSearch'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import type { HelpCategoryWithArticles, HelpCenterPageDoc } from '@/lib/sanity/types/helpCenter'
import type { SiteLocale } from '@/lib/i18n/config'
import { helpSearchLocaleTag, type HelpCenterUiStrings } from '@/lib/i18n/strings/helpCenter'

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
  ui: HelpCenterUiStrings
  contactHref: string
}

export default function HelpCenterHome({ page, categories, whatsappHref, locale, ui, contactHref }: Props) {
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
    <div className="min-h-screen bg-zinc-50/80">
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

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:max-w-6xl lg:px-8">
        <section aria-labelledby="help-categories-heading">
          <header className="mb-8 md:mb-10">
            <p
              className="mb-1 text-sm uppercase tracking-[0.1em]"
              style={{ color: 'var(--primary)' }}
            >
              {ui.homeSectionEyebrow}
            </p>
            <h2
              id="help-categories-heading"
              className="text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:text-[36px]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
            >
              <span style={{ color: '#1e3a8a' }}>{ui.homeTopicsHeadingPrimary}</span>
              <span style={{ color: '#000' }}>{ui.homeTopicsHeadingSecondary}</span>
            </h2>
          </header>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
              <p className="text-base leading-6" style={{ color: 'var(--secondary, #131719)' }}>
                {search.trim() ? ui.homeEmptySearch : ui.homeEmptyNoArticles}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          className="mt-14"
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
