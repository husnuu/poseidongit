import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)),
      MAX_LIMIT
    )
    const { data: rows, error } = await supabase
      .from('yacht_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      throw new Error(`Supabase yacht inquiries list failed: ${error.message}`)
    }

    const inquiries = (rows ?? []).map((d: Record<string, unknown>) => {
      const rowId = String(d.id ?? '')
      return {
        id: rowId,
        yachtSlug: typeof d.yacht_slug === 'string' ? d.yacht_slug : (typeof d.yachtSlug === 'string' ? d.yachtSlug : ''),
        yachtName: typeof d.yacht_name === 'string' ? d.yacht_name : (typeof d.yachtName === 'string' ? d.yachtName : ''),
        location: typeof d.location === 'string' ? d.location : null,
        date: typeof d.date === 'string' ? d.date : null,
        rentalType: (d.rental_type === 'overnight' || d.rentalType === 'overnight') ? 'overnight' : 'daily',
        checkIn: typeof d.check_in === 'string' ? d.check_in : (typeof d.checkIn === 'string' ? d.checkIn : null),
        checkOut: typeof d.check_out === 'string' ? d.check_out : (typeof d.checkOut === 'string' ? d.checkOut : null),
        nights: typeof d.nights === 'number' ? d.nights : null,
        guestCount: typeof d.guest_count === 'number' ? d.guest_count : (typeof d.guestCount === 'number' ? d.guestCount : null),
        firstName: typeof d.first_name === 'string' ? d.first_name : (typeof d.firstName === 'string' ? d.firstName : ''),
        lastName: typeof d.last_name === 'string' ? d.last_name : (typeof d.lastName === 'string' ? d.lastName : ''),
        email: typeof d.email === 'string' ? d.email : '',
        phone: typeof d.phone === 'string' ? d.phone : '',
        message: typeof d.message === 'string' ? d.message : '',
        priceFrom: typeof d.price_from === 'number' ? d.price_from : (typeof d.priceFrom === 'number' ? d.priceFrom : null),
        currency: typeof d.currency === 'string' ? d.currency : null,
        status: typeof d.status === 'string' ? d.status : 'new',
        source: typeof d.source === 'string' ? d.source : 'web',
        adminNote: typeof d.admin_note === 'string' ? d.admin_note : null,
        isRead: Boolean(d.is_read),
        contactedAt: toIso(d.contacted_at),
        readAt: toIso(d.read_at),
        createdAt: toIso(d.created_at),
        updatedAt: toIso(d.updated_at),
      }
    })

    const nextStartAfter = inquiries.length === limit && inquiries.length > 0 ? inquiries[inquiries.length - 1].id : null

    return NextResponse.json({ inquiries, nextStartAfter, count: inquiries.length })
  } catch (e) {
    console.error('GET /api/admin/yacht-inquiries error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    const inquiryId = typeof body.inquiryId === 'string' ? body.inquiryId.trim() : ''
    const status = typeof body.status === 'string' ? body.status.trim() : null
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : undefined
    const markRead = typeof body.markRead === 'boolean' ? body.markRead : undefined

    if (!inquiryId) {
      return NextResponse.json({ error: 'inquiryId gerekli.' }, { status: 400 })
    }

    const { data: currentInquiry, error: currentError } = await supabase
      .from('yacht_inquiries')
      .select('id')
      .eq('id', inquiryId)
      .single()
    if (currentError || !currentInquiry) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updates.status = status
      if (status === 'contacted') {
        updates.contacted_at = new Date().toISOString()
      }
    }
    if (adminNote !== undefined) {
      updates.admin_note = adminNote === '' ? null : adminNote
    }
    if (markRead !== undefined) {
      updates.is_read = markRead
      updates.read_at = markRead ? new Date().toISOString() : null
    }

    const { error: updateError } = await supabase
      .from('yacht_inquiries')
      .update(updates)
      .eq('id', inquiryId)
    if (updateError) {
      throw new Error(`Supabase yacht inquiry update failed: ${updateError.message}`)
    }

    return NextResponse.json({ ok: true, inquiryId })
  } catch (e) {
    console.error('PATCH /api/admin/yacht-inquiries error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
