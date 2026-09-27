interface CovesHeroProps {
  title: string
  description?: string | null
}

export default function CovesHero({ title, description }: CovesHeroProps) {
  const titleUpper = (title || '').toUpperCase().trim()

  return (
    <header className="mb-10 text-center md:mb-12">
      {titleUpper && (
        <h1
          className="text-[35px] font-extrabold uppercase leading-[1.15] mb-6 sm:text-[36px] md:text-[40px] lg:text-[44px] whitespace-nowrap pageHeroTitleStroke"
          style={{
            fontFamily: 'var(--font-family-title, var(--font-family))',
            color: 'var(--primary, #2168b8)',
          }}
        >
          {titleUpper}
        </h1>
      )}
      {description?.trim() && (
        <p
          className="mx-auto max-w-2xl text-base leading-relaxed"
          style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color, #58595b)' }}
        >
          {description}
        </p>
      )}
    </header>
  )
}
