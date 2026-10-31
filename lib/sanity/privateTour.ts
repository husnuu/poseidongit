/**
 * Özel tur: Sanity'de `privateTour` açıksa tur kişi başı değil, tek bir GRUP
 * FİYATIyla (`privateTourPrice`) satılır ve online ödemeye gidilmez — müşteri
 * yalnızca rezervasyon talebi gönderir. Talep, admin panelindeki Rezervasyonlar
 * listesine "Beklemede" durumunda, sınıfı "Özel tur (grup)" olarak düşer;
 * kapasiteyi düşmez (yalnızca paid/confirmed sayılır), bilet/ödeme oluşmaz.
 */

/** Rezervasyon kaydında sınıf alanına yazılan sabitler — listede talebi ayırt etmek için. */
export const PRIVATE_TOUR_CLASS_ID = 'private'
export const PRIVATE_TOUR_CLASS_NAME = 'Özel tur (grup)'

type PrivateTourFields = { privateTour?: boolean | null; privateTourPrice?: number | null }

/** Tur özel tur olarak satılıyorsa grup fiyatı (₺); değilse null. Fiyat girilmemiş özel tur da null. */
export function privateTourGroupPrice(tour: PrivateTourFields | null | undefined): number | null {
  if (!tour?.privateTour) return null
  const price = Number(tour.privateTourPrice)
  return Number.isFinite(price) && price > 0 ? price : null
}

export function isPrivateTour(tour: PrivateTourFields | null | undefined): boolean {
  return privateTourGroupPrice(tour) !== null
}
