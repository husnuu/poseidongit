import { supabase } from '@/lib/supabase'
import { parseWidgetDomains } from '@/lib/embed/frameAncestors'
import {
  PARTNER_BOOKING_COLUMNS,
  type PartnerBookingRow,
  type PartnerPayoutRow,
} from '@/lib/partner/commission'

export const PARTNER_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const PARTNER_TYPES = ['hotel', 'pension', 'agency', 'other'] as const
export type PartnerType = (typeof PARTNER_TYPES)[number]

const ACCOUNT_COLUMNS =
  'id, created_at, slug, name, partner_type, email, commission_rate, logo_data, welcome_message, contact_name, contact_phone, admin_note, is_active, password_changed_at'

/** password_hash bilerek yok — yalnızca giriş/şifre değiştirme akışları okur. */
export type PartnerAccount = {
  id: string
  createdAt: string
  slug: string
  name: string
  type: string
  email: string
  commissionRate: number
  logoData: string | null
  welcomeMessage: string | null
  contactName: string | null
  contactPhone: string | null
  adminNote: string | null
  isActive: boolean
  passwordChangedAt: string
}

export type PartnerPublic = Pick<PartnerAccount, 'id' | 'slug' | 'name' | 'logoData' | 'welcomeMessage'>

function toAccount(row: Record<string, unknown>): PartnerAccount {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? ''),
    slug: String(row.slug),
    name: String(row.name),
    type: String(row.partner_type ?? 'hotel'),
    email: String(row.email),
    commissionRate: Number(row.commission_rate ?? 0),
    logoData: typeof row.logo_data === 'string' ? row.logo_data : null,
    welcomeMessage: typeof row.welcome_message === 'string' ? row.welcome_message : null,
    contactName: typeof row.contact_name === 'string' ? row.contact_name : null,
    contactPhone: typeof row.contact_phone === 'string' ? row.contact_phone : null,
    adminNote: typeof row.admin_note === 'string' ? row.admin_note : null,
    isActive: row.is_active === true,
    passwordChangedAt: String(row.password_changed_at ?? ''),
  }
}

