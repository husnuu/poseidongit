import { supabase } from '@/lib/supabase'

/**
 * whatsapp_messages tablosu: her rezervasyon + mesaj türü için tek satır
 * (benzersiz indeks) — aynı hatırlatmanın iki kez gitmesini engeller ve
 * admin panelinde gönderim geçmişi olarak gösterilir.
 * Şema: docs/supabase-whatsapp.sql
 */

const TABLE = 'whatsapp_messages'

export type WaLogStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped'

export type WaClaimResult =
  | { state: 'claimed'; id: string }
  | { state: 'duplicate' }
  | { state: 'table_missing' }
  | { state: 'error'; message: string }

function isTableMissing(message: string, code?: string): boolean {
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /does not exist|Could not find the table/i.test(message)
  )
}

/** Gönderimden ÖNCE satırı ayırır; aynı (booking_id, kind) zaten varsa 'duplicate'. */
export async function claimWhatsAppMessage(input: {
  bookingId: string | null
  kind: string
  toPhone: string | null
  template: string
  language: string
}): Promise<WaClaimResult> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      booking_id: input.bookingId,
      kind: input.kind,
      to_phone: input.toPhone,
      template: input.template,
      language: input.language,
      status: 'pending',
    })
    .select('id')
    .single()
  if (!error && data?.id) return { state: 'claimed', id: String(data.id) }
  const code = (error as { code?: string } | null)?.code
  const message = error?.message ?? 'unknown'
  if (code === '23505' || /duplicate key/i.test(message)) return { state: 'duplicate' }
  if (isTableMissing(message, code)) return { state: 'table_missing' }
  return { state: 'error', message }
}

export async function finishWhatsAppMessage(
  id: string,
  result: { status: WaLogStatus; waMessageId?: string | null; error?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: result.status,
      wa_message_id: result.waMessageId ?? null,
      error: result.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) console.error('[whatsapp] log update failed', { id, message: error.message })
}

/** Webhook: Meta'nın teslim/okundu/başarısız bildirimi. */
export async function updateWhatsAppStatusByMessageId(
  waMessageId: string,
  status: WaLogStatus,
  error?: string | null
): Promise<void> {
  const { error: dbError } = await supabase
    .from(TABLE)
    .update({ status, ...(error ? { error } : {}), updated_at: new Date().toISOString() })
    .eq('wa_message_id', waMessageId)
  if (dbError) console.error('[whatsapp] webhook status update failed', { waMessageId, message: dbError.message })
}

export type WaLogRow = {
  id: string
  booking_id: string | null
  kind: string
  to_phone: string | null
  template: string | null
  language: string | null
  status: WaLogStatus
  wa_message_id: string | null
  error: string | null
  created_at: string | null
  updated_at: string | null
}

export async function listRecentWhatsAppMessages(limit = 50): Promise<{ rows: WaLogRow[]; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    const code = (error as { code?: string }).code
    if (isTableMissing(error.message, code)) return { rows: [], tableMissing: true }
    throw new Error(error.message)
  }
  return { rows: (data ?? []) as WaLogRow[], tableMissing: false }
}
