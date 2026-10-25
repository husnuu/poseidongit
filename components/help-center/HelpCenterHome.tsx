'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutGrid, Plus, Search, X } from 'lucide-react'
import { HelpIcon } from '@/components/help-center/helpIcons'
import { withLocalePath } from '@/lib/i18n/paths'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import type { HelpArticleListItem, HelpCategoryWithArticles, HelpCenterPageDoc } from '@/lib/sanity/types/helpCenter'
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

  /* Kategori çipleri mobilde yatay kayıyor; sağ kenardaki mavi parlama
     kaydırılacak çip kaldığını gösterir ve sona gelince kayboluyor. */
  const chipRailRef = useRef<HTMLDivElement>(null)
  const [chipsScrollable, setChipsScrollable] = useState(false)

  const measureChipRail = useCallback(() => {
    const el = chipRailRef.current
    if (!el) return
    setChipsScrollable(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    measureChipRail()
    window.addEventListener('resize', measureChipRail)
    return () => window.removeEventListener('resize', measureChipRail)
  }, [measureChipRail, categories.length])

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

  /** Sorular her zaman kategori başlıklarıyla gruplu: "Tümü"nde hepsi,
      bir konu seçiliyken yalnızca o konu. Arama her iki durumda da süzer. */
  const groups = useMemo(() => {
    const q = search.trim()
    return categories
      .filter((c) => activeCategory === 'all' || c._id === activeCategory)
      .map((c) => ({
        id: c._id,
        slug: c.slug ?? null,
        iconName: c.iconName ?? null,
        title: c.title ?? ui.categoryFallbackTitle,
        articles: (c.articles ?? []).filter((a) => articleMatches(q, locale, a.title, a.shortDescription)),
      }))
      .filter((g) => g.articles.length > 0)
  }, [categories, activeCategory, search, locale, ui.categoryFallbackTitle])

  const title = ui.metaHelpTitleFallback
  const totalCount = flatArticles.length
  const query = search.trim()

  const selectCategory = (id: string | 'all') => {
    setActiveCategory(id)
    setOpenArticleId(null)
  }

  const renderArticle = (a: HelpArticleListItem, categorySlug: string | null) => {
    const isOpen = openArticleId === a._id
    const panelId = `help-answer-${a._id}`
    const articleHref = categorySlug && a.slug ? withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${a.slug}`) : null
    return (
      <div key={a._id} className="border-b border-[#e8edf3]">
        <button
          type="button"
          onClick={() => setOpenArticleId(isOpen ? null : a._id)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group flex w-full items-center justify-between gap-5 py-5 text-left"
        >
          <span
            className={`text-[15.5px] font-bold leading-snug transition-colors sm:text-[16px] ${isOpen ? 'text-[var(--primary,#2168b8)]' : 'text-[var(--secondary,#131719)] group-hover:text-[var(--primary,#2168b8)]'}`}
          >
            {a.title ?? ui.articleFallbackTitle}
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? 'rotate-45 border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)] text-white' : 'border-[#d3dce6] text-[var(--secondary,#131719)] group-hover:border-[#8a9db3]'}`}
            aria-hidden
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </span>
        </button>
        {/* grid-rows 0fr → 1fr: yüksekliği bilinmeyen içerik için yumuşak açılış. */}
        <div
          id={panelId}
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="pb-6 pr-0 sm:pr-14">
              <p className="m-0 text-[15px] leading-[1.7] text-[var(--text-color,#58595b)]">
                {a.shortDescription?.trim() || ui.articleBodyEmpty}
              </p>
              {articleHref && (
                <Link
                  href={articleHref}
                  tabIndex={isOpen ? 0 : -1}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] hover:underline"
                >
                  {ui.openArticle}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const topicButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-bold transition-colors ${
      active
        ? 'bg-[rgba(33,104,184,0.08)] text-[var(--primary,#2168b8)]'
        : 'text-[var(--secondary,#131719)] hover:bg-[#f4f7fb]'
    }`

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[460px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #dbeafe, rgba(219,234,254,0))' }}
        aria-hidden
      />

      {/* ── Başlık + arama ── */}
      <section className="w-full pb-10 pt-14 md:pb-14 md:pt-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="pageSectionHeading">{title}</h1>

          <div className="mx-auto mt-6 max-w-2xl">
            <label htmlFor="help-center-search" className="sr-only">
              {ui.searchLabelSrOnly}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--secondary,#131719)]"
                aria-hidden
                strokeWidth={2.2}
              />
              <input
                id="help-center-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ui.searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                className="h-14 w-full rounded-2xl border border-[#d3dce6] bg-white pl-14 pr-12 text-[16px] font-medium text-[var(--secondary,#131719)] outline-none transition placeholder:font-normal placeholder:text-[#9aa0a6] focus:border-[var(--primary,#2168b8)] focus:ring-4 focus:ring-[rgba(33,104,184,0.12)] [&::-webkit-search-cancel-button]:hidden sm:h-[60px]"
                style={{ fontFamily: 'var(--font-family), sans-serif' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={ui.clearSearch}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted,#81848b)] transition hover:bg-[#f4f7fb] hover:text-[var(--secondary,#131719)]"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-3 min-h-[20px] text-[13px] font-semibold text-[var(--muted,#81848b)]" aria-live="polite">
              {query ? (filtered.length > 0 ? ui.searchCountListed(filtered.length) : ui.searchCountNone) : ''}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
          {/* ── Konular: masaüstünde yapışkan menü, mobilde yatay çipler ── */}
          {categories.length > 0 && (
            <nav aria-label={ui.topicsTitle} className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <p className="mb-3 hidden px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted,#81848b)] lg:block">
                {ui.topicsTitle}
              </p>
              <ul className="m-0 hidden list-none flex-col gap-1 p-0 lg:flex">
                <li>
                  <button type="button" onClick={() => selectCategory('all')} className={topicButtonClass(activeCategory === 'all')}>
                    <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={1.9} aria-hidden />
                    <span className="flex-1">{ui.filterAllLabel}</span>
                    <span className="text-[12px] font-bold tabular-nums text-[var(--muted,#81848b)]">{totalCount}</span>
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c._id}>
                    <button type="button" onClick={() => selectCategory(c._id)} className={topicButtonClass(activeCategory === c._id)}>
                      <HelpIcon name={c.iconName} className="h-5 w-5 shrink-0" strokeWidth={1.9} />
                      <span className="flex-1 leading-snug">{c.title ?? ui.categoryFallbackTitle}</span>
                      <span className="text-[12px] font-bold tabular-nums text-[var(--muted,#81848b)]">{c.articles?.length ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="relative -mx-4 lg:hidden">
                <div
                  ref={chipRailRef}
                  onScroll={measureChipRail}
                  className="overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex flex-nowrap gap-2">
                    {[{ _id: 'all' as const, title: ui.filterAllLabel, iconName: null as string | null }, ...categories].map((c) => {
                      const active = activeCategory === c._id
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => selectCategory(c._id)}
                          className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
                            active
                              ? 'border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)] text-white'
                              : 'border-[#d3dce6] bg-white text-[var(--secondary,#131719)]'
                          }`}
                        >
                          {c._id === 'all' ? (
                            <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
                          ) : (
                            <HelpIcon name={c.iconName} className="h-4 w-4" strokeWidth={2} />
                          )}
                          {c.title ?? ui.categoryFallbackTitle}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {chipsScrollable ? (
                  <span className="help-chip-glow pointer-events-none absolute inset-y-0 right-0 w-20" aria-hidden />
                ) : null}
              </div>
            </nav>
          )}

          {/* ── Sorular ── */}
          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d3dce6] px-6 py-16 text-center">
                <p className="mx-auto max-w-md text-[15px] leading-relaxed text-[var(--text-color,#58595b)]">
                  {query ? ui.homeEmptySearch : ui.homeEmptyNoArticles}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {groups.map((group) => (
                  <section key={group.id} aria-labelledby={`help-group-${group.id}`}>
                    <div className="mb-1 flex items-center gap-3">
                      <HelpIcon name={group.iconName} className="h-6 w-6 shrink-0 text-[var(--secondary,#131719)]" strokeWidth={1.9} />
                      <h2
                        id={`help-group-${group.id}`}
                        className="m-0 flex-1 text-[18px] font-extrabold uppercase leading-snug text-[var(--secondary,#131719)] sm:text-[20px]"
                        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
                      >
                        {group.slug ? (
                          <Link href={withLocalePath(locale, `/yardim-merkezi/kategori/${group.slug}`)} className="hover:text-[var(--primary,#2168b8)]">
                            {group.title}
                          </Link>
                        ) : (
                          group.title
                        )}
                      </h2>
                      <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--muted,#81848b)]">
                        {ui.questionCount(group.articles.length)}
                      </span>
                    </div>
                    <div className="border-t border-[#e8edf3]">
                      {group.articles.map((a) => renderArticle(a, group.slug))}
                    </div>
                  </section>
                ))}
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
              layout="row"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
