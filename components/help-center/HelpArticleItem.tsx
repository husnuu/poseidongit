import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Props = {
  href: string
  title: string
  shortDescription?: string | null
}

export default function HelpArticleItem({ href, title, shortDescription }: Props) {
  return (
    <li className="border-b border-[#e8edf3]">
      <Link
        href={href}
        className="group flex w-full items-start gap-4 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold leading-snug text-[var(--secondary,#131719)] transition-colors group-hover:text-[var(--primary,#2168b8)]">
            {title}
          </span>
          {shortDescription ? (
            <span className="mt-1.5 line-clamp-2 block text-[14px] leading-relaxed text-[var(--text-color,#58595b)]">
              {shortDescription}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d3dce6] text-[var(--secondary,#131719)] transition-all group-hover:border-[var(--primary,#2168b8)] group-hover:bg-[var(--primary,#2168b8)] group-hover:text-white">
          <ChevronRight className="h-4 w-4" aria-hidden strokeWidth={2.4} />
        </span>
      </Link>
    </li>
  )
}
