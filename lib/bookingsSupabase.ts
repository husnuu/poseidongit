import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

/** Admin / public API: jsonb bazen string; sadece counts dolu olabilir — key/label türet. */
export function normalizeMealPreferenceColumn(raw: unknown):
  | {
      key: string
      label: string
      counts?: Array<{ key: string; label: string; count: number }>
    }
  | undefined {
  if (raw == null) return undefined
  let v: unknown = raw
  if (typeof raw === 'string') {
    try {
      v = JSON.parse(raw) as unknown
    } catch {
      return undefined
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const rec = v as Record<string, unknown>
  const countsRaw = rec.counts
  const counts = Array.isArray(countsRaw)
    ? countsRaw
        .map((c) => {
          if (!c || typeof c !== 'object') return null
          const x = c as Record<string, unknown>
          const key = x.key != null ? String(x.key).trim() : ''
          const label = x.label != null ? String(x.label).trim() : ''
          const count = Math.max(0, Number(x.count) || 0)
          if (!key || !label || count <= 0) return null
          return { key, label, count }
        })
        .filter((x): x is { key: string; label: string; count: number } => x != null)
    : undefined

  let key = rec.key != null ? String(rec.key).trim() : ''
  let label = rec.label != null ? String(rec.label).trim() : ''
  if ((!key || !label) && counts && counts.length > 0) {
    const first = counts.reduce((a, b) => (a.count >= b.count ? a : b))
    key = key || first.key
    label = label || first.label
  }
  if (!key || !label) return undefined
  const out: {
    key: string
    label: string
    counts?: Array<{ key: string; label: string; count: number }>
  } = { key, label }
  if (counts && counts.length > 0) out.counts = counts
  return out
}

export type SupabaseBookingRow = {
  id: string
  status?: string | null
  tour_id?: string | null
  tour_title?: string | null
  date?: string | null
  time?: string | null
  meeting_point?: string | null
  class_id?: string | null
  class_name?: string | null
  first_class_locas?: string[] | null
  first_class_loca?: string | null
  unit_price?: number | null
  total_price?: number | null
  currency?: string | null
  customer_first_name?: string | null
  customer_last_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_note?: string | null
  adult_count?: number | null
  child_count?: number | null
  infant_count?: number | null
  additional_travelers?: JsonValue | null
  meal_preference?: JsonValue | null
  source?: string | null
  access_token?: string | null
  manual_source?: string | null
  created_by_admin?: boolean | null
  admin_note?: string | null
  reference?: string | null
  paid_now?: number | null
  /** Rezervasyon sırasında seçilen site dili (tr | en | de). */
  ui_locale?: string | null
  created_at?: string | null
  /** NestPay callback: paid | failed */
  payment_status?: string | null
  nestpay_auth_code?: string | null
  nestpay_host_ref_num?: string | null
  nestpay_trans_id?: string | null
  paid_at?: string | null
  payment_callback_payload?: JsonValue | null
  payment_last_error?: string | null
  /** verified | hash_mismatch */
  payment_verification_status?: string | null
  /** refunded | partial_refunded | refund_failed | null */
  refund_status?: string | null
  refund_amount?: number | null
  refunded_at?: string | null
  refund_trans_id?: string | null
  refund_error?: string | null
  /** void | credit */
  refund_type?: string | null
  refund_reason?: string | null
  refunded_by?: string | null
}

export function normalizeDateOnly(date: string): string {
  return date.slice(0, 10)
}

export function firstClassLocasFromRow(row: Partial<SupabaseBookingRow>): string[] {
  const out = new Set<string>()
  if (Array.isArray(row.first_class_locas)) {
    for (const loca of row.first_class_locas) {
      if (typeof loca === 'string' && /^L(10|[1-9])$/.test(loca.trim())) out.add(loca.trim().toUpperCase())
    }
  }
  if (typeof row.first_class_loca === 'string' && /^L(10|[1-9])$/.test(row.first_class_loca.trim())) {
    out.add(row.first_class_loca.trim().toUpperCase())
  }
  return [...out]
}

export function paxCountFromRow(row: Partial<SupabaseBookingRow>): number {
  const adult = Math.max(0, Number(row.adult_count ?? 0) || 0)
  const child = Math.max(0, Number(row.child_count ?? 0) || 0)
  const infant = Math.max(0, Number(row.infant_count ?? 0) || 0)
  return adult + child + infant
}

export function mapBookingRowToApi(row: SupabaseBookingRow): Record<string, unknown> {
  const firstClassLocas = firstClassLocasFromRow(row)
  const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
  const mealPreference = normalizeMealPreferenceColumn(row.meal_preference)
  return {
    id: row.id,
    status: row.status ?? 'pending',
    tourId: row.tour_id ?? '',
    tourTitle: row.tour_title ?? '',
    date: row.date ?? '',
    ...(row.time && { time: row.time }),
    ...(row.meeting_point && { meetingPoint: row.meeting_point }),
    classId: row.class_id ?? '',
    className: row.class_name ?? '',
    ...(firstClassLocas.length > 0 && { firstClassLocas }),
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    currency: row.currency ?? 'TRY',
    counts: {
      adult: Number(row.adult_count ?? 0),
      child: Number(row.child_count ?? 0),
      infant: Number(row.infant_count ?? 0),
    },
    customer: {
      firstName: row.customer_first_name ?? '',
      lastName: row.customer_last_name ?? '',
      email: row.customer_email ?? '',
      phone: row.customer_phone ?? '',
      ...(row.customer_note && { note: row.customer_note }),
    },
    ...(additionalTravelers.length > 0 && { additionalTravelers }),
    ...(mealPreference && { mealPreference }),
    source: row.source ?? 'web',
    ...(row.manual_source && { manualSource: row.manual_source }),
    ...(row.created_by_admin != null && { createdByAdmin: row.created_by_admin }),
    ...(row.admin_note && { adminNote: row.admin_note }),
    ...(row.reference && { reference: row.reference }),
    ...(row.paid_now != null && { paidNow: Number(row.paid_now) }),
    ...(row.access_token && { accessToken: row.access_token }),
    createdAt: row.created_at ?? null,
    ...(row.payment_status != null && String(row.payment_status).trim() && { paymentStatus: String(row.payment_status).trim() }),
    ...(row.nestpay_auth_code != null &&
      String(row.nestpay_auth_code).trim() && { nestpayAuthCode: String(row.nestpay_auth_code).trim() }),
    ...(row.nestpay_host_ref_num != null &&
      String(row.nestpay_host_ref_num).trim() && { nestpayHostRefNum: String(row.nestpay_host_ref_num).trim() }),
    ...(row.nestpay_trans_id != null &&
      String(row.nestpay_trans_id).trim() && { nestpayTransId: String(row.nestpay_trans_id).trim() }),
    ...(row.paid_at != null && String(row.paid_at).trim() && { paidAt: String(row.paid_at).trim() }),
    ...(row.payment_last_error != null &&
      String(row.payment_last_error).trim() && { paymentLastError: String(row.payment_last_error).trim() }),
    ...(row.payment_verification_status != null &&
      String(row.payment_verification_status).trim() && {
        paymentVerificationStatus: String(row.payment_verification_status).trim(),
      }),
    ...(row.refund_status != null && String(row.refund_status).trim() && { refundStatus: String(row.refund_status).trim() }),
    ...(row.refund_amount != null && { refundAmount: Number(row.refund_amount) }),
    ...(row.refunded_at != null && String(row.refunded_at).trim() && { refundedAt: String(row.refunded_at).trim() }),
    ...(row.refund_trans_id != null && String(row.refund_trans_id).trim() && { refundTransId: String(row.refund_trans_id).trim() }),
    ...(row.refund_error != null && String(row.refund_error).trim() && { refundError: String(row.refund_error).trim() }),
    ...(row.refund_type != null && String(row.refund_type).trim() && { refundType: String(row.refund_type).trim() }),
    ...(row.refund_reason != null && String(row.refund_reason).trim() && { refundReason: String(row.refund_reason).trim() }),
    ...(row.refunded_by != null && String(row.refunded_by).trim() && { refundedBy: String(row.refunded_by).trim() }),
  }
}
