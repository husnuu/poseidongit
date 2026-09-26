import localFont from 'next/font/local'

/**
 * DIN Next LT Pro — rezervasyon sihirbazı/bilet arayüzü için (referans site ile
 * görsel eşleşme amacıyla). Sadece Regular (400) ağırlığı yüklendi; kullanıcı
 * lisanslı Bold/Black dosyalarını eklerse aşağıdaki `src` dizisine ekleyip
 * ilgili `weight` değerleriyle tanımlamak yeterli.
 *
 * Bu font --font-din-next CSS değişkenini tanımlar (app/layout.tsx üzerinden,
 * html elementine uygulanır); gerçek kullanım booking.module.css içinde
 * SADECE rezervasyon sihirbazı kapsamında (.wizardModalPane / .pageLayout)
 * --font-family-title değişkenini bununla override ederek yapılır — sitenin
 * geri kalanı Inter ile devam eder.
 */
export const dinNextLtPro = localFont({
  src: [
    {
      path: './DINNextLTPro-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-din-next',
  display: 'swap',
})
