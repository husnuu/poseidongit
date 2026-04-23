import {
  renderPaytenBrowserReturnGetPage,
  renderPaytenBrowserReturnInvalidForm,
  renderPaytenBrowserReturnPostPage,
} from '@/lib/payten/paytenBrowserReturnHtml'
import { parsePaytenPostToRecord } from '@/lib/payten/parsePaytenPostBody'
import { emitPaytenReturnDiagnostics } from '@/lib/services/paymentService'

export const runtime = 'nodejs'

export async function GET() {
  const html = renderPaytenBrowserReturnGetPage('success')
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function POST(request: Request) {
  console.error('[payten][odeme-basarili] okUrl tarayıcı dönüşü — banka formu bu adrese POST ediyor.')
  const record = await parsePaytenPostToRecord(request)
  if (record) {
    emitPaytenReturnDiagnostics('odeme-basarili', record)
  }
  if (!record) {
    console.error('[payten][odeme-basarili] POST gövdesi okunamadı (Content-Type / boş gövde).')
    return new Response(renderPaytenBrowserReturnInvalidForm('success'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    })
  }

  const html = renderPaytenBrowserReturnPostPage('success', record)
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}
