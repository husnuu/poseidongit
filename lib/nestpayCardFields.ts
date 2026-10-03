/**
 * Tarayıcıda toplanan kart verisi için saf yardımcı fonksiyonlar (3D Pay — tur rezervasyonu).
 *
 * ÖNEMLİ — PCI kapsamı: Bu modüldeki değerler SADECE React bileşen state'inde
 * (tarayıcı belleğinde) tutulur ve banka gateway'ine gidecek <form> öğesine
 * submit anında eklenir. Bu değerler:
 *   - ASLA fetch/XHR gövdesine eklenmez (bizim backend'imize/Supabase'e gitmez)
 *   - ASLA console.log/console.error ile loglanmaz
 *   - ASLA localStorage/sessionStorage/cookie'ye yazılmaz
 *   - ASLA Server Action/API route'a gönderilmez
 * Tek varış noktası: NestPay gateway'i, müşterinin tarayıcısından doğrudan
 * form POST ile (bkz. lib/nestpay/submitPaymentForm.ts).
 */

export type CardFields = {
  /** Sadece rakam, boşluksuz. */
  pan: string
  /** 2 haneli ay, "01"–"12". */
  expMonth: string
  /** 2 haneli yıl, "25" gibi (20YY). */
  expYear: string
  /** 3-4 haneli güvenlik kodu. */
  cvv: string
  /** Sadece UI/UX amaçlı — NestPay'e ayrı bir parametre olarak gönderilmez (BillToName zaten mevcut). */
  holderName: string
}

export const EMPTY_CARD_FIELDS: CardFields = {
  pan: '',
  expMonth: '',
  expYear: '',
  cvv: '',
  holderName: '',
}

/** Kart numarası girişini sadece rakamlara indirger — NestPay dokümanı: "pan" alanı maksimum 20 rakam. */
export function sanitizeCardNumberInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 20)
}

/** Ekranda 4'erli gruplar halinde gösterir: "4111 1111 1111 1111". */
export function formatCardNumberDisplay(digits: string): string {
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

/** Luhn algoritması — kart numarası sağlama toplamı. */
export function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

/** "AA/YY" girişini ay/yıl haneli string'lerine ayrıştırır; eksikse boş döner. */
export function parseExpiryInput(raw: string): { month: string; year: string } {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return { month: digits.slice(0, 2), year: digits.slice(2, 4) }
}

/** "AA/YY" ekran formatı. */
export function formatExpiryDisplay(raw: string): string {
  const { month, year } = parseExpiryInput(raw)
  if (!month) return ''
  if (!year) return month
  return `${month}/${year}`
}

function isExpiryInFuture(month: string, year: string): boolean {
  const m = Number(month)
  const y = Number(year)
  if (!Number.isInteger(m) || m < 1 || m > 12) return false
  if (!Number.isInteger(y) || String(year).length !== 2) return false
  const fullYear = 2000 + y
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (fullYear > currentYear) return true
  if (fullYear === currentYear) return m >= currentMonth
  return false
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'troy' | 'unionpay' | 'diners' | 'jcb'

/**
 * Kart numarası ön ekine (BIN/IIN) göre marka tespiti — sadece UI ipucu amaçlı
 * (hangi logo vurgulanacak / CVV uzunluğu). NestPay'in "3D Pay" formu marka
 * bazında AYRI bir parametre istemiyor — dokümanın "Girişi Zorunlu olan
 * Parametreler" tablosunda kart şemasına özgü hiçbir alan yok; sadece ham
 * `pan` gönderiliyor, şema tespiti bankanın kendi BIN veritabanında yapılıyor.
 * Yani bu fonksiyon hangi kart markasını GÖNDERDİĞİMİZİ değil, SADECE arayüzde
 * hangi logonun vurgulanacağını belirler — Visa/Mastercard dışındaki kartların
 * (Troy, UnionPay, Amex...) gerçekten kabul edilip edilmeyeceği bankadaki
 * üye işyeri hesabının hangi şemalara açık olduğuna bağlıdır, koddan değil.
 */
export function detectCardBrand(panDigits: string): CardBrand | null {
  const d = panDigits.replace(/\D/g, '')
  if (!d) return null
  if (/^9792/.test(d)) return 'troy' // Türkiye yerel kart şeması — diğerlerinden önce kontrol edilir
  if (/^4/.test(d)) return 'visa'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^3(0[0-5]|[68])/.test(d)) return 'diners'
  if (/^35(2[89]|[3-8]\d)/.test(d)) return 'jcb'
  if (/^(6011|65|64[4-9])/.test(d)) return 'discover'
  if (/^62/.test(d)) return 'unionpay'
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720))/.test(d)) return 'mastercard'
  return null
}

