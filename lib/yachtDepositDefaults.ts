import type { SiteLocale } from '@/lib/i18n/config'

export type YachtDepositPageContent = {
  titleTop: string
  titleBottom: string
  intro: string
  bullets: string[]
  seo: { title: string; description: string }
}

export type YachtDepositFormUi = {
  formSectionTitle: string
  depositLabel: string
  calendarTitle: string
  yachtNameLabel: string
  messageLabel: string
  submitLabel: string
  secureNote: string
  redirectNote: string
  labelFirstName: string
  labelLastName: string
  labelEmail: string
  labelPhone: string
  valFirstName: string
  valLastName: string
  valEmail: string
  valPhone: string
  valCharterDate: string
  valTerms: string
  termsLinkText: string
  termsCheckboxLead: string
  termsCheckboxTrail: string
  turnstileError: string
  payError: string
  networkError: string
  disabledMessage: string
}

const TR_CONTENT: YachtDepositPageContent = {
  titleTop: 'ÖZEL TEKNE',
  titleBottom: 'KAPORA ÖDEMESİ',
  intro:
    'Özel yat kiralama talebinizi güvence altına almak için kapora ödemenizi bu sayfadan güvenle yapabilirsiniz. Ödeme onayından sonra Poseidon ekibimiz müsaitlik ve kiralama detayları için sizinle iletişime geçer.',
  bullets: [
    'Kapora, özel tekne kiralama talebinizin ön onayıdır.',
    'Ödeme bankanızın güvenli 3D doğrulama ekranında tamamlanır.',
    'Onay e-postası ve ödeme bilgisi e-posta adresinize iletilir.',
    'Kalan tutar kiralama tarihinden önce veya karşılıklı anlaşmaya göre tahsil edilir.',
  ],
  seo: {
    title: 'Özel tekne kapora ödemesi',
    description:
      'Özel yat kiralama kapora ödemenizi güvenli sanal POS ile tamamlayın. Poseidon ekibi ödeme sonrası sizinle iletişime geçer.',
  },
}

const EN_CONTENT: YachtDepositPageContent = {
  titleTop: 'PRIVATE YACHT',
  titleBottom: 'CHARTER DEPOSIT',
  intro:
    'Secure your private yacht charter request with a deposit on this page. After payment confirmation, the Poseidon team will contact you about availability and charter details.',
  bullets: [
    'The deposit confirms your private yacht charter request.',
    'Payment is completed on your bank’s secure 3D verification page.',
    'A confirmation email with payment details is sent to you.',
    'The remaining balance is collected before the charter date or as agreed.',
  ],
  seo: {
    title: 'Private yacht charter deposit payment',
    description:
      'Complete your private yacht charter deposit securely via our payment gateway. The Poseidon team will contact you after payment.',
  },
}

const TR_FORM: YachtDepositFormUi = {
  formSectionTitle: 'Bilgileriniz',
  depositLabel: 'Ödenecek kapora',
  calendarTitle: 'Tercih ettiğiniz tarih',
  yachtNameLabel: 'Tekne / talep (isteğe bağlı)',
  messageLabel: 'Notunuz (isteğe bağlı)',
  submitLabel: 'Kaporayı öde',
  secureNote: 'Ödeme bankanızın güvenli 3D doğrulama sayfasında tamamlanır.',
  redirectNote: 'Devam ettiğinizde banka ödeme ekranına yönlendirilirsiniz.',
  labelFirstName: 'Ad',
  labelLastName: 'Soyad',
  labelEmail: 'E-posta',
  labelPhone: 'Telefon',
  valFirstName: 'Ad gerekli',
  valLastName: 'Soyad gerekli',
  valEmail: 'Geçerli e-posta girin',
  valPhone: 'Telefon gerekli',
  valCharterDate: 'Lütfen takvimden bir tarih seçin.',
  valTerms: 'Ödemeye devam etmek için sözleşmeyi kabul etmeniz gerekir.',
  termsLinkText: 'Mesafeli Satış Sözleşmesi',
  termsCheckboxLead: '',
  termsCheckboxTrail: '’ni okudum ve kabul ediyorum.',
  turnstileError: 'Lütfen doğrulama kutusunu işaretleyin.',
  payError: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
  networkError: 'Bağlantı hatası. Lütfen tekrar deneyin.',
  disabledMessage: 'Kapora ödeme sayfası şu an kapalı. Lütfen bizimle iletişime geçin.',
}

const EN_FORM: YachtDepositFormUi = {
  formSectionTitle: 'Your details',
  depositLabel: 'Deposit amount',
  calendarTitle: 'Preferred charter date',
  yachtNameLabel: 'Yacht / request (optional)',
  messageLabel: 'Your note (optional)',
  submitLabel: 'Pay deposit',
  secureNote: 'Payment is completed on your bank’s secure 3D verification page.',
  redirectNote: 'You will be redirected to the bank payment screen to continue.',
  labelFirstName: 'First name',
  labelLastName: 'Last name',
  labelEmail: 'Email',
  labelPhone: 'Phone',
  valFirstName: 'First name is required',
  valLastName: 'Last name is required',
  valEmail: 'Enter a valid email',
  valPhone: 'Phone is required',
  valCharterDate: 'Please select a date on the calendar.',
  valTerms: 'You must accept the agreement to continue.',
  termsLinkText: 'Distance Sales Agreement',
  termsCheckboxLead: 'I have read and accept the ',
  termsCheckboxTrail: '.',
  turnstileError: 'Please complete the verification check.',
  payError: 'Could not start payment. Please try again.',
  networkError: 'Connection error. Please try again.',
  disabledMessage: 'Deposit payment is currently unavailable. Please contact us.',
}

const CONTENT: Record<SiteLocale, YachtDepositPageContent> = {
  tr: TR_CONTENT,
  en: EN_CONTENT,
  de: EN_CONTENT,
}

const FORM: Record<SiteLocale, YachtDepositFormUi> = {
  tr: TR_FORM,
  en: EN_FORM,
  de: EN_FORM,
}

export function getYachtDepositPageContent(locale: SiteLocale): YachtDepositPageContent {
  return CONTENT[locale] ?? TR_CONTENT
}

export function getYachtDepositFormUi(locale: SiteLocale): YachtDepositFormUi {
  return FORM[locale] ?? TR_FORM
}

/** Sanity yalnızca kapora tutarı için; metinler kodda. TR dışı dillerde her zaman kod varsayılanları. */
export function resolveYachtDepositPageContent(
  locale: SiteLocale,
  sanity?: {
    titleTop?: string | null
    titleBottom?: string | null
    intro?: string | null
    bullets?: string[] | null
    seo?: { title?: string | null; description?: string | null } | null
  } | null
): YachtDepositPageContent {
  const defaults = getYachtDepositPageContent(locale)
  if (locale !== 'tr') {
    return defaults
  }
  const bullets =
    sanity?.bullets?.filter((b): b is string => Boolean(b?.trim())) ?? defaults.bullets
  return {
    titleTop: sanity?.titleTop?.trim() || defaults.titleTop,
    titleBottom: sanity?.titleBottom?.trim() || defaults.titleBottom,
    intro: sanity?.intro?.trim() || defaults.intro,
    bullets: bullets.length > 0 ? bullets : defaults.bullets,
    seo: {
      title: sanity?.seo?.title?.trim() || defaults.seo.title,
      description: sanity?.seo?.description?.trim() || defaults.seo.description,
    },
  }
}
