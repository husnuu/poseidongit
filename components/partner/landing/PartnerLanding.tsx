import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { PARTNER_ATTRIBUTION_DAYS } from '@/lib/partner/attribution'
import { SERIF } from './fonts'
import PartnerLoginForm from './PartnerLoginForm'
import PartnerHowItWorks, { type LandingTour } from './PartnerHowItWorks'

/** Gerçek partner panelindeki sekmeler (components/partner/PartnerNav.tsx) ve özet kutuları (PartnerReports). */
const PANEL_TABS = ['Özet', 'Yeni rezervasyon', 'QR ve bağlantı', "Web sitesi widget'ı", 'Ayarlar']

const PANEL_FEATURES = [
  'Ödenecek, kazanılan ve ödenen komisyonunuzu ay ay görün',
  'Resepsiyondan rezervasyon oluşturun, ödeme linkini WhatsApp ile gönderin',
  'QR kodunuzu ve oda kartınızı indirin',
  'Web siteniz için tur widget’ı oluşturun',
  'Misafir gizliliği korunur: e-posta ve telefon size görünmez',
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Nasıl partner olurum?',
    a: 'Bize WhatsApp’tan yazın. Hesabınızı açıp giriş bilgilerinizi, komisyon oranınızı ve size özel QR kodunuzu iletiriz.',
  },
  {
    q: 'Web sitem yoksa katılabilir miyim?',
    a: 'Evet. Size özel mini sayfa ve QR kod yeterli; web sitesi gerekmez. Web siteniz varsa turları widget ile sitenize de ekleyebilirsiniz.',
  },
  {
    q: 'Hangi rezervasyonlar bana yazılır?',
    a: `Misafir mini sayfanıza geldikten sonra ${PARTNER_ATTRIBUTION_DAYS} gün içinde aynı tarayıcıdan yaptığı rezervasyonlar ve panelden sizin oluşturduğunuz rezervasyonlar. Misafir birden fazla partnerin sayfasına girdiyse son girdiği sayfa geçerlidir.`,
  },
  {
    q: 'Komisyon nasıl hesaplanır?',
    a: 'Rezervasyonun toplam satış tutarı (ekstralar dahil) üzerinden, hesabınıza tanımlı oranla. Rezervasyon anındaki oran geçerlidir; oran değişikliği geçmiş rezervasyonları etkilemez. Kısmi iadede iade tutarı düşülür.',
  },
  {
    q: 'Komisyon ne zaman kazanılır?',
    a: 'Rezervasyon ödenmiş ve tur gerçekleşmiş olmalı. Komisyon turun yapıldığı aya yazılır; ödenen aylar panelde “Ödendi” olarak görünür. İptal, başarısız ödeme ve tam iade komisyon kazandırmaz.',
  },
  {
    q: 'Misafirlerin bilgilerini görebilir miyim?',
    a: 'Misafirin e-posta adresi ve telefonu size gösterilmez; adı “Ayşe K.” şeklinde görünür.',
  },
  {
    q: 'Şifremi unuttum, ne yapmalıyım?',
    a: 'Poseidon ekibine yazın; şifreniz yenilenip size iletilir.',
  },
]

const container = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8'

/**
 * /partner/giris — partner programı tanıtımı + giriş formu. Hesaplar admin
 * tarafından açıldığı için kayıt formu yok; "Partner olun" WhatsApp'a gider.
 */
