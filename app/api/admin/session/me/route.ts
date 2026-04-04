import { NextResponse } from 'next/server'
import { verifyAdminSessionFromRequest } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await verifyAdminSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    user: { id: session.sub, email: session.email },
  })
}
