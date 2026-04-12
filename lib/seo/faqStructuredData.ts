/**
 * schema.org FAQPage — Google Rich Results (metin sayfada görünen SSS ile aynı olmalı).
 * @see https://schema.org/FAQPage
 */

/** Answer.text */
export type FaqAnswerLd = {
  '@type': 'Answer'
  text: string
}

/** Question.name + acceptedAnswer */
export type FaqQuestionLd = {
  '@type': 'Question'
  name: string
  acceptedAnswer: FaqAnswerLd
}

/** FAQPage.mainEntity dizisi için girdi (schema.org alan adları) */
export type FaqMainEntityInput = {
  name: string
  text: string
}

export type FaqPageLd = {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  url?: string
  mainEntity: FaqQuestionLd[]
}

/**
 * CMS / UI’da genelde `question` + `answer` tutulur; JSON-LD’de Question.name ve Answer.text olur.
 */
export function faqPairsFromQuestionAnswer(
  faqs: ReadonlyArray<{ question: string; answer: string }>
): FaqMainEntityInput[] {
  return faqs.map((f) => ({ name: f.question, text: f.answer }))
}

export function buildFaqPageLd(
  mainEntity: ReadonlyArray<FaqMainEntityInput>,
  options?: { url?: string }
): FaqPageLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(options?.url ? { url: options.url } : {}),
    mainEntity: mainEntity.map((item) => ({
      '@type': 'Question',
      name: item.name,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.text,
      },
    })),
  }
}
