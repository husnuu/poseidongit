'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Clock3, Mail, QrCode } from 'lucide-react'
import { SERIF } from './fonts'

export type LandingTour = { id: string; title: string; imageUrl: string | null }

type Step = { tab: string; title: string; text: string }

const STEPS: Step[] = [
  {
    tab: 'Hesabınız açılır',
    title: 'Hesabınız açılır',
    text: 'Poseidon ekibi partner hesabınızı oluşturur ve giriş bilgilerinizi size iletir. Komisyon oranınız hesabınıza tanımlanır; size özel mini sayfanız ve QR kodunuz hazır olur.',
  },
  {
    tab: 'QR kodunuzu paylaşın',
    title: 'QR kodunuzu paylaşın',
    text: 'Panelden QR kodunuzu ve oda kartınızı indirip resepsiyona, odalara ya da menülere koyun. Web siteniz varsa turları sitenize widget olarak da ekleyebilirsiniz.',
  },
  {
    tab: 'Misafir rezervasyon yapar',
    title: 'Misafiriniz turunu seçer',
    text: 'Misafir QR kodu okutup mini sayfanızdan turunu seçer ve rezervasyonunu yapar. İsterseniz rezervasyonu resepsiyondan, partner paneli üzerinden siz de oluşturabilirsiniz.',
  },
  {
    tab: 'Komisyonunuzu alın',
    title: 'Komisyonunuzu takip edin',
    text: 'Tur gerçekleşince komisyonunuz kazanılır ve turun yapıldığı aya yazılır. Panelde ödenecek ve ödenen tutarları ay ay görürsünüz. İptal ve iade edilen rezervasyonlar komisyona girmez.',
  },
]

