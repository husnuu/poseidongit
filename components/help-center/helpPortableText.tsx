import type { PortableTextComponents } from '@portabletext/react'

export const helpArticlePortableComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h2
        className="mb-4 mt-10 text-2xl font-black uppercase tracking-wide text-[#1e3a5f] first:mt-0"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
      >
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h3
        className="mb-3 mt-8 text-xl font-bold text-[#1e3a5f]"
        style={{ fontFamily: 'var(--font-family), sans-serif' }}
      >
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4
        className="mb-2 mt-6 text-lg font-bold text-zinc-900"
        style={{ fontFamily: 'var(--font-family), sans-serif' }}
      >
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p
        className="mb-4 text-base leading-relaxed"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
      >
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-[#2168b8]/40 pl-4 text-zinc-600">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul
        className="mb-4 ml-5 list-disc space-y-1"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
      >
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol
        className="mb-4 ml-5 list-decimal space-y-1"
        style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="font-medium text-[#1e3a8a] underline decoration-[#1e3a8a]/35 underline-offset-2 transition-colors hover:decoration-[#1e3a8a]"
        style={{ fontFamily: 'var(--font-family), sans-serif' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}
