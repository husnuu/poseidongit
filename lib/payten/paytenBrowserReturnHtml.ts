import {
  escapeHtmlForPaytenAttribute,
  getNestpayConfig,
  verifyNestpayBrowserReturnHashAllowlist,
} from '@/lib/services/paymentService'
import { isSafePaytenOrderLookupToken } from '@/lib/payten/resolvePaytenBookingLookup'

export type PaytenBrowserReturnVariant = 'success' | 'failure'

/** FormData → tek string değerler (aynı isim tekrar ederse son değer). */
export function paytenFormDataToRecord(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

function recordGetInsensitive(record: Record<string, string>, key: string): string {
  const t = key.toLowerCase()
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === t) return (v ?? '').trim()
  }
  return ''
}

function pickField(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const v = recordGetInsensitive(record, key)
    if (v) return v
  }
  return ''
}

/** failUrl/okUrl POST’unda çoğu zaman yalnızca rnd+HASH gelir; HASH doğrulaması bu yüzden sık düşer. */
function paytenReturnHasFewNonHashKeys(record: Record<string, string>): boolean {
  const n = Object.keys(record).filter((k) => !['hash', 'encoding', 'countdown'].includes(k.toLowerCase())).length
  return n <= 2
}

function maskLongValue(value: string, maxLen = 48): string {
  const v = value.trim()
  if (v.length <= maxLen) return v
  return `${v.slice(0, 24)}…${v.slice(-12)} (${v.length} karakter)`
}

/** Payten: ReturnOid istekteki oid ile aynı olmalı. */
function returnOidMatchesOid(record: Record<string, string>): {
  ok: boolean
  oid: string
  returnOid: string
  message?: string
} {
  const oid = pickField(record, ['oid', 'Oid'])
  const returnOid = pickField(record, ['ReturnOid', 'returnOid'])
  if (!returnOid) return { ok: true, oid, returnOid: '' }
  if (!oid) return { ok: true, oid: '', returnOid, message: 'oid yok; ReturnOid karşılaştırılamadı.' }
  const a = oid.replace(/-/g, '').toLowerCase()
  const b = returnOid.replace(/-/g, '').toLowerCase()
  if (a === b) return { ok: true, oid, returnOid }
  return {
    ok: false,
    oid,
    returnOid,
    message: 'ReturnOid ile oid eşleşmiyor; dönüş şüpheli olabilir.',
  }
}

type FieldRow = { label: string; keys: string[]; mask?: boolean }

/** Payten dokümanı: işlem yanıt parametreleri (+ HASH doğrulama özeti). */
const TRANSACTION_RESPONSE_FIELDS: FieldRow[] = [
  { label: 'Response', keys: ['Response'] },
  { label: 'AuthCode', keys: ['AuthCode'] },
  { label: 'HostRefNum', keys: ['HostRefNum'] },
  { label: 'ProcReturnCode', keys: ['ProcReturnCode'] },
  { label: 'TransId', keys: ['TransId'] },
  { label: 'ErrMsg', keys: ['ErrMsg'] },
  { label: 'ClientIp', keys: ['ClientIp'] },
  { label: 'oid (sipariş no)', keys: ['oid', 'Oid'] },
  { label: 'ReturnOid', keys: ['ReturnOid', 'returnOid'] },
  { label: 'MaskedPan', keys: ['MaskedPan'] },
  { label: 'EXTRA.TRXDATE', keys: ['EXTRA.TRXDATE', 'EXTRA_TRXDATE'] },
  { label: 'rnd', keys: ['rnd', 'Rnd'] },
  { label: 'HASHPARAMS', keys: ['HASHPARAMS', 'hashparams'], mask: true },
  { label: 'HASHPARAMSVAL', keys: ['HASHPARAMSVAL', 'hashparamsval'], mask: true },
  { label: 'HASH', keys: ['HASH', 'hash'], mask: true },
]

