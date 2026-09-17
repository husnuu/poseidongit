'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
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
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const [openArticleId, setOpenArticleId] = useState<string | null>(null)

  const flatArticles = useMemo(() => {
    return categories.flatMap((c) =>
      (c.articles ?? []).map((a) => ({
        ...a,
        categoryId: c._id,
        categoryTitle: c.title ?? ui.categoryFallbackTitle,
      })),
    )
  }, [categories, ui.categoryFallbackTitle])

  const filtered = useMemo(() => {
    const q = search.trim()
    return flatArticles.filter(
      (a) =>
        (activeCategory === 'all' || a.categoryId === activeCategory) &&
        articleMatches(q, locale, a.title, a.shortDescription),
    )
  }, [flatArticles, search, activeCategory, locale])

  const title = ui.metaHelpTitleFallback
  const desc = page?.shortDescription

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1
            className="text-[32px] font-extrabold uppercase leading-[1.15] sm:text-[40px] md:text-[46px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              color: 'var(--primary, #2168b8)',
            }}
          >
            {title}
          </h1>
          {desc ? (
            <p
              className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed md:text-base"
              style={{ color: 'var(--text-color, #58595b)' }}
            >
              {desc}
            </p>
          ) : null}

          <div className="mx-auto mt-8 max-w-xl">
            <label htmlFor="help-center-search" className="sr-only">
              {ui.searchLabelSrOnly}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                style={{ color: 'var(--muted, #81848b)' }}
                aria-hidden
                strokeWidth={2}
              />
              <input
                id="help-center-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ui.searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border py-3.5 pl-12 pr-4 text-[15px] outline-none transition focus:ring-2 sm:py-4 sm:text-base"
                style={{
                  fontFamily: 'var(--font-family), sans-serif',
                  borderColor: '#e2e8f0',
                  color: 'var(--secondary, #131719)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
        {categories.length > 0 && (
          <div className="mb-8 -mx-4 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 md:pb-0 md:mb-10 [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-nowrap gap-2.5 md:flex-wrap md:justify-center">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="shrink-0 whitespace-nowrap rounded-lg border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition"
                style={
                  activeCategory === 'all'
                    ? { background: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)', color: '#fff' }
                    : { background: '#fff', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }
                }
              >
                {ui.filterAllLabel}
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveCategory(c._id)}
                  className="shrink-0 whitespace-nowrap rounded-lg border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition"
                  style={
                    activeCategory === c._id
                      ? { background: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)', color: '#fff' }
                      : { background: '#fff', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }
                  }
                >
                  {c.title ?? ui.categoryFallbackTitle}
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200/90 bg-white/90 px-6 py-16 text-center">
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-zinc-600">
              {search.trim() ? ui.homeEmptySearch : ui.homeEmptyNoArticles}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((a) => {
              const isOpen = openArticleId === a._id
              return (
                <div
                  key={a._id}
                  className="overflow-hidden rounded-xl border bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenArticleId(isOpen ? null : a._id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span
                      className="text-[15px] font-bold sm:text-base"
                      style={{ color: 'var(--secondary, #131719)' }}
                    >
                      {a.title ?? ui.articleFallbackTitle}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--muted, #81848b)' }}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6">
                      <p
                        className="text-sm leading-relaxed sm:text-[15px]"
                        style={{ color: 'var(--text-color, #58595b)' }}
                      >
                        {a.shortDescription?.trim() || ui.articleBodyEmpty}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

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
