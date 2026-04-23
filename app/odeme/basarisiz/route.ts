import type { NextRequest } from 'next/server'
import {
  paytenBrowserReturnFailGET,
  paytenBrowserReturnFailPOST,
} from '@/lib/payten/paytenBrowserReturnRedirects'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return paytenBrowserReturnFailGET(request)
}

export async function POST(request: NextRequest) {
  return paytenBrowserReturnFailPOST(request, 'odeme/basarisiz')
}
