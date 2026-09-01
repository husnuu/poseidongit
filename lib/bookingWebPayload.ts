import { z } from 'zod'
import type { BookingCreatePayload } from '@/lib/firestore/bookingTypes'
import {
  additionalTravelerSlotCount,
  parseAdditionalTravelersFromBody,
} from '@/lib/bookingAdditionalTravelers'
import { parseInfantGendersFromBody, parsePassengerGender } from '@/lib/bookingPassengerGender'
import { parseSelectedExtrasFromBody } from '@/lib/bookingExtras'
import { DEFAULT_LOCALE, isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import {
  sanitizeCustomerNote,
  sanitizeMeetingPointText,
  sanitizePersonName,
  sanitizePhoneDisplay,
  sanitizeTourSlugOrId,
  sanitizeTourTitleText,
} from '@/lib/inputSanitize'

const LOCA_REGEX = /^L(10|[1-9])$/

const nonNegInt = z.coerce.number().int().min(0).max(200)

const countsSchema = z
  .object({
    adult: nonNegInt,
    child: nonNegInt,
    infant: nonNegInt,
  })
  .refine((c) => c.adult + c.child + c.infant >= 1, { message: 'Kişi sayısı en az 1 olmalıdır.' })
  .refine((c) => c.adult + c.child + c.infant <= 200, { message: 'Kişi sayısı çok yüksek.' })

const customerSchema = z.object({
  firstName: z
    .string()
    .max(8000)
    .transform((s) => sanitizePersonName(s, 80))
    .refine((s) => s.length > 0, { message: 'Ad gerekli' }),
  lastName: z
    .string()
    .max(8000)
    .transform((s) => sanitizePersonName(s, 80))
    .refine((s) => s.length > 0, { message: 'Soyad gerekli' }),
  email: z
    .string()
    .max(320)
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1, { message: 'E-posta gerekli' }).max(254).email({ message: 'Geçerli e-posta gerekli' })),
  phone: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => sanitizePhoneDisplay(typeof v === 'string' ? v : '', 48)),
  note: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (typeof v === 'string' ? sanitizeCustomerNote(v, 2000) : undefined)),
  gender: z.union([z.string(), z.undefined(), z.null()]).optional(),
})

const bookingWebJsonSchema = z.object({
  locale: z.union([z.string(), z.undefined(), z.null()]).optional(),
  tourId: z
    .string()
    .max(8000)
    .transform((s) => sanitizeTourSlugOrId(s, 200))
    .refine((s) => s.length > 0, { message: 'Tur bilgisi gerekli' }),
  tourTitle: z
    .string()
    .max(8000)
    .transform((s) => sanitizeTourTitleText(s, 300))
    .refine((s) => s.length > 0, { message: 'Tur adı gerekli' }),
  date: z.string().max(64).trim().min(1, { message: 'Tarih gerekli' }),
  time: z.union([z.string(), z.undefined(), z.null()]).optional(),
  meetingPoint: z.union([z.string(), z.undefined(), z.null()]).optional(),
  counts: countsSchema,
  classId: z.string().max(200).trim().min(1, { message: 'Sınıf gerekli' }),
  className: z.string().max(400).trim().min(1, { message: 'Sınıf adı gerekli' }),
  firstClassLocas: z.array(z.unknown()).optional(),
  firstClassLoca: z.union([z.string(), z.undefined(), z.null()]).optional(),
  customer: customerSchema,
  additionalTravelers: z.unknown().optional(),
  infantGenders: z.unknown().optional(),
  selectedExtras: z.unknown().optional(),
})

function formatZodIssues(err: z.ZodError): string {
  const msgs = err.issues.map((i) => i.message).filter(Boolean)
  const uniq = Array.from(new Set(msgs))
  return uniq.length ? uniq.join(' ') : 'Geçersiz istek.'
}

function parseFirstClassLocas(
  classId: string,
  rawLocas: unknown[] | undefined,
  rawLoca: string | null | undefined
): string[] | undefined {
  const k = (classId ?? '').toLowerCase().trim()
  if (k !== 'first' && !k.startsWith('first')) {
    return undefined
  }
  let firstClassLocas: string[] | undefined
  if (Array.isArray(rawLocas)) {
    firstClassLocas = rawLocas
      .map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : ''))
      .filter((x) => LOCA_REGEX.test(x))
    if (firstClassLocas.length === 0) firstClassLocas = undefined
  }
  if (!firstClassLocas && typeof rawLoca === 'string' && LOCA_REGEX.test(rawLoca.trim())) {
    firstClassLocas = [rawLoca.trim().toUpperCase()]
  }
  return firstClassLocas
}

export type ParseWebBookingResult =
  | { ok: true; payload: BookingCreatePayload }
  | { ok: false; error: string }

