import { NextResponse } from 'next/server'
import { adminLoginPanelTokenConfigured } from '@/lib/adminLoginPanelToken'

export const dynamic = 'force-dynamic'

/** İstemcinin panel anahtarı alanını göstermesi için (gizli değer sızmaz). */
export async function GET() {
  return NextResponse.json({ requiresPanelToken: adminLoginPanelTokenConfigured() })
}
