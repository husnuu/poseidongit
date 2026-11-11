'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Monitor, Smartphone } from 'lucide-react'
import { PartnerCard } from '@/components/partner/PartnerReports'

export type WidgetTourOption = { id: string; title: string }

type Mode = 'list' | 'tour' | 'button'
type Lang = 'tr' | 'en' | 'de' | 'ru'
type Content = 'all' | 'tours' | 'yachts'

const CONTENTS: { value: Content; label: string }[] = [
  { value: 'all', label: 'Turlar ve tekne kiralama' },
  { value: 'tours', label: 'Yalnızca tekne turları' },
  { value: 'yachts', label: 'Yalnızca tekne kiralama' },
]

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'list', label: 'Tur listesi', hint: 'Turlar kart olarak sayfada listelenir.' },
  { value: 'tour', label: 'Tek tur', hint: 'Seçilen turun rezervasyon formu ve detayları.' },
  { value: 'button', label: 'Buton', hint: 'Tıklanınca turlar pencerede açılır.' },
]

const LANGS: { value: Lang; label: string }[] = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
]

const DEFAULT_COLOR = '#2168b8'

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Widget oluşturucu: ayarlar → gömme kodu + canlı önizleme. Önizleme, kodu
 * örnek bir "partner sitesi" içinde çalıştırır (gerçek widget.js ile).
 */
