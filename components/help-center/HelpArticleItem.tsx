import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Props = {
  href: string
  title: string
  shortDescription?: string | null
}

export default function HelpArticleItem({ href, title, shortDescription }: Props) {
  return (
    <li>
      <Link
        href={href}
        className="group flex w-full items-start gap-3 rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:border-zinc-100 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 sm:px-3 sm:py-3"
      >
        <span className="min-w-0 flex-1">
          <span
            className="block font-medium text-zinc-900 transition-colors group-hover:text-[#1e3a8a]"
            style={{ fontFamily: 'var(--font-family), sans-serif' }}
          >
            {title}
          </span>
          {shortDescription ? (
            <span
              className="mt-0.5 line-clamp-2 text-sm leading-snug"
              style={{ color: 'var(--secondary, #131719)' }}
            >
              {shortDescription}
            </span>
          ) : null}
        </span>
        <ChevronRight
          className="mt-1 h-5 w-5 shrink-0 text-[#1e3a5f] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1e3a8a]"
          aria-hidden
          strokeWidth={2}
        />
      </Link>
    </li>
  )
}
