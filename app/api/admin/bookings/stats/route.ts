import { NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'

const COLLECTION = 'bookings'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']

import { getAuthToken, getAdminEmail, requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const today = new Date().toISOString().slice(0, 10)
    const db = getFirestore()

    const [totalSnap, todaySnap, manualCountSnap, allForRevenueSnap, todayBookingsSnap] = await Promise.all([
      db.collection(COLLECTION).count().get(),
      db.collection(COLLECTION).where('date', '==', today).count().get(),
      db.collection(COLLECTION).where('source', '==', 'manual').count().get(),
      db.collection(COLLECTION).where('status', 'in', ['pending', 'paid']).limit(2000).get(),
      db.collection(COLLECTION)
        .where('date', '==', today)
        .where('status', 'in', ACTIVE_STATUSES)
        .get(),
    ])

    const totalBookings = totalSnap.data().count ?? 0
    const todayBookings = todaySnap.data().count ?? 0
    const manualBookings = manualCountSnap.data().count ?? 0
    const onlineBookings = Math.max(0, totalBookings - manualBookings)

    let totalRevenue = 0
    allForRevenueSnap.docs.forEach((doc) => {
      const d = doc.data()
      if (d.status === 'cancelled') return
      totalRevenue += Number(d.totalPrice ?? 0)
    })

    let todayOccupancy = 0
    todayBookingsSnap.docs.forEach((doc) => {
      const d = doc.data()
      const c = (d.counts ?? {}) as { adult?: number; child?: number; infant?: number }
      todayOccupancy += (c.adult ?? 0) + (c.child ?? 0) + (c.infant ?? 0)
    })

    return NextResponse.json({
      totalBookings,
      todayBookings,
      totalRevenue,
      todayOccupancy,
      currency: 'TRY',
      onlineBookings,
      manualBookings,
    })
  } catch (e) {
    console.error('GET /api/admin/bookings/stats error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