/** "Nasıl çalışır" — sekmeli 4 adım; her adımın yanında sade bir örnek görünüm. */
export default function PartnerHowItWorks({ tours }: { tours: LandingTour[] }) {
  const [active, setActive] = useState(0)
  const baseId = useId()
  const step = STEPS[active]

  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-[#0d1b2e] bg-white">
      <div role="tablist" aria-label="Adımlar" className="grid grid-cols-4 bg-[#0d1b2e]">
        {STEPS.map((s, i) => {
          const selected = i === active
          return (
            <button
              key={s.tab}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              onClick={() => setActive(i)}
              className={`relative flex items-baseline justify-center gap-2 px-2 py-5 text-[15px] transition-colors md:py-6 md:text-[17px] ${
                selected ? 'text-[#8cc4f2]' : 'text-white/75 hover:text-white'
              }`}
            >
              <span className={`${SERIF} text-[15px] italic opacity-80 md:text-[16px]`}>{String(i + 1).padStart(2, '0')}</span>
              <span className="hidden font-medium lg:inline">{s.tab}</span>
              <span
                className={`absolute inset-x-0 bottom-0 h-[3px] bg-[#6fb1e8] transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="grid items-center gap-10 px-6 py-10 sm:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-14"
      >
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2168b8]">
            Adım {active + 1} / {STEPS.length}
          </p>
          <h3 className={`${SERIF} mt-3 text-[32px] font-bold leading-[1.08] text-[#0d1b2e] md:text-[44px]`}>{step.title}</h3>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.7] text-[#4a5363] md:text-[18px]">{step.text}</p>
          {active < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setActive(active + 1)}
              className="mt-7 text-[15px] font-semibold text-[#1b3b72] underline decoration-[#1b3b72]/30 underline-offset-[6px] transition hover:decoration-[#1b3b72]"
            >
              Sonraki adım: {STEPS[active + 1].tab}
            </button>
          )}
        </div>
        <div className="flex min-h-[340px] items-center justify-center rounded-[22px] bg-[#f7f5f1] p-6 sm:p-10" aria-hidden>
          {active === 0 && <AccountVisual />}
          {active === 1 && <QrVisual />}
          {active === 2 && <MiniPageVisual tours={tours} />}
          {active === 3 && <CommissionVisual tours={tours} />}
        </div>
      </div>
    </div>
  )
}

const card = 'rounded-2xl bg-white shadow-[0_24px_50px_-24px_rgba(13,27,46,0.35)] ring-1 ring-[#0d1b2e]/[0.06]'

function AccountVisual() {
  const rows: [string, string][] = [
    ['Giriş', 'cesmetekneturu.net/partner'],
    ['E-posta', 'ornek@oteliniz.com'],
    ['Şifre', '••••••••••'],
    ['Mini sayfanız', '/p/oteliniz'],
  ]
  return (
    <div className={`${card} w-full max-w-[380px] p-6`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f1fb] text-[#2168b8]">
          <Mail className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold text-[#0d1b2e]">Partner hesabınız hazır</p>
          <p className="text-[12px] text-[#8a93a1]">Poseidon ekibinden</p>
        </div>
      </div>
      <dl className="mt-5 divide-y divide-[#ece9e2] rounded-xl bg-[#f7f5f1] px-4 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-[#8a93a1]">{k}</dt>
            <dd className="truncate font-medium text-[#0d1b2e]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex h-10 items-center justify-center rounded-full bg-[#1b3b72] text-[13px] font-semibold text-white">Panele giriş yap</div>
    </div>
  )
}

function QrVisual() {
  return (
    <div className="relative">
      <div className={`${card} w-[250px] -rotate-2 px-6 pb-6 pt-7 text-center`}>
        <p className={`${SERIF} text-[22px] font-bold leading-tight text-[#0d1b2e]`}>Çeşme tekne turları</p>
        <p className="mt-1 text-[12px] text-[#8a93a1]">Odanızdan rezervasyon yapın</p>
        <div className="mx-auto mt-5 flex h-[132px] w-[132px] items-center justify-center rounded-2xl border border-[#ece9e2]">
          <QrCode className="h-[104px] w-[104px] text-[#0d1b2e]" strokeWidth={1.25} />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2168b8]">Kamerayla okutun</p>
        <p className="mt-1 font-mono text-[11px] text-[#8a93a1]">cesmetekneturu.net/p/oteliniz</p>
      </div>
      <div className="absolute -bottom-14 -right-24 hidden rotate-2 rounded-xl bg-[#0d1b2e] px-4 py-3 font-mono text-[11px] leading-relaxed text-[#cfe3f7] shadow-xl sm:block">
        <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8cc4f2]">Web siteniz için</span>
        {'<script src="…/widget.js"'}
        <br />
        {'  data-partner="oteliniz">'}
      </div>
    </div>
  )
}

function TourThumb({ tour, size }: { tour: LandingTour | undefined; size: number }) {
  return tour?.imageUrl ? (
    <Image src={tour.imageUrl} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="shrink-0 rounded-lg bg-[#e9e6df]" style={{ width: size, height: size }} />
  )
}

function MiniPageVisual({ tours }: { tours: LandingTour[] }) {
  const list = tours.length ? tours : [undefined, undefined, undefined]
  return (
    <div className="w-[260px] rounded-[38px] border-[9px] border-[#0d1b2e] bg-white px-4 pb-5 pt-6 shadow-[0_30px_60px_-25px_rgba(13,27,46,0.45)]">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#e9e6df]" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2168b8]">Oteliniz × Poseidon</p>
      <p className={`${SERIF} mt-1 text-[20px] font-bold leading-tight text-[#0d1b2e]`}>Çeşme tekne turları</p>
      <ul className="mt-4 space-y-2.5">
        {list.slice(0, 3).map((t, i) => (
          <li key={t?.id ?? i} className="flex items-center gap-3 rounded-xl bg-[#f7f5f1] p-2">
            <TourThumb tour={t} size={46} />
            <span className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#0d1b2e]">{t?.title ?? ' '}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex h-9 items-center justify-center rounded-full bg-[#1b3b72] text-[12px] font-semibold text-white">Rezervasyon yap</div>
    </div>
  )
}

function CommissionVisual({ tours }: { tours: LandingTour[] }) {
  const names = ['Ayşe K.', 'Mehmet T.', 'Elif D.']
  const status = [
    { label: 'Kazanıldı', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50' },
    { label: 'Tur bekleniyor', icon: Clock3, cls: 'text-amber-700 bg-amber-50' },
    { label: 'Kazanıldı', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50' },
  ]
  return (
    <div className={`${card} w-full max-w-[400px] p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[#8a93a1]">Ödenecek komisyon</p>
          <p className={`${SERIF} mt-1 text-[34px] font-bold leading-none text-[#0d1b2e]`}>₺4.250</p>
        </div>
        <span className="rounded-full bg-[#f7f5f1] px-2.5 py-1 text-[10px] font-semibold text-[#8a93a1]">Örnek görünüm</span>
      </div>
      <ul className="mt-5 divide-y divide-[#ece9e2] border-t border-[#ece9e2]">
        {names.map((n, i) => {
          const S = status[i]
          return (
            <li key={n} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0d1b2e]">{n}</p>
                <p className="truncate text-[12px] text-[#8a93a1]">{tours[i]?.title ?? 'Tekne turu'}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${S.cls}`}>
                <S.icon className="h-3.5 w-3.5" />
                {S.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
