'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type HomeFaqItem = {
  question: string
  answer: string
}

type HomeFaqSectionProps = {
  items: HomeFaqItem[] | null
  locale?: SiteLocale
}

const HEADING: Record<SiteLocale, string> = {
  tr: 'SIKÇA SORULAN SORULAR',
  en: 'FREQUENTLY ASKED QUESTIONS',
  de: 'HÄUFIG GESTELLTE FRAGEN',
}

const VIEW_ALL_LABEL: Record<SiteLocale, string> = {
  tr: 'Tüm soruları görüntüle',
  en: 'View all questions',
  de: 'Alle Fragen ansehen',
}

/** CMS'te henüz yeterli soru yoksa gösterilecek varsayılan liste. */
const DEFAULT_FAQ_TR: HomeFaqItem[] = [
  {
    question: 'Tura gelirken yanımıza ne almalıyız?',
    answer:
      'Yanınızda mayo, havlu, güneş kremi, güneş gözlüğü ve şapka getirmenizi öneririz. Denize girmek isteyen misafirlerimiz için rahat bir plaj çantası da faydalı olabilir.',
  },
  {
    question: 'Teknede yemek ve içecek var mı?',
    answer:
      'Tur sırasında öğle yemeği teknede servis edilmektedir ve ücrete dahildir. Menüde tavuk veya balık, soslu makarna ve taze hazırlanmış Akdeniz salatası bulunmaktadır. İçecekler ise tekneden ekstra ücret ile temin edilebilir.',
  },
  {
    question: 'Çeşme tekne turu kaç saat sürüyor?',
    answer:
      'Turumuz yaklaşık 7 saat sürmektedir. Sabah 11:00’de Çeşme limanından hareket ediyor ve akşam 18:00 civarında tekrar limana dönüyoruz.',
  },
  {
    question: 'Yüzme bilmeyenler tura katılabilir mi?',
    answer:
      'Evet, yüzme bilmeyen misafirlerimiz de tura rahatlıkla katılabilir. Teknede yeterli sayıda can yeleği ve yüzme ekipmanları bulunmaktadır. Ayrıca yanaştığımız 2 koyda misafirlerimiz plajdan denize girebilmektedir. Yüzme molaları tamamen isteğe bağlıdır; dileyen misafirlerimiz denize girerken, isteyenler teknede kalıp manzaranın ve denizin keyfini çıkarabilir.',
  },
  {
    question: 'Teknede hangi olanaklar bulunuyor?',
    answer:
      'Poseidon 2, Çeşme’nin en yeni ve modern teknesidir. Teknede tuvalet, soyunma kabini, tatlı su duşu ve geniş oturma alanları bulunmaktadır. Misafirlerimiz için ayrıca Eco, Premium ve First Class olmak üzere farklı oturma alanı seçenekleri sunulmakta, böylece herkes konforuna ve tercihine uygun bir deneyim yaşayabilmektedir.',
  },
  {
    question: 'İptal politikası nedir?',
    answer:
      '24 saat öncesine kadar yapılan iptallerde ücret iadesi sağlanabilir. Detaylı bilgi için rezervasyon sırasında bizimle iletişime geçebilirsiniz.',
  },
  {
    question: 'Çocuklar için uygun mu?',
    answer:
      'Evet, tekne turumuz aileler ve çocuklar için oldukça uygundur. Teknede alt katta güneşten korunabileceğiniz kapalı bir oturma alanı bulunmaktadır. Ayrıca çocuklar için can yeleği ve kolluk gibi güvenlik ekipmanları mevcuttur. Teknenin korkulukları yüksek tasarlandığı için çocukların güvenliği açısından da rahat bir ortam sunar.',
  },
  {
    question: 'Tekne çok sallanıyor mu?',
    answer:
      'Poseidon 2 geniş ve büyük yapısı sayesinde denizde oldukça dengeli bir seyir sunar. Bu nedenle normal teknelere göre çok daha az sallanır ve özellikle ilk kez tekne turuna katılan misafirler için daha konforlu bir deneyim sağlar.',
  },
]

export default function HomeFaqSection({ items, locale = 'tr' }: HomeFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const resolvedItems = items && items.length > 0 ? items : locale === 'tr' ? DEFAULT_FAQ_TR : null
  if (!resolvedItems || resolvedItems.length === 0) return null

  const faqHref = withLocalePath(locale, '/sik-sorulanlar')

  return (
    <section
      className="w-full py-14 md:py-16"
      style={{ background: '#eafbf7' }}
      aria-labelledby="home-faq-heading"
    >
      <div className="mx-auto max-w-[900px] px-4">
        <h2
          id="home-faq-heading"
          className="mb-8 text-center text-[26px] font-black uppercase leading-[1.15] sm:text-[30px] md:mb-10 md:text-[34px]"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--primary, #2168b8)' }}
        >
          {HEADING[locale]}
        </h2>

        <div className="flex flex-col gap-3">
          {resolvedItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span
                    className="text-[15px] font-semibold sm:text-base"
                    style={{ color: 'var(--secondary, #131719)' }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--muted, #81848b)' }}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6">
                    <p
                      className="text-sm leading-relaxed sm:text-[15px]"
                      style={{ color: 'var(--text-color, #58595b)' }}
                    >
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={faqHref}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 bg-white px-8 py-2.5 text-sm font-bold uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06]"
            style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
          >
            {VIEW_ALL_LABEL[locale]}
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
