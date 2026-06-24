export type TourDepositConfig = {
  enabled?: boolean
  type?: string
  value?: number
}

/** Sanity tur kapora ayarına göre ödenen ve kalan tutarı hesaplar. */
export function computeDepositAmounts(
  totalPrice: number,
  deposit?: TourDepositConfig | null
): { paidNow: number; remainingAmount: number } {
  if (!deposit?.enabled || deposit.value == null || totalPrice <= 0) {
    return { paidNow: totalPrice, remainingAmount: 0 }
  }
  const rawPaid =
    deposit.type === 'fixed'
      ? Math.round(deposit.value)
      : Math.round((totalPrice * deposit.value) / 100)
  const paidNow = Math.min(Math.max(0, rawPaid), totalPrice)
  return { paidNow, remainingAmount: Math.max(0, totalPrice - paidNow) }
}
