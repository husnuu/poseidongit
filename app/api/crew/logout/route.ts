import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CREW_SESSION_COOKIE } from '@/lib/crew/crewSession'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const jar = await cookies()
  jar.set(CREW_SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return NextResponse.json({ ok: true })
}
