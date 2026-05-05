interface CovesHeroProps {
  title: string
  description?: string | null
}

export default function CovesHero({ title, description }: CovesHeroProps) {
  const words = (title || '').toUpperCase().trim().split(/\s+/).filter(Boolean)
  const firstTwo = words.slice(0, 2).join(' ')
  const nextTwo = words.slice(2, 4).join(' ')
  const rest = words.slice(4).join(' ')

  return (
    <header className="mb-10 md:mb-12">
      <h1
        className="text-[30px] font-black uppercase leading-[1.15] mb-6 sm:text-[34px] md:text-[38px] lg:text-[42px]"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
      >
        {firstTwo ? (
          <>
            <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>
            {nextTwo ? <span style={{ color: '#000' }}>{' ' + nextTwo}</span> : null}
            {rest ? <span style={{ color: '#000' }}>{' ' + rest}</span> : null}
          </>
        ) : title?.trim() ? (
          <span style={{ color: '#1e3a8a' }}>{title.trim()}</span>
        ) : null}
      </h1>
      {description?.trim() && (
        <p
          className="max-w-4xl text-base leading-relaxed text-zinc-700"
          style={{ fontFamily: 'var(--font-family)' }}
        >
          {description}
        </p>
      )}
    </header>
  )
}
