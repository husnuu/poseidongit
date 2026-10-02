/**
 * Sanity'deki `siteFooter.topRated.ratingValue` alanı şu an "5" olarak
 * girilmiş (muhtemelen "5 üzerinden" bir marka ifadesi), ama site sahibinin
 * talebiyle sitede gerçek güncel Google puanı olan 4.7 gösteriliyor
 * (bkz. Footer.tsx). Bu sabit, aynı geçici düzeltmeyi "TOP RATED" rozetinin
 * göründüğü her yerde (Footer, Hakkımızda güven rozeti şeridi, vb.) tek bir
 * yerden yönetmek için var — Sanity'deki alan güncellenince burası da
 * güncellenip geri CMS değerine dönülebilir.
 */
export const DISPLAYED_GOOGLE_RATING = 4.7
