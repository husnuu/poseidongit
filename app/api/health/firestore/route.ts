import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/health/firestore
 * Sadece development'ta çalışır. Supabase bağlantısını ve bookings tablosunu test eder.
 * Tarayıcıda veya curl ile çağır: http://localhost:3002/api/health/firestore
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Sadece development ortamında kullanılır' }, { status: 404 })
  }
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(5)
    if (error) throw new Error(error.message)
    return NextResponse.json({
      ok: true,
      message: 'Supabase bağlantısı başarılı',
      table: 'bookings',
      totalInSample: (data ?? []).length,
      empty: (data ?? []).length === 0,
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[health/firestore]', err.message)
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        hint:
          'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ve SUPABASE_ANON_KEY değişkenlerini kontrol edin.',
      },
      { status: 500 }
    )
  }
}
