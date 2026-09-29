'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { withLocalePath } from '@/lib/i18n/paths'
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

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 448 512" height="16" width="16" aria-hidden>
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157m-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6m101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6" />
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
  const contactHref = withLocalePath(locale ?? 'tr', '/contact')

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
          <div className={styles.faqList}>
            {faqs!.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <div key={index} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionItemLine}
                    aria-expanded={isOpen}
                    onClick={() => toggleFAQ(index)}
                  >
                    <ChevronDown
                      className={styles.accordionItemIcon}
                      data-open={isOpen ? 'true' : 'false'}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className={styles.accordionItemTitle}>{faq.question}</span>
                  </button>

                  {isOpen && (
                    <div className={styles.accordionItemContent}>
                      <p className={styles.accordionItemParagraph}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
        <div className={styles.contactActions}>
          <Link href={contactHref} className={styles.contactBtn}>
            <span>{tourUi.faqContactCta}</span>
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <WhatsAppIcon />
              <span>{tourUi.faqWhatsappCta}</span>
            </a>
          )}
        </div>
      </div>
      )}
    </section>
  )
}
