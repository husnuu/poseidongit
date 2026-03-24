'use client'

import { useId, useState } from 'react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import { Info } from 'lucide-react'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtFAQAccordion.module.css'

export interface YachtFaqItem {
  question?: string
  answer?: PortableTextBlock[]
}

interface YachtFAQAccordionProps {
  items: YachtFaqItem[]
}

export default function YachtFAQAccordion({ items }: YachtFAQAccordionProps) {
  const list = items.filter((x) => x.question?.trim() && x.answer?.length)
  if (list.length === 0) return null

  const baseId = useId()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className={styles.section} aria-labelledby={`${baseId}-faq-h`}>
      <div className={styles.headerRow}>
        <div className={styles.headerIcon} aria-hidden>
          <Info className={styles.headerIconSvg} strokeWidth={2} />
        </div>
        <h2 id={`${baseId}-faq-h`} className={`${headingStyles.h2} ${styles.faqHeading}`}>
          Sık sorulan sorular
        </h2>
      </div>
      <ul className={styles.list}>
        {list.map((item, i) => {
          const isOpen = open === i
          const panelId = `${baseId}-panel-${i}`
          const btnId = `${baseId}-btn-${i}`
          return (
            <li key={`${item.question}-${i}`} className={styles.item}>
              <button
                type="button"
                id={btnId}
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className={styles.plus} aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
                <span className={styles.qText}>{item.question!.trim()}</span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className={isOpen ? styles.panel : styles.panelHidden}
              >
                <div className={styles.answer}>
                  <PortableText value={item.answer!} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
