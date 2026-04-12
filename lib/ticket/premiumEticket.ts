import { z } from 'zod'

/** POST /api/ticket/pdf body — premium e-bilet (Apple Wallet tarzı koyu tema). */
export const premiumEticketPayloadSchema = z.object({
  passengerName: z.string().min(1).max(200),
  guestCount: z.union([z.number().int().min(1).max(500), z.string().min(1).max(120)]),
  ticketClass: z.string().min(1).max(120),
  boardingTime: z.string().min(1).max(80),
  departureTime: z.string().min(1).max(80),
  returnTime: z.string().min(1).max(80),
  /** QR içeriği (URL veya ham metin) */
  qrPayload: z.string().min(1).max(2048),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  currency: z.string().length(3).default('TRY'),
  reservationCode: z.string().min(1).max(64),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(80).optional(),
  contactWebsite: z.string().url().optional(),
  tourTitle: z.string().max(200).optional(),
  meetingPoint: z.string().max(300).optional(),
  brandName: z.string().max(80).optional(),
  logoUrl: z.string().url().optional(),
  /** tr | en — etiketler ve sayı formatı */
  locale: z.enum(['tr', 'en']).default('tr'),
})

export type PremiumEticketPayload = z.infer<typeof premiumEticketPayloadSchema>

/** Örnek istek gövdesi (dokümantasyon / test). */
export const premiumEticketSamplePayload: PremiumEticketPayload = {
  brandName: 'Çeşme Poseidon',
  tourTitle: 'Günübirlik Tekne Turu — Öğle',
  passengerName: 'Ayşe Yılmaz',
  guestCount: 2,
  ticketClass: 'Standart · Üst Güverte',
  boardingTime: '09:30',
  departureTime: '10:00',
  returnTime: '16:30',
  qrPayload: 'https://example.com/bilet/ABC123?token=demo',
  totalAmount: 4500,
  paidAmount: 1500,
  remainingAmount: 3000,
  currency: 'TRY',
  reservationCode: 'PSD-8K2M',
  meetingPoint: 'Çeşme Marina, Rıhtım önü — Poseidon iskelesi',
  contactEmail: 'info@example.com',
  contactPhone: '+90 232 XXX XX XX',
  contactWebsite: 'https://cesmetekneturu.net',
  locale: 'tr',
}
