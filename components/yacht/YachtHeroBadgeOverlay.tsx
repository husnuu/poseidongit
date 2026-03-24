'use client'

import styles from './YachtHeroBadgeOverlay.module.css'

interface YachtHeroBadgeOverlayProps {
  badges: string[]
}

/** Tur kartı «En Popüler» şeridi ile aynı dilimli ribbon stili */
export default function YachtHeroBadgeOverlay({ badges }: YachtHeroBadgeOverlayProps) {
  const list = badges.map((b) => b.trim()).filter(Boolean)
  if (list.length === 0) return null

  return (
    <ul className={styles.list} aria-label="Özellikler">
      {list.map((b, i) => (
        <li key={`${i}-${b}`} className={styles.ribbon}>
          <span className={styles.ribbonText}>{b}</span>
        </li>
      ))}
    </ul>
  )
}