/** MPI / 3D Secure yanıt parametreleri (doküman tabloları). */
const MPI_RESPONSE_FIELDS: FieldRow[] = [
  { label: 'mdStatus', keys: ['mdStatus'] },
  { label: 'merchantID', keys: ['merchantID', 'MerchantID'] },
  { label: 'txstatus', keys: ['txstatus', 'TxStatus'] },
  { label: 'iReqCode', keys: ['iReqCode'] },
  { label: 'iReqDetail', keys: ['iReqDetail'], mask: true },
  { label: 'vendorCode', keys: ['vendorCode'] },
  { label: 'PAResSyntaxOK', keys: ['PAResSyntaxOK'] },
  { label: 'ParesVerified', keys: ['ParesVerified'] },
  { label: 'eci', keys: ['eci'] },
  { label: 'cavv', keys: ['cavv'], mask: true },
  { label: 'xid', keys: ['xid'], mask: true },
  { label: 'cavvAlgorithm', keys: ['cavvAlgorithm'] },
  { label: 'md', keys: ['md'], mask: true },
  { label: 'Version', keys: ['Version'] },
  { label: 'sID', keys: ['sID'] },
  { label: 'MdErrorMsg', keys: ['MdErrorMsg'], mask: true },
]

function buildDl(record: Record<string, string>, fields: FieldRow[]): string {
  const parts: string[] = []
  for (const { label, keys, mask } of fields) {
    const raw = pickField(record, keys)
    if (!raw) continue
    const display = mask ? maskLongValue(raw) : raw
    parts.push(
      `<dt>${escapeHtmlForPaytenAttribute(label)}</dt><dd>${escapeHtmlForPaytenAttribute(display)}</dd>`
    )
  }
  return parts.length ? `<dl>${parts.join('')}</dl>` : '<p><em>Bu bölümde gösterilecek alan gelmedi.</em></p>'
}

/**
 * okUrl / failUrl POST: banka her zaman `mdStatus` veya tüm MPI alanlarını göndermez.
 * Yalnızca callback’teki üçlü (Response + Proc + mdStatus) operasyonel; burada yanıltıcı “ret” metni göstermeyiz.
 */
function postReturnResultHintLine(record: Record<string, string>): string {
  const response = recordGetInsensitive(record, 'Response')
  const proc = recordGetInsensitive(record, 'ProcReturnCode')
  const md = recordGetInsensitive(record, 'mdStatus')

  if (response === 'Approved' && proc === '00' && md === '1') {
    return 'İşlem yanıtı (bilgi): Response=Approved, ProcReturnCode=00, mdStatus=1 — bu POST’ta birlikte görünüyor. Kesin sonuç yine de callbackUrl’dir.'
  }
  if (response === 'Approved' && proc === '00' && !md) {
    return 'İşlem yanıtı (bilgi): Response=Approved ve ProcReturnCode=00 bu sayfada görünüyor. mdStatus çoğu okUrl yanıtında post edilmez; bu “eksik alan” ödemenin başarısız olduğu anlamına gelmez. 3D sonucu ve tutar: callbackUrl.'
  }
  if (response === 'Approved' && proc === '00' && md && md !== '1') {
    return `İşlem yanıtı (bilgi): Approved / 00 görünüyor; mdStatus bu POST’ta “${md}”. Tarayıcı dönüşü her zaman bütün MPI alanlarını taşımaz. Kesin değerlendirme callbackUrl.`
  }
  if (response || proc) {
    return 'İşlem yanıtı (bilgi): aşağıdaki alanlara bakın. Bu sayfa sadece bankanın tarayıcıya gönderdiklerini yansıtır; onay/ret ve rezervasyon sunucu callback’iyle kesinleşir.'
  }
  return 'Banka yanıtı kısımlı post etmiş olabilir. Rezervasyon ve ödeme durumu yalnızca callbackUrl üzerinde işlenir.'
}

function verifyBrowserReturnHash(record: Record<string, string>): {
  verified: boolean | null
  detail: string
} {
  const hasIncoming = !!pickField(record, ['HASH', 'hash'])
  if (!hasIncoming) {
    return {
      verified: null,
      detail:
        'HASH yok veya tarayıcı seti eksik; tarayıcıda sıkı doğrulama yapılmaz. Tarayıcı dönüşü kesin kaynak değildir; kesin onay callback ile işlenir.',
    }
  }
  try {
    const { storeKey } = getNestpayConfig()
    const ok = verifyNestpayBrowserReturnHashAllowlist(record, storeKey)
    if (ok) {
      return {
        verified: true,
        detail:
          'HASH (bilgi amaçlı) MPI/yanıt izin listesine göre eşleşti. Yine de: Tarayıcı dönüşü kesin kaynak değildir; kesin onay callback ile işlenir.',
      }
    }
    return {
      verified: null,
      detail:
        'Tarayıcı dönüşünde HASH eşleşmedi (yalnızca uyarı; müşteri akışını engellemez). Tarayıcı dönüşü kesin kaynak değildir; kesin onay callback ile işlenir.',
    }
  } catch {
    return {
      verified: null,
      detail:
        'Ödeme yapılandırması eksik; tarayıcıda HASH denenmedi. Tarayıcı dönüşü kesin kaynak değildir; kesin onay callback ile işlenir.',
    }
  }
}

