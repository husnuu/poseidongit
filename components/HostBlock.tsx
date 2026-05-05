import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { TourPageUi } from '@/lib/i18n/tourPageUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './HostBlock.module.css'

interface GalleryImage {
  asset?: { _ref?: string; _type?: string }
  url?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

interface Host {
  name: string
  title?: string | string[]
  photo?: GalleryImage
  note?: string
}

interface WhyYouWillLove {
  title?: string
  text?: string
}

interface HostBlockProps {
  host?: Host | null
  whyYouWillLove?: WhyYouWillLove | null
  tourUi?: TourPageUi
}

/** Normalize host title: deduplicate parts (e.g. "Owner / Co-founder, Owner / Co-founder" → "Owner / Co-founder"). */
function uniqueTitle(title: string | string[] | undefined): string {
  if (title == null || title === '') return ''
  const parts = Array.isArray(title)
    ? title.map((t) => String(t).trim()).filter(Boolean)
    : String(title)
        .split(/[,/]+/)
        .map((s) => s.trim())
        .filter(Boolean)
  return [...new Set(parts)].join(' / ')
}

/** Split body text into paragraphs for proper spacing. */
function paragraphs(text: string | undefined): string[] {
  if (!text || !text.trim()) return []
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export default function HostBlock({ host, whyYouWillLove, tourUi: tourUiProp }: HostBlockProps) {
  const tourUi = tourUiProp ?? getTourPageUi('tr')
  const hasHost = host && (host.name || host.photo?.asset || host.note)
  const hasWhy =
    whyYouWillLove &&
    (whyYouWillLove.title?.trim() || whyYouWillLove.text?.trim())

  if (!hasHost && !hasWhy) return null

  const hostLineTitle = host?.name
    ? uniqueTitle(host.title)
    : ''
  const showHostLine = Boolean(host?.name)
  const bodyText =
    whyYouWillLove?.text?.trim() || host?.note?.trim() || ''
  const bodyParagraphs = paragraphs(bodyText)
  const rawTitle = whyYouWillLove?.title?.trim()
  const mainTitle = rawTitle
    ? rawTitle.replace(/\s+/g, ' ').toUpperCase()
    : bodyParagraphs.length > 0
      ? tourUi.hostWhyFallbackTitle
      : ''
  const avatarAsset = host?.photo?.asset

  return (
    <section
      className={styles.band}
      aria-labelledby={mainTitle ? 'host-card-title' : undefined}
    >
      <div className={styles.bandInner}>
        <div className={styles.layout}>
          <div className={styles.content}>
            {showHostLine && (
              <p className={styles.hostLine}>
                {hostLineTitle ? (
                  <>
                    {tourUi.captainLabel}: {host?.name} · {hostLineTitle}
                  </>
                ) : (
                  <>
                    {tourUi.captainLabel}: {host?.name}
                  </>
                )}
              </p>
            )}

            {mainTitle && (
              <h2 id="host-card-title" className={styles.mainTitle}>
                {mainTitle}
              </h2>
            )}

            {bodyParagraphs.length > 0 && (
              <div className={styles.body}>
                {bodyParagraphs.map((para, i) => (
                  <p key={i} className={styles.paragraph}>
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>

          {avatarAsset && (
            <div className={styles.avatarWrap}>
              <Image
                src={urlFor(avatarAsset).width(320).height(320).url()}
                alt={host?.name ?? tourUi.captainAvatarAltFallback}
                width={140}
                height={140}
                className={styles.avatarImg}
                placeholder={
                  host?.photo?.metadata?.lqip ? 'blur' : 'empty'
                }
                blurDataURL={host?.photo?.metadata?.lqip}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