export default function PartnerLanding({
  logoUrl,
  logoAlt,
  contactHref,
  tours,
}: {
  logoUrl: string | null
  logoAlt: string
  contactHref: string | null
  tours: LandingTour[]
}) {
  const [photoA, photoB] = tours.filter((t) => t.imageUrl)

  const brand = (
    <Link href="/" className="flex items-center gap-3 no-underline" aria-label="Poseidon Tekne Turu ana sayfa">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Sanity'deki logo (SVG/PNG), oranı değişken
        <img src={logoUrl} alt={logoAlt} className="h-8 w-auto sm:h-9" />
      ) : (
        <span className="text-[20px] font-black uppercase tracking-wide text-[#0d1b2e]">Poseidon</span>
      )}
      <span className="h-7 w-px bg-[#0d1b2e]/15" aria-hidden />
      <span className={`${SERIF} text-[20px] italic text-[#0d1b2e] sm:text-[22px]`}>Partner</span>
    </Link>
  )

  return (
    <div className="siteFontScope min-h-screen bg-[#f7f5f1] text-[#0d1b2e]">
      <header className="sticky top-0 z-30 border-b border-[#0d1b2e]/[0.06] bg-[#f7f5f1]/90 backdrop-blur-md">
        <div className={`${container} flex h-[72px] items-center justify-between gap-4 sm:h-[84px]`}>
          {brand}
          <nav aria-label="Sayfa içi" className="hidden items-center gap-9 text-[15px] text-[#2b3443] lg:flex">
            <a href="#nasil-calisir" className="transition hover:text-[#0d1b2e]">Nasıl çalışır</a>
            <a href="#panel" className="transition hover:text-[#0d1b2e]">Partner paneli</a>
            <a href="#sorular" className="transition hover:text-[#0d1b2e]">Sorular</a>
          </nav>
          <div className="flex items-center gap-5">
            <a href="#giris" className="text-[15px] font-medium text-[#0d1b2e] hover:underline hover:underline-offset-4">
              Giriş yap
            </a>
            {contactHref && (
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-11 items-center rounded-full bg-[#1b3b72] px-6 text-[15px] font-semibold text-white transition hover:bg-[#21488a] sm:inline-flex"
              >
                Partner olun
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero: solda tanıtım, sağda giriş formu (fotoğraflar ve kesikli halkalar süs).
            Mobil sıra: başlık → giriş formu → artılar/butonlar (form aşağıda kaybolmasın). */}
        <section
          className={`${container} grid grid-cols-[minmax(0,1fr)] gap-10 pb-20 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-0 lg:pb-28 lg:pt-20`}
        >
          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1 className={`${SERIF} text-[42px] font-bold leading-[1.04] tracking-[-0.015em] text-[#0d1b2e] sm:text-[54px] lg:text-[56px] xl:text-[64px]`}>
              Paylaş. Yönlendir.
              <br />
              Komisyon kazan.
            </h1>
            <p className="mt-7 max-w-[560px] text-[17px] leading-[1.65] text-[#4a5363] sm:text-[19px]">
              Otel, pansiyon ve acenteler için Poseidon partner programı. Misafirlerinize Çeşme tekne turlarını önerin; size özel QR
              kod ve bağlantıdan gelen rezervasyonlardan komisyon kazanın, hepsini tek panelden takip edin.
            </p>
          </div>

          <div className="order-3 lg:col-start-1 lg:row-start-2 lg:mt-10 lg:self-start">
            <div className="grid max-w-[560px] gap-7 sm:grid-cols-2">
              <div>
                <p className={`${SERIF} text-[24px] font-bold leading-tight text-[#0d1b2e]`}>Web sitesi gerekmez</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5b6472]">QR kod ve size özel mini sayfa yeterli.</p>
              </div>
              <div>
                <p className={`${SERIF} text-[24px] font-bold leading-tight text-[#0d1b2e]`}>Kazancınız görünür</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5b6472]">Komisyonunuzu panelde ay ay izleyin.</p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {contactHref && (
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-[#1b3b72] px-7 text-[16px] font-semibold text-white transition hover:bg-[#21488a]"
                >
                  Partner olun
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </a>
              )}
              <a
                href="#nasil-calisir"
                className="text-[16px] font-medium text-[#0d1b2e] underline decoration-[#0d1b2e]/40 underline-offset-[6px] transition hover:decoration-[#0d1b2e]"
              >
                Nasıl çalışır?
              </a>
            </div>
          </div>

          <div
            id="giris"
            className="relative order-2 mx-auto w-full max-w-[440px] scroll-mt-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center"
          >
            <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
              <svg className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 600 600" fill="none">
                <circle cx="300" cy="300" r="290" stroke="#8fa6c6" strokeWidth="2" strokeDasharray="14 12" />
                <circle cx="300" cy="300" r="230" stroke="#6fb1e8" strokeWidth="2.5" strokeDasharray="18 14" />
              </svg>
              {photoA?.imageUrl && (
                <Image
                  src={photoA.imageUrl}
                  alt=""
                  width={440}
                  height={440}
                  sizes="220px"
                  className="absolute -left-2 top-2 h-[220px] w-[220px] rounded-full object-cover shadow-[0_30px_60px_-25px_rgba(13,27,46,0.5)] xl:-left-8"
                />
              )}
              {photoB?.imageUrl && (
                <Image
                  src={photoB.imageUrl}
                  alt=""
                  width={400}
                  height={400}
                  sizes="200px"
                  className="absolute -right-2 bottom-0 h-[200px] w-[200px] rounded-full object-cover shadow-[0_30px_60px_-25px_rgba(13,27,46,0.5)] xl:-right-6"
                />
              )}
            </div>
            <div className="relative mx-auto max-w-[420px] lg:py-24">
              <PartnerLoginForm helpHref={contactHref} />
            </div>
          </div>
        </section>

        <section id="nasil-calisir" aria-labelledby="nasil-heading" className="scroll-mt-20 rounded-t-[40px] bg-white py-20 lg:py-28">
          <div className={container}>
            <div className="mx-auto mb-12 max-w-[720px] text-center lg:mb-16">
              <h2 id="nasil-heading" className={`${SERIF} text-[38px] font-bold leading-[1.08] text-[#0d1b2e] sm:text-[52px]`}>
                Nasıl çalışır?
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-[#5b6472] sm:text-[19px]">
                Hesabınızın açılmasından ilk komisyonunuza kadar dört adım.
              </p>
            </div>
            <PartnerHowItWorks tours={tours} />
          </div>
        </section>

        <section id="panel" aria-labelledby="panel-heading" className="scroll-mt-20 bg-white pb-24 lg:pb-32">
          <div className={`${container} grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16`}>
            <PanelPreview />
            <div>
              <h2 id="panel-heading" className={`${SERIF} text-[38px] font-bold leading-[1.06] text-[#0d1b2e] sm:text-[52px]`}>
                Her şey
                <br />
                tek panelde
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-[#5b6472] sm:text-[19px]">
                Rezervasyonlarınızı, komisyonunuzu ve paylaşım araçlarınızı aynı yerden yönetin.
              </p>
              <ul className="mt-8 space-y-4">
                {PANEL_FEATURES.map((f) => (
                  <li key={f} className="flex gap-3.5 text-[16px] leading-snug text-[#2b3443] sm:text-[17px]">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f1fb] text-[#2168b8]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#giris"
                className="mt-10 inline-flex h-[52px] items-center rounded-full bg-[#1b3b72] px-7 text-[16px] font-semibold text-white transition hover:bg-[#21488a]"
              >
                Panele giriş yap
              </a>
            </div>
          </div>
        </section>

        <section id="sorular" aria-labelledby="sorular-heading" className="scroll-mt-20 py-20 lg:py-28">
          <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
            <div>
              <h2 id="sorular-heading" className={`${SERIF} text-[38px] font-bold leading-[1.08] text-[#0d1b2e] sm:text-[52px]`}>
                Sık sorulan sorular
              </h2>
              <p className="mt-4 max-w-[380px] text-[17px] leading-relaxed text-[#5b6472]">
                Başka bir sorunuz varsa{' '}
                {contactHref ? (
                  <a href={contactHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b3b72] underline underline-offset-4">
                    bize WhatsApp’tan yazın
                  </a>
                ) : (
                  'Poseidon ekibine yazın'
                )}
                .
              </p>
            </div>
            <div className="divide-y divide-[#0d1b2e]/10 border-y border-[#0d1b2e]/10">
              {FAQ.map((item) => (
                <details key={item.q} name="partner-faq" className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[17px] font-semibold text-[#0d1b2e] sm:text-[19px]">{item.q}</h3>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#5b6472] transition-transform duration-200 group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="-mt-1 pb-6 pr-10 text-[16px] leading-[1.7] text-[#4a5363]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#0d1b2e]/10">
        <div className={`${container} flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center`}>
          {brand}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#5b6472]">
            <Link href="/" className="hover:text-[#0d1b2e]">cesmetekneturu.net</Link>
            {contactHref && (
              <a href={contactHref} target="_blank" rel="noopener noreferrer" className="hover:text-[#0d1b2e]">
                WhatsApp
              </a>
            )}
            <span>© {new Date().getFullYear()} Poseidon Tekne Turu</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Panelin sade bir örnek görünümü — sekme adları ve kutu başlıkları gerçek panelle aynı. */
function PanelPreview() {
  const tiles: [string, string, boolean][] = [
    ['Ödenecek komisyon', '₺4.250', true],
    ['Toplam kazanılan', '₺18.600', false],
    ['Ödenen', '₺14.350', false],
    ['Yaklaşan turlardan', '₺2.100', false],
  ]
  const rows: [string, string, string, string][] = [
    ['Ayşe K.', '₺3.600', '₺360', 'Ödeme bekliyor'],
    ['Mehmet T.', '₺5.800', '₺580', 'Ödendi'],
    ['Elif D.', '₺9.000', '₺900', 'Ödendi'],
  ]
  return (
    <div className="relative min-w-0" aria-hidden>
      <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_40px_80px_-35px_rgba(13,27,46,0.45)] ring-1 ring-[#0d1b2e]/[0.08]">
        <div className="flex items-center gap-2 border-b border-[#ece9e2] bg-[#fbfaf8] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e5e2da]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e5e2da]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e5e2da]" />
          <span className="ml-3 min-w-0 truncate rounded-md bg-white px-3 py-1 text-[11px] text-[#8a93a1] ring-1 ring-[#ece9e2]">cesmetekneturu.net/partner</span>
          <span className="ml-auto shrink-0 rounded-full bg-[#f7f5f1] px-2.5 py-1 text-[10px] font-semibold text-[#8a93a1]">Örnek görünüm</span>
        </div>
        <div className="px-5 pt-4">
          <p className="text-[13px] font-black text-[#131719]">Oteliniz</p>
          <p className="text-[10px] font-semibold text-[#9aa1ab]">Poseidon Partner</p>
          <div className="mt-3 flex gap-1 overflow-hidden border-b border-[#ece9e2]">
            {PANEL_TABS.map((t, i) => (
              <span
                key={t}
                className={`shrink-0 whitespace-nowrap border-b-2 px-2.5 py-2 text-[11px] font-bold ${
                  i === 0 ? 'border-[#2168b8] text-[#2168b8]' : 'border-transparent text-[#9aa1ab]'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-[#fafafa] p-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {tiles.map(([label, value, strong]) => (
              <div key={label} className="rounded-lg border border-[#e7e7ea] bg-white p-3">
                <p className="text-[10px] font-bold text-[#8a93a1]">{label}</p>
                <p className={`mt-1 text-[15px] font-black ${strong ? 'text-[#2168b8]' : 'text-[#131719]'}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-[#e7e7ea] bg-white">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2 border-b border-[#efeff2] px-3 py-2 text-[10px] font-bold text-[#8a93a1]">
              <span>Misafir</span>
              <span>Satış</span>
              <span>Komisyon</span>
              <span>Durum</span>
            </div>
            {rows.map(([guest, sale, commission, state]) => (
              <div key={guest} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-2 border-b border-[#f3f3f5] px-3 py-2.5 text-[11px] last:border-0">
                <span className="font-semibold text-[#131719]">{guest}</span>
                <span className="text-[#5b6472]">{sale}</span>
                <span className="font-semibold text-[#131719]">{commission}</span>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    state === 'Ödendi' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
