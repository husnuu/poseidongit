'use client'

import { useMemo, useState } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './FAQAccordion.module.css'

export interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  faqs?: FAQItem[] | null
  /** RSC sınırında `tourUi` geçirilemez; verilmezse `tr`. */
  locale?: SiteLocale
  /** Başlık (verilmezse tourUi veya "Sık Sorulan Sorular"). Ara başlık stili için title verildiğinde diğer sayfalardaki gibi kullanılır. */
  title?: string | null
  /** Optional WhatsApp link for "WhatsApp'tan ulaşın" button */
  whatsappUrl?: string | null
  /** Alt kısım "Sorunuz yukarıda yok mu?" bloğunu göster (varsayılan true). FAQ sayfasında her bölümde false, en sonda tek blok için true. */
  showMissingQuestion?: boolean
}

const ChevronIcon = () => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.293 7.79297L20.7072 9.20718L12.0001 17.9143L3.29297 9.20718L4.70718 7.79297L12.0001 15.0859L19.293 7.79297Z"
      fill="currentColor"
    />
  </svg>
)

const QuestionIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12.0003 16.9983C12.5528 16.9983 13.0007 16.5506 13.0007 15.9983C13.0007 15.4461 12.5528 14.9983 12.0003 14.9983C11.4479 14.9983 11 15.4461 11 15.9983C11 16.5506 11.4479 16.9983 12.0003 16.9983ZM11 14H13C13 13.2016 13.1254 13.0553 13.9472 12.6444C15.3754 11.9303 16 11.2016 16 9.5C16 7.32063 14.2843 6 12 6C9.79086 6 8 7.79086 8 10H10C10 8.89543 10.8954 8 12 8C13.2772 8 14 8.55641 14 9.5C14 10.2984 13.8746 10.4447 13.0528 10.8556C11.6246 11.5697 11 12.2984 11 14Z"
      fill="currentColor"
    />
  </svg>
)

export default function FAQAccordion({
  faqs,
  locale,
  title,
  whatsappUrl,
  showMissingQuestion = true,
}: FAQAccordionProps) {
  const tourUi = useMemo(() => getTourPageUi(locale ?? 'tr'), [locale])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const hasTitle = !!title?.trim()
  const hasFaqs = !!(faqs && faqs.length > 0)

  if (!hasFaqs && !showMissingQuestion) return null

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const titleContent = hasTitle ? title : tourUi.faqDefaultTitle
  const isSectionTitle = hasTitle

  return (
    <section className={styles.faq}>
      {(hasFaqs || hasTitle) && (
      <h2
        className={isSectionTitle ? styles.faqTitleSection : styles.faqTitle}
      >
        {titleContent}
      </h2>
      )}

      {hasFaqs && (
        <div className={styles.faqWrapper}>
          <ul className={styles.faqList}>
            {faqs!.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <li
                  key={index}
                  className={styles.accordionItem}
                  data-open={isOpen ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    className={styles.accordionItemLine}
                    aria-expanded={isOpen}
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className={styles.accordionItemIcon} aria-hidden>
                      <ChevronIcon />
                    </span>
                    <span className={styles.accordionItemTitle}>{faq.question}</span>
                  </button>

                  <div className={styles.accordionItemInner}>
                    <div className={styles.accordionItemContent}>
                      <p className={styles.accordionItemParagraph}>{faq.answer}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {showMissingQuestion && (
      <div className={styles.missingQuestion}>
        <div className={styles.missingQuestionLeft}>
          <span className={styles.missingQuestionIcon}>
            <QuestionIcon />
          </span>
          <p>{tourUi.faqMissingQuestion}</p>
        </div>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.missingQuestionCta}
          >
            {tourUi.faqWhatsappCta}
          </a>
        ) : (
          <button type="button" className={styles.missingQuestionCta}>
            {tourUi.faqWhatsappCta}
          </button>
        )}
      </div>
      )}
    </section>
  )
}
