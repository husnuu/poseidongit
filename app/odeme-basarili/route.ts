import type { NextRequest } from 'next/server'
import {
  paytenBrowserReturnOkGET,
  paytenBrowserReturnOkPOST,
} from '@/lib/payten/paytenBrowserReturnRedirects'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return paytenBrowserReturnOkGET(request)
}

export async function POST(request: NextRequest) {
  return paytenBrowserReturnOkPOST(request, 'odeme-basarili')
}
