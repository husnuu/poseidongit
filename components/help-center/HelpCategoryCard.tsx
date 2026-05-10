import Link from 'next/link'
import HelpArticleItem from '@/components/help-center/HelpArticleItem'
import { HelpIcon } from '@/components/help-center/helpIcons'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type HelpCategoryCardArticle = {
  _id: string
  slug?: string | null
  title?: string | null
  shortDescription?: string | null
}

type Props = {
  locale: SiteLocale
  categorySlug: string
  title: string
  shortDescription?: string | null
  iconName?: string | null
  articles: HelpCategoryCardArticle[]
  categoryEyebrowFallback: string
  noArticlesMessage: string
  articleFallbackTitle: string
}

export default function HelpCategoryCard({
  locale,
  categorySlug,
  title,
  shortDescription,
  iconName,
  articles,
  categoryEyebrowFallback,
  noArticlesMessage,
  articleFallbackTitle,
}: Props) {
  const label = shortDescription?.trim() || categoryEyebrowFallback

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-zinc-100/90 bg-white p-5 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.07)] transition-all duration-300 hover:border-[#1e3a8a]/18 hover:shadow-[0_16px_44px_-10px_rgba(30,58,138,0.14)] sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e40af]/8 text-[#1e3a5f] ring-1 ring-[#1e3a8a]/10 transition-transform duration-300 group-hover:scale-[1.03]">
          <HelpIcon name={iconName} className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1e3a8a]/90"
          >
            {label}
          </p>
          <h2 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-[#1e3a5f] sm:text-[1.15rem]">
            <Link
              href={`/yardim-merkezi/kategori/${categorySlug}`}
              className="rounded-sm text-inherit transition-colors hover:text-[#1e3a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
              style={{ fontFamily: 'var(--font-family), sans-serif' }}
            >
              {title}
            </Link>
          </h2>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {noArticlesMessage}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100/90 border-t border-zinc-100/80 pt-0.5 sm:mt-5">
          {articles.map((a) =>
            a.slug ? (
              <HelpArticleItem
                key={a._id}
                href={withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${a.slug}`)}
                title={a.title ?? articleFallbackTitle}
                shortDescription={a.shortDescription}
              />
            ) : null
          )}
        </ul>
      )}
    </article>
  )
}