export async function getPartnerAccountById(id: string): Promise<PartnerAccount | null> {
  const { data, error } = await supabase.from('partners').select(ACCOUNT_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(`Supabase partners query failed: ${error.message}`)
  return data ? toAccount(data as Record<string, unknown>) : null
}

export async function listPartnerAccounts(): Promise<PartnerAccount[]> {
  const { data, error } = await supabase
    .from('partners')
    .select(ACCOUNT_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Supabase partners query failed: ${error.message}`)
  return (data ?? []).map((row) => toAccount(row as Record<string, unknown>))
}

/** Mini sayfa: yalnızca aktif partner ve yalnızca herkese açık alanlar. */
export async function getActivePartnerBySlug(slug: string): Promise<PartnerPublic | null> {
  if (!PARTNER_SLUG_REGEX.test(slug)) return null
  const { data, error } = await supabase
    .from('partners')
    .select('id, slug, name, logo_data, welcome_message')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`Supabase partners query failed: ${error.message}`)
  if (!data) return null
  return {
    id: String(data.id),
    slug: String(data.slug),
    name: String(data.name),
    logoData: typeof data.logo_data === 'string' ? data.logo_data : null,
    welcomeMessage: typeof data.welcome_message === 'string' ? data.welcome_message : null,
  }
}

const PAGE_SIZE = 1000

/** Supabase tek sorguda en fazla 1000 satır döndürür; sayfalayarak hepsini alır. */
export async function fetchPartnerBookings(partnerId?: string): Promise<PartnerBookingRow[]> {
  const rows: PartnerBookingRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const base = supabase.from('bookings').select(PARTNER_BOOKING_COLUMNS)
    const scoped = partnerId ? base.eq('partner_id', partnerId) : base.not('partner_id', 'is', null)
    const { data, error } = await scoped
      .order('date', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Supabase partner bookings query failed: ${error.message}`)
    const page = (data ?? []) as unknown as PartnerBookingRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

export async function fetchPartnerPayouts(partnerId?: string): Promise<PartnerPayoutRow[]> {
  const base = supabase.from('partner_payouts').select('partner_id, period, amount, created_at, note')
  const { data, error } = await (partnerId ? base.eq('partner_id', partnerId) : base)
  if (error) throw new Error(`Supabase partner_payouts query failed: ${error.message}`)
  return (data ?? []) as PartnerPayoutRow[]
}

const CHANNELS = ['qr', 'link', 'reception', 'widget'] as const
export type PartnerChannel = (typeof CHANNELS)[number]

/**
 * Tarayıcıdaki partner atfını rezervasyon alanlarına çevirir. Partner bulunamazsa,
 * tablo henüz kurulmamışsa veya sorgu hata verirse {} döner: atıf rezervasyonu
 * asla engellemez.
 */
export async function resolvePartnerBookingFields(ref: unknown): Promise<Record<string, unknown>> {
  const partner = await resolvePartnerRef(ref)
  return partner ? partnerBookingFields(partner.id, partner.commissionRate, partner.channel) : {}
}

/** Tarayıcıdan gelen { slug, channel } → aktif partner; bulunamazsa/hata olursa null. */
export async function resolvePartnerRef(
  ref: unknown
): Promise<{ id: string; name: string; commissionRate: number; channel: PartnerChannel } | null> {
  if (!ref || typeof ref !== 'object') return null
  const { slug, channel } = ref as { slug?: unknown; channel?: unknown }
  if (typeof slug !== 'string' || !PARTNER_SLUG_REGEX.test(slug)) return null
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('id, name, commission_rate')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
    if (error || !data) return null
    return {
      id: String(data.id),
      name: String(data.name ?? slug),
      commissionRate: Number(data.commission_rate ?? 0),
      channel: CHANNELS.includes(channel as PartnerChannel) ? (channel as PartnerChannel) : 'link',
    }
  } catch {
    return null
  }
}

/** Yat teklif talebi: komisyon yok (fiyat henüz belli değil), yalnızca hangi partnerden geldiği. */
export async function resolvePartnerInquiryFields(ref: unknown): Promise<Record<string, unknown>> {
  const partner = await resolvePartnerRef(ref)
  return partner ? { partner_id: partner.id, partner_name: partner.name, partner_channel: partner.channel } : {}
}

export function partnerBookingFields(partnerId: string, commissionRate: number, channel: PartnerChannel) {
  return { partner_id: partnerId, partner_commission_rate: commissionRate, partner_channel: channel }
}

/** Tablolar kurulmamışsa hata mesajı bunu söylesin (docs/supabase-partners.sql). */
export function partnerSetupErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  return /partners|partner_id|partner_payouts/.test(msg) && /does not exist|Could not find|schema cache/i.test(msg)
    ? 'Partner tabloları kurulu değil: docs/supabase-partners.sql dosyasını Supabase SQL Editor’da çalıştırın.'
    : 'Sunucu hatası'
}

/** Widget alan adları ayrı sorgulanır: sütun (widget_domains) henüz yoksa partner hesabı yine okunabilsin. */
export async function getPartnerWidgetDomains(partnerId: string): Promise<{ domains: string[]; configured: boolean }> {
  const { data, error } = await supabase.from('partners').select('widget_domains').eq('id', partnerId).maybeSingle()
  if (error) return { domains: [], configured: false }
  return { domains: parseWidgetDomains((data as { widget_domains?: unknown } | null)?.widget_domains), configured: true }
}

export async function setPartnerWidgetDomains(partnerId: string, domains: string[]): Promise<void> {
  const { error } = await supabase
    .from('partners')
    .update({ widget_domains: domains.length > 0 ? domains.join('\n') : null })
    .eq('id', partnerId)
  if (error) {
    if (/widget_domains/.test(error.message)) {
      throw new Error('widget_domains sütunu yok: docs/supabase-partners.sql dosyasını Supabase SQL Editor\'da tekrar çalıştırın.')
    }
    throw new Error(`Supabase partners update failed: ${error.message}`)
  }
}
