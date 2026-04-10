interface CovesHeroProps {
  title: string
  description?: string | null
}

export default function CovesHero({ title, description }: CovesHeroProps) {
  const words = (title || '').toUpperCase().trim().split(/\s+/).filter(Boolean)
  return (
    <header className="mb-12">
      <h1
        className="text-[40px] sm:text-[48px] font-black uppercase leading-[1.1] mb-6"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
      >
        {words.length > 0 ? (
          words.map((word, i) => (
            <span key={i} style={{ color: i === 0 ? '#1e3a8a' : '#000' }}>
              {i > 0 ? ' ' : ''}
              {word}
            </span>
          ))
        ) : title ? (
          <span style={{ color: '#1e3a8a' }}>{title}</span>
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