/** POST /api/bookings gövdesini doğrular ve BookingCreatePayload üretir. */
export function parseBookingWebPayload(body: unknown): ParseWebBookingResult {
  const parsed = bookingWebJsonSchema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, error: `Eksik veya geçersiz alan: ${formatZodIssues(parsed.error)}` }
  }
  const v = parsed.data

  const extraN = additionalTravelerSlotCount({
    adult: v.counts.adult,
    child: v.counts.child,
    infant: v.counts.infant,
  })
  const parsedExtras = parseAdditionalTravelersFromBody(v.additionalTravelers)
  if (parsedExtras === null) {
    return { ok: false, error: 'Eksik veya geçersiz alan: diğer yolcu listesi geçersiz.' }
  }
  if (extraN === 0 && parsedExtras.length > 0) {
    return { ok: false, error: 'Eksik veya geçersiz alan: ek yolcu listesi.' }
  }
  if (extraN > 0 && parsedExtras.length !== extraN) {
    return { ok: false, error: 'Eksik veya geçersiz alan: tüm yolcuların ad-soyadı.' }
  }
  if (extraN > 0 && parsedExtras.some((t) => !t.firstName.trim() || !t.lastName.trim())) {
    return { ok: false, error: 'Eksik veya geçersiz alan: tüm yolcuların ad-soyadı.' }
  }

  const customerGender = parsePassengerGender(v.customer.gender)
  if (!customerGender) {
    return { ok: false, error: 'Eksik veya geçersiz alan: ana yolcu cinsiyeti.' }
  }
  if (extraN > 0 && parsedExtras.some((t) => !t.gender)) {
    return { ok: false, error: 'Eksik veya geçersiz alan: tüm yolcuların cinsiyeti.' }
  }

  const parsedInfantGenders = parseInfantGendersFromBody(v.infantGenders)
  if (parsedInfantGenders === null) {
    return { ok: false, error: 'Eksik veya geçersiz alan: bebek cinsiyet bilgisi.' }
  }
  if (v.counts.infant > 0 && parsedInfantGenders.length !== v.counts.infant) {
    return { ok: false, error: 'Eksik veya geçersiz alan: tüm bebeklerin cinsiyeti.' }
  }

  const parsedSelectedExtras = parseSelectedExtrasFromBody(v.selectedExtras)
  if (parsedSelectedExtras === null) {
    return { ok: false, error: 'Eksik veya geçersiz alan: ekstra hizmet seçimi.' }
  }

  const extraGenders = parsedExtras
    .map((t) => t.gender)
    .filter((g): g is 'male' | 'female' => g === 'male' || g === 'female')
  const allGenders: Array<'male' | 'female'> = [customerGender, ...extraGenders, ...parsedInfantGenders]
  if (allGenders.length > 0 && allGenders.every((g) => g === 'male')) {
    return { ok: false, error: 'Rezervasyonu tamamlayabilmek için yolcular arasında en az bir bayan bulunmalıdır.' }
  }

  const timeRaw = typeof v.time === 'string' ? v.time.trim().slice(0, 32) : ''
  const time = timeRaw.length > 0 ? timeRaw : undefined
  const mpRaw = typeof v.meetingPoint === 'string' ? v.meetingPoint : ''
  const meetingPoint = mpRaw.trim().length > 0 ? sanitizeMeetingPointText(mpRaw, 500) : undefined

  const rawLoc = typeof v.locale === 'string' ? v.locale.trim().toLowerCase() : ''
  const uiLocale: SiteLocale = isSiteLocale(rawLoc) ? rawLoc : DEFAULT_LOCALE

  const firstClassLocas = parseFirstClassLocas(
    v.classId,
    Array.isArray(v.firstClassLocas) ? v.firstClassLocas : undefined,
    v.firstClassLoca
  )

  const payload: BookingCreatePayload = {
    uiLocale,
    tourId: v.tourId,
    tourTitle: v.tourTitle,
    date: v.date.trim(),
    time,
    meetingPoint,
    counts: { adult: v.counts.adult, child: v.counts.child, infant: v.counts.infant },
    classId: v.classId.trim(),
    className: v.className.trim(),
    ...(firstClassLocas && firstClassLocas.length > 0 && { firstClassLocas }),
    customer: {
      firstName: v.customer.firstName,
      lastName: v.customer.lastName,
      email: v.customer.email,
      phone: v.customer.phone,
      gender: customerGender,
      ...(v.customer.note !== undefined && v.customer.note !== '' && { note: v.customer.note }),
    },
    ...(extraN > 0
      ? {
          additionalTravelers: parsedExtras.map((t) => ({
            firstName: t.firstName,
            lastName: t.lastName,
            ...(t.gender === 'male' || t.gender === 'female' ? { gender: t.gender } : {}),
          })),
        }
      : {}),
    ...(parsedInfantGenders.length > 0 ? { infantGenders: [...parsedInfantGenders] } : {}),
    ...(parsedSelectedExtras.length > 0 ? { selectedExtras: parsedSelectedExtras } : {}),
  }

  return { ok: true, payload }
}
