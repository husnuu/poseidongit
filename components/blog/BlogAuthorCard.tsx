import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import styles from './BlogAuthorCard.module.css'

export type BlogAuthorCardData = {
  name?: string | null
  title?: string | null
  note?: string | null
  photoUrl?: string | null
}

const CTA_LABEL: Record<SiteLocale, string> = {
  tr: 'TURLARI KEŞFET',
  en: 'EXPLORE THE TOURS',
  de: 'TOUREN ENTDECKEN',
  ru: 'СМОТРЕТЬ ТУРЫ',
}

/**
 * Blog yazısının altındaki yazar/kaptan kartı. İçerik tamamen Sanity'deki
 * gerçek `host` kaydından gelir (bkz. blogAuthorCardQuery) — uydurma metin
 * yok. İsim veya fotoğraf yoksa kart hiç render edilmez; biyografi yoksa
 * yalnızca isim + CTA gösterilir.
 */
export default function BlogAuthorCard({
  author,
  locale = 'tr',
}: {
  author: BlogAuthorCardData | null
  locale?: SiteLocale
}) {
  if (!author?.name || !author.photoUrl) return null

  const paragraphs = (author.note ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <aside className={styles.card} aria-label={author.name}>
      <span className={styles.avatarWrap}>
        <Image
          src={author.photoUrl}
          alt={author.name}
          width={120}
          height={120}
          className={styles.avatar}
          sizes="120px"
        />
      </span>

      <p className={styles.name}>{author.name}</p>
      {author.title ? <p className={styles.role}>{author.title}</p> : null}

      {paragraphs.map((p, i) => (
        <p key={i} className={styles.body}>
          {p}
        </p>
      ))}

      <Link href={withLocalePath(locale, '/turlar')} className={styles.cta}>
        {CTA_LABEL[locale]}
      </Link>
    </aside>
  )
}
