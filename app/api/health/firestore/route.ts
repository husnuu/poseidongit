import { NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'

/**
 * GET /api/health/firestore
 * Sadece development'ta çalışır. Firestore bağlantısını ve bookings koleksiyonunu test eder.
 * Tarayıcıda veya curl ile çağır: http://localhost:3002/api/health/firestore
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Sadece development ortamında kullanılır' }, { status: 404 })
  }
  try {
    const db = getFirestore()
    const snapshot = await db.collection('bookings').limit(5).get()
    return NextResponse.json({
      ok: true,
      message: 'Firestore bağlantısı başarılı',
      collection: 'bookings',
      totalInSample: snapshot.size,
      empty: snapshot.empty,
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[health/firestore]', err.message)
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        hint:
          'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY .env dosyasında doğru mu? Service account JSON\'dan kopyaladınız mı?',
      },
      { status: 500 }
    )
  }
}
