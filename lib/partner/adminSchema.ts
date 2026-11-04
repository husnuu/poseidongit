import { z } from 'zod'
import { PARTNER_SLUG_REGEX, PARTNER_TYPES } from '@/lib/partner/partners'

const MAX_LOGO_DATA_LENGTH = 300_000

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((s) => s || null)

const logoData = z
  .string()
  .max(MAX_LOGO_DATA_LENGTH, { message: 'Logo çok büyük.' })
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, { message: 'Logo PNG, JPG veya WEBP olmalı.' })
  .nullish()
  .transform((s) => s || null)

const editableFields = {
  name: z.string().trim().min(2, { message: 'İşletme adı gerekli.' }).max(120),
  type: z.enum(PARTNER_TYPES),
  email: z.string().trim().toLowerCase().max(254).email({ message: 'Geçerli e-posta girin.' }),
  commissionRate: z.coerce.number().min(0, { message: 'Oran 0-100 arası olmalı.' }).max(100, { message: 'Oran 0-100 arası olmalı.' }),
  logoData,
  welcomeMessage: optionalText(200),
  contactName: optionalText(120),
  contactPhone: optionalText(48),
  adminNote: optionalText(2000),
}

const password = z.string().min(8, { message: 'Şifre en az 8 karakter olmalı.' }).max(200)

export const createPartnerSchema = z.object({
  ...editableFields,
  slug: z.string().trim().regex(PARTNER_SLUG_REGEX, { message: 'Bağlantı adı küçük harf, rakam ve tire içermeli.' }).max(80),
  password,
})

export const updatePartnerSchema = z
  .object({ ...editableFields, isActive: z.boolean(), password })
  .partial()

export function partnerColumns(input: Partial<z.output<typeof updatePartnerSchema>>): Record<string, unknown> {
  const map: [unknown, string][] = [
    [input.name, 'name'],
    [input.type, 'partner_type'],
    [input.email, 'email'],
    [input.commissionRate, 'commission_rate'],
    [input.logoData, 'logo_data'],
    [input.welcomeMessage, 'welcome_message'],
    [input.contactName, 'contact_name'],
    [input.contactPhone, 'contact_phone'],
    [input.adminNote, 'admin_note'],
    [input.isActive, 'is_active'],
  ]
  return Object.fromEntries(map.filter(([v]) => v !== undefined).map(([v, k]) => [k, v]))
}
