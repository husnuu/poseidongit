/**
 * Banka ödeme formunu doğrudan DOM'a ekleyip submit eder.
 * sessionStorage + router.push yaklaşımından daha güvenilir:
 * aynı anda sadece bir form oluşturulur ve hemen submit edilir.
 */
export function submitNestpayForm(action: string, fields: Record<string, string>): void {
  // Önceki varsa temizle
  const old = document.getElementById('__nestpay_form__')
  old?.remove()

  const form = document.createElement('form')
  form.id = '__nestpay_form__'
  form.method = 'post'
  form.action = action
  form.enctype = 'application/x-www-form-urlencoded'
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
