/**
 * "Tek fiyat" turları: Sanity'de `singlePrice` açıksa müşteri bilet sınıfı seçmez.
 * Bilet Sınıfları listesindeki İLK sınıfın fiyatları ve kapasitesi kullanılır;
 * diğer sınıflar sitede, rezervasyonda ve fiyat hesabında yok sayılır.
 * Veri tek noktada daraltıldığı için fiyat gösterimleri ("kişi başı …"),
 * kapasite ve sunucu tarafı tutar hesabı ayrıca değişiklik gerektirmez.
 */

type WithTicketClasses = {
  singlePrice?: boolean | null
  ticketClasses?: ({ key?: string | null; label?: string | null } | null)[] | null
}

/** Tek fiyat açıksa ticketClasses'ı yalnızca ilk sınıfa indirir; değilse turu aynen döndürür. */
export function applySinglePriceMode<T extends WithTicketClasses>(tour: T): T
export function applySinglePriceMode<T extends WithTicketClasses>(tour: T | null): T | null
export function applySinglePriceMode<T extends WithTicketClasses>(tour: T | null): T | null {
  if (!tour?.singlePrice || !tour.ticketClasses?.length) return tour
  return { ...tour, ticketClasses: tour.ticketClasses.slice(0, 1) }
}

/** Tek fiyat turunda kullanılacak sınıf (yoksa null). */
export function singlePriceClass(tour: WithTicketClasses | null | undefined): { key: string; label: string } | null {
  if (!tour?.singlePrice) return null
  const first = tour.ticketClasses?.[0]
  return first?.key ? { key: first.key, label: first.label ?? first.key } : null
}
