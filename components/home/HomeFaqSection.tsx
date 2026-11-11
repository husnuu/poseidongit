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

/** İki satıra bölünmüş başlık — ilk satır "Sıkça Sorulan", ikinci satır "Sorular". */
const HEADING_LINE1: Record<SiteLocale, string> = {
  tr: 'SIKÇA SORULAN',
  en: 'FREQUENTLY ASKED',
  de: 'HÄUFIG GESTELLTE',
  ru: 'ЧАСТО ЗАДАВАЕМЫЕ',
}
const HEADING_LINE2: Record<SiteLocale, string> = {
  tr: 'SORULAR',
  en: 'QUESTIONS',
  de: 'FRAGEN',
  ru: 'ВОПРОСЫ',
}

const VIEW_ALL_LABEL: Record<SiteLocale, string> = {
  tr: 'Tüm soruları görüntüle',
  en: 'View all questions',
  de: 'Alle Fragen ansehen',
  ru: 'Посмотреть все вопросы',
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

/**
 * Sunucu bileşeni: tüm cevaplar HTML'de bulunur (eskiden yalnızca açılan
 * sorunun cevabı render ediliyordu — arama motorları ve yapay zekâ tarayıcıları
 * cevapları hiç göremiyordu). Yerel <details name> akordeonu JS'siz çalışır ve
 * aynı anda tek soruyu açık tutar.
 */
export default function HomeFaqSection({ items, locale = 'tr' }: HomeFaqSectionProps) {
  const resolvedItems = items && items.length > 0 ? items : locale === 'tr' ? DEFAULT_FAQ_TR : null
  if (!resolvedItems || resolvedItems.length === 0) return null

  const faqHref = withLocalePath(locale, '/sik-sorulanlar')

  return (
    <section
      className="w-full py-14 md:py-16"
      style={{ background: '#f4f7fb' }}
      aria-labelledby="home-faq-heading"
    >
      <div className="mx-auto max-w-[900px] px-4">
        <h2
          id="home-faq-heading"
          className="mb-8 text-center text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:mb-10 md:text-[36px] lg:text-[40px]"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--primary, #2168b8)', WebkitTextStroke: '0.6px currentColor' }}
        >
          {HEADING_LINE1[locale]}
          <br />
          {HEADING_LINE2[locale]}
        </h2>

        <div className="flex flex-col gap-3">
          {resolvedItems.map((item, index) => (
            <details
              key={index}
              name="home-faq"
              /* Kart: görünmez #f1f5f9 kenar + shadow-sm zeminle kaynaşıyordu; tur/yat
                 kartlarıyla aynı reçete — görünür yumuşak kenar + katmanlı gölge. */
              className="group overflow-hidden rounded-2xl border border-[#e5e9ef] bg-white shadow-[0_1px_2px_rgba(19,23,25,0.05),0_4px_14px_-4px_rgba(19,23,25,0.09)] transition-all duration-200 hover:border-[var(--primary,#2168b8)]/25 hover:shadow-[0_2px_4px_rgba(19,23,25,0.05),0_10px_24px_-8px_rgba(19,23,25,0.14)] open:border-[var(--primary,#2168b8)]/35"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                {/* Soru: bold (belirginlik) ama 15/16px — bir üst deneme (16/17 +
                    güçlü gölge) fazla bulundu, bir tık geri çekildi. */}
                <h3 className="m-0 text-[15px] font-bold leading-snug text-[var(--secondary,#131719)] transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)] group-open:text-[var(--primary,#2168b8)] sm:text-[16px]">
                  {item.question}
                </h3>
                <ChevronDown
                  className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-open:rotate-180"
                  style={{ color: 'var(--muted, #81848b)' }}
                  strokeWidth={2}
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5 sm:px-6">
                <p
                  className="text-sm leading-relaxed sm:text-[15px]"
                  style={{ color: 'var(--text-color, #58595b)' }}
                >
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={faqHref}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 bg-white px-8 py-2.5 text-[14px] font-extrabold uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:text-[15px]"
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
