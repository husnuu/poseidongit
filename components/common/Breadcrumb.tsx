import Link from 'next/link'

export type BreadcrumbItem = { label: string; href?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
  /** Ekran okuyucu etiketi — varsayılan TR; diğer locale'lerde çağıran taraf geçebilir. */
  ariaLabel?: string
}

export default function Breadcrumb({ items, className = '', ariaLabel = 'Sayfa konumu' }: Props) {
  if (!items.length) return null
  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol
        className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden text-xs"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--muted, #81848b)' }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li
              key={`${item.label}-${i}`}
              className={`flex min-w-0 items-center gap-1.5 ${isLast ? 'flex-1' : 'shrink-0'}`}
            >
              {i > 0 && (
                <span className="shrink-0 text-zinc-300" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="shrink-0 rounded-sm text-zinc-700 underline-offset-4 transition-colors hover:text-[#1e3a8a] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'block min-w-0 truncate text-zinc-900' : undefined}
                  aria-current={isLast ? 'page' : undefined}
                  title={isLast ? item.label : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