function hashBanner(verified: boolean | null, detail: string): string {
  /** Tarayıcı dönüşünde hash uyuşmazlığı asla “ret” gibi gösterilmez — yalnızca uyarı tonu. */
  const cls = verified === true ? 'hash-ok' : 'hash-warn'
  return `<div class="banner ${cls}"><strong>HASH (bilgi):</strong> ${escapeHtmlForPaytenAttribute(detail)}</div>`
}

function layout(
  title: string,
  variant: PaytenBrowserReturnVariant,
  body: string,
  metaRefreshUrl?: string
): string {
  const noteBg = variant === 'success' ? '#f0f4f8' : '#f8f0f0'
  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    ${metaRefreshUrl ? `<meta http-equiv="refresh" content="5;url=${escapeHtmlForPaytenAttribute(metaRefreshUrl)}" />` : ''}
    <title>${escapeHtmlForPaytenAttribute(title)}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f4f6f8; color: #1a1a1a; }
      main { max-width: 42rem; margin: 0 auto; background: #fff; border-radius: 12px; padding: 1.5rem 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
      h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
      h2 { font-size: 1.05rem; margin: 1.35rem 0 0.5rem; color: #222; border-bottom: 1px solid #e8e8e8; padding-bottom: 0.35rem; }
      p { margin: 0.65rem 0; line-height: 1.5; font-size: 0.95rem; color: #333; }
      .note { font-size: 0.85rem; color: #555; background: ${noteBg}; padding: 0.75rem 1rem; border-radius: 8px; margin-top: 1.25rem; }
      dl { margin: 0.5rem 0 0; font-size: 0.88rem; }
      dt { font-weight: 600; margin-top: 0.45rem; color: #444; }
      dd { margin: 0.12rem 0 0; word-break: break-word; color: #111; }
      a { color: #0b57d0; }
      .banner { font-size: 0.88rem; padding: 0.65rem 0.85rem; border-radius: 8px; margin: 0.75rem 0 1rem; line-height: 1.45; }
      .hash-ok { background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; }
      .hash-bad { background: #ffebee; color: #b71c1c; border: 1px solid #ef9a9a; }
      .hash-warn { background: #fff8e1; color: #5d4037; border: 1px solid #ffe082; }
      .oid-warn { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; padding: 0.65rem 0.85rem; border-radius: 8px; margin: 0.5rem 0 1rem; font-size: 0.88rem; }
    </style>
  </head>
  <body><main>${body}</main></body>
</html>`
}

export function renderPaytenBrowserReturnInvalidForm(variant: PaytenBrowserReturnVariant): string {
  const body = `
    <h1>Geçersiz istek</h1>
    <p>Form verisi okunamadı.</p>
    <p><a href="/">Ana sayfaya dön</a></p>
  `
  return layout('Geçersiz istek', variant, body)
}

export function renderPaytenBrowserReturnGetPage(variant: PaytenBrowserReturnVariant): string {
  const title = variant === 'success' ? 'Ödeme tamamlandı' : 'Ödeme tamamlanamadı'
  const h1 = variant === 'success' ? 'Ödeme tamamlandı' : 'Ödeme tamamlanamadı'
  const p =
    variant === 'success'
      ? 'Banka tarafı size bu sayfayı doğrudan göstermiş olabilir. Rezervasyon durumunuz e-posta veya rezervasyon yönetim linkiniz üzerinden güncellenir.'
      : 'İşlem banka tarafında onaylanmadı veya iptal edildi. Kartınızdan çekim yapılmamış olabilir; emin değilseniz bankanızı arayabilirsiniz.'
  const body = `
    <h1>${escapeHtmlForPaytenAttribute(h1)}</h1>
    <p>${escapeHtmlForPaytenAttribute(p)}</p>
    <p><a href="/">Ana sayfaya dön</a></p>
    <div class="note">Kesin ödeme ve rezervasyon durumu sunucunuza gelen <strong>callbackUrl</strong> bildirimi ile işlenir. Bu sayfa yalnızca müşteri bilgilendirmesi içindir.</div>
  `
  return layout(title, variant, body)
}

export function renderPaytenBrowserReturnPostPage(
  variant: PaytenBrowserReturnVariant,
  record: Record<string, string>
): string {
  const hashCheck = verifyBrowserReturnHash(record)
  const oidCheck = returnOidMatchesOid(record)
  const hintLine = postReturnResultHintLine(record)
  const bookingNo =
    pickField(record, ['oid', 'Oid', 'ReturnOid', 'returnOid']).trim() || '—'
  const browserTripleOk =
    recordGetInsensitive(record, 'Response') === 'Approved' &&
    recordGetInsensitive(record, 'ProcReturnCode') === '00' &&
    recordGetInsensitive(record, 'mdStatus') === '1'
  const canLinkConfirmation =
    bookingNo !== '—' && isSafePaytenOrderLookupToken(bookingNo)
  const confirmHref =
    variant === 'success' && browserTripleOk && canLinkConfirmation
      ? `/rezervasyon/onaylandi?bookingId=${encodeURIComponent(bookingNo)}`
      : undefined

  const title = variant === 'success' ? 'Ödeme sonucu' : 'Ödeme başarısız'
  const h1 = variant === 'success' ? 'Ödeme işlemi' : 'Ödeme başarısız'
  const lead =
    variant === 'success'
      ? 'Payten ödeme geçidinden döndünüz. Aşağıda işlem yanıtı ve MPI (3D) alanları, bankanın POST ile ilettiği isimlerle (büyük/küçük harf duyarsız okunur) listelenir.'
      : 'Banka veya kart sağlayıcısı işlemi onaylamadı. Hata ve MPI alanları aşağıdadır.'

  const oidBanner = !oidCheck.ok
    ? `<div class="oid-warn"><strong>ReturnOid / oid:</strong> ${escapeHtmlForPaytenAttribute(oidCheck.message ?? 'Uyumsuzluk')}</div>`
    : ''

  const minimalHashNote =
    variant === 'failure' && paytenReturnHasFewNonHashKeys(record) && hashCheck.verified === null
      ? `<p class="note">Bu yanıtta çoğu zaman çok az alan gelir (ör. rnd ve HASH). Tarayıcıda HASH, callback’e göre farklı hesaplanabilir; bu tek başına “sahte sayfa” anlamına gelmez. Ödeme reddi genelde kart / test kartı / 3D veya banka kurallarından kaynaklanır; kesin sonuç sunucudaki <strong>callbackUrl</strong> kayıtlarındadır.</p>`
      : ''

  const bookingSummary =
    variant === 'success'
      ? `<p class="note"><strong>Rezervasyon / sipariş no:</strong> ${escapeHtmlForPaytenAttribute(bookingNo)}</p>`
      : ''

  const redirectBlock =
    confirmHref != null
      ? `<p class="note">Birkaç saniye içinde sitemizdeki onay sayfasına yönlendiriliyorsunuz. Otomatik gitmezse: <a href="${escapeHtmlForPaytenAttribute(confirmHref)}">onay sayfasına geç</a>.</p>`
      : ''

  const body = `
    <h1>${escapeHtmlForPaytenAttribute(h1)}</h1>
    <p>${escapeHtmlForPaytenAttribute(lead)}</p>
    <div class="note" style="margin-bottom:1rem;border-left:4px solid #1f3c88;padding-left:0.75rem;">
      Tarayıcı dönüşü kesin kaynak değildir; kesin onay callback ile işlenir.
    </div>
    ${bookingSummary}
    ${redirectBlock}
    ${hashBanner(hashCheck.verified, hashCheck.detail)}
    ${minimalHashNote}
    ${oidBanner}
    <p>${escapeHtmlForPaytenAttribute(hintLine)}</p>
    <h2>İşlem yanıt parametreleri</h2>
    ${buildDl(record, TRANSACTION_RESPONSE_FIELDS)}
    <h2>MPI (3D Secure) yanıt parametreleri</h2>
    ${buildDl(record, MPI_RESPONSE_FIELDS)}
    <div class="note">Rezervasyon ve tutarın kesin onayı yalnızca <strong>callbackUrl</strong> üzerinde işlenir; bu sayfadaki HASH bilgisi yalnızca teyit amaçlıdır.</div>
    <p><a href="/">Ana sayfaya dön</a></p>
  `
  return layout(title, variant, body, confirmHref)
}
