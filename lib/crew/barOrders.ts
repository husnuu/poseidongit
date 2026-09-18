import { supabase } from '@/lib/supabase'

export interface BarOrderItem {
  title: string
  price: number
  qty: number
}

export interface BarOrder {
  id: string
  tourId: string
  tourTitle: string
  tripDate: string
  tripTime: string | null
  bookingId: string | null
  guestLabel: string
  items: BarOrderItem[]
  totalAmount: number
  currency: string
  status: 'new' | 'preparing' | 'served'
  paymentStatus: 'unpaid' | 'paid'
  paymentMethod: 'cash' | 'card' | null
  createdAt: string
  servedAt: string | null
  paidAt: string | null
}

type BarOrderRow = {
  id: string
  tour_id: string
  tour_title: string
  trip_date: string
  trip_time: string | null
  booking_id: string | null
  guest_label: string
  items: unknown
  total_amount: number | string
  currency: string
  status: string
  payment_status: string
  payment_method: string | null
  created_at: string
  served_at: string | null
  paid_at: string | null
}

function normalizeItems(raw: unknown): BarOrderItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => {
      if (!x || typeof x !== 'object') return null
      const o = x as Record<string, unknown>
      const title = typeof o.title === 'string' ? o.title : ''
      const price = Number(o.price)
      const qty = Number(o.qty)
      if (!title || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return null
      return { title, price, qty }
    })
    .filter((x): x is BarOrderItem => x != null)
}

function mapRow(row: BarOrderRow): BarOrder {
  return {
    id: row.id,
    tourId: row.tour_id,
    tourTitle: row.tour_title,
    tripDate: row.trip_date,
    tripTime: row.trip_time,
    bookingId: row.booking_id,
    guestLabel: row.guest_label,
    items: normalizeItems(row.items),
    totalAmount: Number(row.total_amount) || 0,
    currency: row.currency || 'TRY',
    status: row.status === 'preparing' || row.status === 'served' ? row.status : 'new',
    paymentStatus: row.payment_status === 'paid' ? 'paid' : 'unpaid',
    paymentMethod: row.payment_method === 'cash' || row.payment_method === 'card' ? row.payment_method : null,
    createdAt: row.created_at,
    servedAt: row.served_at,
    paidAt: row.paid_at,
  }
}

export async function getBarOrdersForTrip(
  tourId: string,
  tripDate: string,
  tripTime: string | null
): Promise<BarOrder[]> {
  let query = supabase
    .from('bar_orders')
    .select('*')
    .eq('tour_id', tourId)
    .eq('trip_date', tripDate)
    .order('created_at', { ascending: true })
  query = tripTime ? query.eq('trip_time', tripTime) : query.is('trip_time', null)

  const { data, error } = await query
  if (error || !data) return []
  return (data as BarOrderRow[]).map(mapRow)
}

/** Belirli bir güne ait tüm bar siparişleri (tüm seferler dahil) — gün gün gezinme için. */
export async function getBarOrdersForDate(dateStr: string): Promise<BarOrder[]> {
  const { data, error } = await supabase
    .from('bar_orders')
    .select('*')
    .eq('trip_date', dateStr)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as BarOrderRow[]).map(mapRow)
}

export async function getPendingCountsForTrips(
  trips: { tourId: string; date: string; time: string | null }[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (trips.length === 0) return result
  const dates = Array.from(new Set(trips.map((t) => t.date)))
  const { data, error } = await supabase
    .from('bar_orders')
    .select('tour_id, trip_date, trip_time, payment_status')
    .in('trip_date', dates)
    .eq('payment_status', 'unpaid')
  if (error || !data) return result
  for (const row of data as Pick<BarOrderRow, 'tour_id' | 'trip_date' | 'trip_time' | 'payment_status'>[]) {
    const key = `${row.tour_id}__${row.trip_date}__${row.trip_time ?? ''}`
    result.set(key, (result.get(key) ?? 0) + 1)
  }
  return result
}

export async function createWalkInOrder(input: {
  tourId: string
  tourTitle: string
  tripDate: string
  tripTime: string | null
  guestLabel: string
  items: BarOrderItem[]
}): Promise<BarOrder | null> {
  const totalAmount = input.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const { data, error } = await supabase
    .from('bar_orders')
    .insert({
      tour_id: input.tourId,
      tour_title: input.tourTitle,
      trip_date: input.tripDate,
      trip_time: input.tripTime,
      guest_label: input.guestLabel || 'Misafir',
      items: input.items,
      total_amount: totalAmount,
      currency: 'TRY',
      status: 'new',
      payment_status: 'unpaid',
    })
    .select('*')
    .single()
  if (error || !data) return null
  return mapRow(data as BarOrderRow)
}

function mergeOrderItems(existing: BarOrderItem[], incoming: BarOrderItem[]): BarOrderItem[] {
  const map = new Map<string, BarOrderItem>()
  for (const item of [...existing, ...incoming]) {
    const key = `${item.title}__${item.price}`
    const current = map.get(key)
    if (current) current.qty += item.qty
    else map.set(key, { ...item })
  }
  return Array.from(map.values())
}

/**
 * Aynı isme (guest_label) ait, aynı sefer + aynı gün için henüz ödenmemiş açık bir
 * sipariş varsa yeni ürünler ona eklenir (tek "hesap"/tab); yoksa yeni sipariş açılır.
 */
export async function createOrAppendWalkInOrder(input: {
  tourId: string
  tourTitle: string
  tripDate: string
  tripTime: string | null
  guestLabel: string
  items: BarOrderItem[]
}): Promise<BarOrder | null> {
  const guestLabel = input.guestLabel.trim() || 'Misafir'

  let query = supabase
    .from('bar_orders')
    .select('*')
    .eq('tour_id', input.tourId)
    .eq('trip_date', input.tripDate)
    .eq('guest_label', guestLabel)
    .eq('payment_status', 'unpaid')
    .order('created_at', { ascending: false })
    .limit(1)
  query = input.tripTime ? query.eq('trip_time', input.tripTime) : query.is('trip_time', null)
  const { data: existingRows } = await query
  const existing = (existingRows as BarOrderRow[] | null)?.[0]

  if (existing) {
    const mergedItems = mergeOrderItems(normalizeItems(existing.items), input.items)
    const newTotal = mergedItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    const { data, error } = await supabase
      .from('bar_orders')
      .update({
        items: mergedItems,
        total_amount: newTotal,
        // Servis edilmiş bir hesaba yeni ürün eklenince tekrar "yeni" duruma döner.
        ...(existing.status === 'served' && { status: 'new' }),
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error || !data) return null
    return mapRow(data as BarOrderRow)
  }

  return createWalkInOrder({ ...input, guestLabel })
}

export async function updateOrderStatus(
  orderId: string,
  status: 'preparing' | 'served'
): Promise<BarOrder | null> {
  const updates: Record<string, unknown> = { status }
  if (status === 'served') updates.served_at = new Date().toISOString()
  const { data, error } = await supabase.from('bar_orders').update(updates).eq('id', orderId).select('*').single()
  if (error || !data) return null
  return mapRow(data as BarOrderRow)
}

export async function markOrderPaid(orderId: string, method: 'cash' | 'card'): Promise<BarOrder | null> {
  const { data, error } = await supabase
    .from('bar_orders')
    .update({ payment_status: 'paid', payment_method: method, paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .single()
  if (error || !data) return null
  return mapRow(data as BarOrderRow)
}
