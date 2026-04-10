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
    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-[#1e3a5f]">
          <HelpIcon name={iconName} className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--primary)' }}
          >
            {label}
          </p>
          <h2 className="mt-1 text-lg font-bold sm:text-xl" style={{ color: '#1e3a5f' }}>
            <Link
              href={`/yardim-merkezi/kategori/${categorySlug}`}
              className="rounded-sm transition hover:text-[#1e3a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
              style={{ fontFamily: 'var(--font-family), sans-serif' }}
            >
              {title}
            </Link>
          </h2>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted, #81848b)' }}>
          {noArticlesMessage}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-100 pt-1">
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
