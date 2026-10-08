import styles from './CovesHero.module.css'

interface CovesHeroProps {
  title: string
  description?: string | null
}

export default function CovesHero({ title, description }: CovesHeroProps) {
  const titleUpper = (title || '').toUpperCase().trim()

  return (
    <header className="mb-10 text-center md:mb-14">
      {titleUpper && <h1 className={styles.title}>{titleUpper}</h1>}
      {description?.trim() && (
        <p
          className="mx-auto max-w-2xl text-base leading-relaxed md:text-lg"
          style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color, #58595b)' }}
        >
          {description}
        </p>
      )}
    </header>
  )
}