export default function WidgetBuilder({
  partnerSlug,
  partnerName,
  tours,
  domains,
  domainsSlot,
}: {
  partnerSlug: string
  partnerName: string
  tours: WidgetTourOption[]
  /** Kayıtlı alan adları (boş → her sitede açılır). */
  domains?: string[]
  /** Admin: alan adı düzenleme alanı. */
  domainsSlot?: React.ReactNode
}) {
  const [origin, setOrigin] = useState('')
  const [mode, setMode] = useState<Mode>('list')
  const [lang, setLang] = useState<Lang>('tr')
  const [content, setContent] = useState<Content>('all')
  const [tourId, setTourId] = useState(tours[0]?.id ?? '')
  const [selectedTours, setSelectedTours] = useState<string[]>([])
  const [useColor, setUseColor] = useState(false)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [prices, setPrices] = useState(true)
  const [label, setLabel] = useState('')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)
  const [previewDoc, setPreviewDoc] = useState('')

  useEffect(() => setOrigin(window.location.origin), [])

  const code = useMemo(() => {
    if (!origin) return ''
    const attrs: [string, string][] = [
      ['data-partner', partnerSlug],
      ['data-lang', lang],
      ['data-mode', mode],
    ]
    if (mode === 'tour' && tourId) attrs.push(['data-tour', tourId])
    if (mode !== 'tour' && content !== 'all') attrs.push(['data-content', content])
    if (mode !== 'tour' && content !== 'yachts' && selectedTours.length > 0) attrs.push(['data-tours', selectedTours.join(',')])
    if (useColor) attrs.push(['data-color', color])
    if (!prices) attrs.push(['data-prices', '0'])
    if (mode === 'button' && label.trim()) attrs.push(['data-label', label.trim()])
    const attrText = attrs.map(([k, v]) => `\n  ${k}="${escapeAttr(v)}"`).join('')
    return `<script src="${origin}/widget.js"${attrText}\n  async></script>`
  }, [origin, partnerSlug, lang, mode, content, tourId, selectedTours, useColor, color, prices, label])

  useEffect(() => {
    if (!code) return
    const t = window.setTimeout(() => {
      setPreviewDoc(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#f8fafc;color:#334155;font:15px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.bar{background:#fff;border-bottom:1px solid #e2e8f0;padding:14px 20px;font-weight:800;color:#0f172a}
main{max-width:1100px;margin:0 auto;padding:24px 16px}h2{margin:0 0 4px;color:#0f172a}p{margin:0 0 20px}</style></head>
<body><div class="bar">${escapeHtml(partnerName)} <span style="font-weight:500;color:#94a3b8">· örnek site</span></div>
<main><h2>Tekne turları</h2><p>Misafirlerimiz için seçtiğimiz Çeşme tekne turları.</p>${code}</main></body></html>`)
    }, 350)
    return () => window.clearTimeout(t)
  }, [code, partnerName])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano izni yoksa kullanıcı metni elle seçer */
    }
  }

  const toggleTour = (id: string) =>
    setSelectedTours((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const fieldLabel = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500'

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <PartnerCard title="Ayarlar">
          <div className="flex flex-col gap-5 p-4">
            <div>
              <span className={fieldLabel}>Görünüm</span>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-100 p-1">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    aria-pressed={mode === m.value}
                    className={`rounded-md px-2 py-2 text-sm font-bold ${
                      mode === m.value ? 'bg-white text-[#131719] shadow-sm' : 'text-zinc-500 hover:text-[#131719]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">{MODES.find((m) => m.value === mode)?.hint}</p>
            </div>

            <label className="block">
              <span className={fieldLabel}>Dil</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            {mode !== 'tour' && (
              <label className="block">
                <span className={fieldLabel}>İçerik</span>
                <select
                  value={content}
                  onChange={(e) => setContent(e.target.value as Content)}
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                >
                  {CONTENTS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {content !== 'tours' && (
                  <span className="mt-1.5 block text-xs text-zinc-500">
                    Tekneler widget&apos;ta listelenir; tıklanınca misafir sitemizdeki tekne sayfasına gider (teklif ve kapora orada).
                  </span>
                )}
              </label>
            )}

            {mode === 'tour' ? (
              <label className="block">
                <span className={fieldLabel}>Tur</span>
                <select
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                >
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : content === 'yachts' ? null : (
              <fieldset className="min-w-0">
                <legend className={fieldLabel}>Gösterilecek turlar</legend>
                <p className="mb-2 text-xs text-zinc-500">
                  {selectedTours.length === 0 ? 'Hiçbiri seçili değilse tüm turlar gösterilir.' : `${selectedTours.length} tur seçili.`}
                </p>
                <div className="max-h-52 overflow-y-auto rounded-md border border-zinc-200">
                  {tours.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-2.5 border-b border-zinc-100 px-3 py-2 text-sm last:border-0 hover:bg-zinc-50">
                      <input type="checkbox" checked={selectedTours.includes(t.id)} onChange={() => toggleTour(t.id)} />
                      <span className="min-w-0 truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {mode === 'button' && (
              <label className="block">
                <span className={fieldLabel}>Buton yazısı</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value.slice(0, 60))}
                  placeholder="Varsayılan: Tekne Turu Rezervasyonu"
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
                />
              </label>
            )}

            <div>
              <span className={fieldLabel}>Ana renk</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useColor} onChange={(e) => setUseColor(e.target.checked)} />
                  Sitenin rengini kullan
                </label>
                <input
                  type="color"
                  value={color}
                  disabled={!useColor}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Ana renk"
                  className="h-9 w-12 cursor-pointer rounded border border-zinc-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">İşaretlenmezse Poseidon mavisi kullanılır.</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={prices} onChange={(e) => setPrices(e.target.checked)} />
              Kartlarda fiyatları göster
            </label>
          </div>
        </PartnerCard>

        <PartnerCard title="Alan adları">
          <div className="p-4 text-sm text-zinc-600">
            {domainsSlot ?? (
              <p>
                {domains && domains.length > 0
                  ? `Widget yalnızca şu sitelerde açılır: ${domains.join(', ')}`
                  : 'Widget her sitede açılır. Yalnızca kendi sitenizde açılmasını isterseniz Poseidon ile iletişime geçin.'}
              </p>
            )}
          </div>
        </PartnerCard>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <PartnerCard
          title="Gömme kodu"
          action={
            <button
              type="button"
              onClick={copy}
              disabled={!code}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Kopyalandı' : 'Kodu kopyala'}
            </button>
          }
        >
          <div className="p-4">
            <pre className="m-0 overflow-x-auto rounded-md bg-[#0f172a] p-4 text-[12.5px] leading-relaxed text-[#e2e8f0]">
              <code>{code || '…'}</code>
            </pre>
            <p className="mt-2 text-xs text-zinc-500">
              Kodu web sitenizde widget&apos;ın görünmesini istediğiniz yere yapıştırın (WordPress&apos;te &quot;Özel HTML&quot; bloğu).
              Rezervasyonlar otomatik olarak sizin hesabınıza yazılır. Misafir formu widget içinde doldurur; ödeme adımında güvenli ödeme sayfamıza yönlendirilir.
            </p>
          </div>
        </PartnerCard>

        <PartnerCard
          title="Canlı önizleme"
          action={
            <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5">
              {(['desktop', 'mobile'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-pressed={device === d}
                  aria-label={d === 'desktop' ? 'Masaüstü' : 'Mobil'}
                  className={`rounded px-2 py-1 ${device === d ? 'bg-white text-[#131719] shadow-sm' : 'text-zinc-500'}`}
                >
                  {d === 'desktop' ? <Monitor className="h-4 w-4" aria-hidden /> : <Smartphone className="h-4 w-4" aria-hidden />}
                </button>
              ))}
            </div>
          }
        >
          <div className="bg-zinc-100 p-3">
            {previewDoc ? (
              <iframe
                key={device}
                title="Widget önizlemesi"
                srcDoc={previewDoc}
                className="mx-auto block h-[760px] rounded-md border border-zinc-200 bg-white"
                style={{ width: device === 'mobile' ? 390 : '100%', maxWidth: '100%' }}
              />
            ) : (
              <p className="py-20 text-center text-sm text-zinc-500">Önizleme hazırlanıyor…</p>
            )}
          </div>
        </PartnerCard>
      </div>
    </div>
  )
}
