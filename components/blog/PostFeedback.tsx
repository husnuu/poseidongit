'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import styles from './PostFeedback.module.css'

const COPY: Record<SiteLocale, { question: string; yes: string; no: string; thanks: string }> = {
  tr: {
    question: 'Bu yazı faydalı oldu mu?',
    yes: 'Evet',
    no: 'Hayır',
    thanks: 'Geri bildiriminiz için teşekkürler!',
  },
  en: {
    question: 'Was this post helpful?',
    yes: 'Yes',
    no: 'No',
    thanks: 'Thanks for your feedback!',
  },
  de: {
    question: 'War dieser Beitrag hilfreich?',
    yes: 'Ja',
    no: 'Nein',
    thanks: 'Danke für Ihr Feedback!',
  },
  ru: {
    question: 'Эта статья была полезной?',
    yes: 'Да',
    no: 'Нет',
    thanks: 'Спасибо за отзыв!',
  },
}

/**
 * "Bu yazı faydalı oldu mu?" — kullanıcı tercihiyle BİLEREK yalnızca görsel:
 * oy hiçbir yere gönderilmiyor/kaydedilmiyor, sunucu tarafı yok. Tek kalıcılık
 * ziyaretçinin kendi tarayıcısında (localStorage) aynı yazıda tekrar
 * sorulmaması için. İleride gerçekten toplanmak istenirse buraya bir API
 * çağrısı eklemek yeterli.
 */
export default function PostFeedback({ slug, locale = 'tr' }: { slug: string; locale?: SiteLocale }) {
  const copy = COPY[locale] ?? COPY.tr
  const storageKey = `poseidon_post_feedback_${slug}`
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey)) setVoted(true)
    } catch {
      /* localStorage kapalı olabilir — sorun değil, soru gösterilir */
    }
  }, [storageKey])

  function vote(value: 'yes' | 'no') {
    setVoted(true)
    try {
      window.localStorage.setItem(storageKey, value)
    } catch {
      /* no-op */
    }
  }

  return (
    <div className={styles.wrap} role="group" aria-label={copy.question}>
      {voted ? (
        <p className={styles.thanks} role="status">
          {copy.thanks}
        </p>
      ) : (
        <>
          <span className={styles.question}>{copy.question}</span>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => vote('yes')}>
              <ThumbsUp className={styles.icon} strokeWidth={2} aria-hidden />
              {copy.yes}
            </button>
            <button type="button" className={styles.btn} onClick={() => vote('no')}>
              <ThumbsDown className={styles.icon} strokeWidth={2} aria-hidden />
              {copy.no}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
