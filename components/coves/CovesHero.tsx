import { MapPin } from 'lucide-react'
import styles from './CovesHero.module.css'

interface CovesHeroProps {
  title: string
  description?: string | null
  /** Gerçek koy sayısı — uydurma bir rakam değil, sayfadaki öğe sayısından gelir. */
  count?: number
  countLabel?: string
}

export default function CovesHero({ title, description, count, countLabel }: CovesHeroProps) {
  const titleUpper = (title || '').toUpperCase().trim()

  return (
    <header className="mb-10 text-center md:mb-14">
      {count != null && count > 0 && countLabel && (
        <span
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
          style={{ color: 'var(--primary, #2168b8)', fontFamily: 'var(--font-family)' }}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {countLabel}
        </span>
      )}
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