export type CardFieldErrors = Partial<Record<keyof CardFields, string>>

export type CardFieldMessages = {
  cardNumber: string
  cardExpiry: string
  cardCvc: string
  cardHolderName: string
}

/** Tüm kart alanlarını doğrular; hatalı alanlar için mesaj döner. */
export function validateCardFields(fields: CardFields, messages: CardFieldMessages): CardFieldErrors {
  const errors: CardFieldErrors = {}
  const pan = fields.pan.trim()
  if (pan.length < 13 || pan.length > 20 || !luhnCheck(pan)) {
    errors.pan = messages.cardNumber
  }
  if (!isExpiryInFuture(fields.expMonth, fields.expYear)) {
    errors.expMonth = messages.cardExpiry
  }
  const expectedCvvLen = detectCardBrand(pan) === 'amex' ? 4 : 3
  if (fields.cvv.trim().length !== expectedCvvLen || !/^\d+$/.test(fields.cvv.trim())) {
    errors.cvv = messages.cardCvc
  }
  if (!fields.holderName.trim()) {
    errors.holderName = messages.cardHolderName
  }
  return errors
}

export function isCardFieldsValid(fields: CardFields, messages: CardFieldMessages): boolean {
  return Object.keys(validateCardFields(fields, messages)).length === 0
}

/**
 * CardFields'ı NestPay'in 3D Pay formunda beklediği parametrelere çevirir.
 *
 * Dikkat: bu alanlar hash hesabına DAHİL DEĞİLDİR (bkz. lib/nestpay/hash.ts) —
 * hash sunucuda, kart verisi hiç görülmeden üretilir. Bu fonksiyon sadece
 * tarayıcıda, bankaya submit edilecek <form>'un son halini oluşturmak için
 * sunucudan gelen alanlarla birleştirilir (bkz. submitNestpayForm çağrısı).
 *
 * DOĞRULANDI (Payten "3D Pay" entegrasyon dokümanı, "Girişi Zorunlu olan
 * Parametreler" tablosu): Ecom_Payment_Card_ExpDate_Year = 4 rakam,
 * Ecom_Payment_Card_ExpDate_Month = 2 rakam. Arayüzde kullanıcıdan hâlâ
 * standart "AA/YY" (2 haneli yıl) alınır, burada 4 haneye genişletilir.
 * `cardType` alanı (örnek HTML'de Visa/Mastercard seçimi) bu tabloda ne
 * zorunlu ne isteğe bağlı parametre olarak geçiyor — gönderilmiyor; şema
 * tespiti tamamen bankanın kendi BIN veritabanında yapılıyor.
 */
export function toNestpayCardParams(fields: CardFields): Record<string, string> {
  const yy = Number(fields.expYear.trim())
  const fullYear = Number.isInteger(yy) ? String(2000 + yy).padStart(4, '0') : fields.expYear.trim()
  return {
    pan: fields.pan.trim(),
    cv2: fields.cvv.trim(),
    Ecom_Payment_Card_ExpDate_Month: fields.expMonth.trim().padStart(2, '0'),
    Ecom_Payment_Card_ExpDate_Year: fullYear,
  }
}
