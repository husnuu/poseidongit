import Link from 'next/link'

export type BreadcrumbItem = { label: string; href?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: Props) {
  if (!items.length) return null
  return (
    <nav aria-label="Sayfa konumu" className={className}>
      <ol
        className="flex flex-wrap items-center gap-1.5 text-sm"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--muted, #81848b)' }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-zinc-300" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm text-zinc-700 underline-offset-4 transition-colors hover:text-[#1e3a8a] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-medium text-zinc-900' : undefined}
                  aria-current={isLast ? 'page' : undefined}
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
