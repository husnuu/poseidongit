import Script from 'next/script'
import { COOKIE_CONSENT_MAX_AGE_MS, COOKIE_CONSENT_STORAGE_KEY } from '@/lib/cookieConsent'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || 'GTM-P8NPGM38'

/**
 * Google Consent Mode v2 — GTM yüklenmeden ÖNCE varsayılan "reddedildi".
 * Ziyaretçi daha önce çerez bandında seçim yaptıysa (localStorage) o tercih
 * hemen varsayılan olarak kullanılır; seçim yapınca bant `consent update`
 * gönderir (bkz. lib/cookieConsent.ts). Eskiden GTM onaysız tam yetkiyle
 * yükleniyor, bandın seçimi de GTM'e hiç ulaşmıyordu (gtag tanımlı değildi).
 */
const CONSENT_BOOTSTRAP = `window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
(function(){var c=null;try{c=JSON.parse(window.localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)})||'null');}catch(e){}
var ok=!!c&&typeof c.savedAt==='number'&&Date.now()-c.savedAt<${COOKIE_CONSENT_MAX_AGE_MS};
var a=ok&&c.analytics===true?'granted':'denied',ad=ok&&c.ads===true?'granted':'denied';
window.gtag('consent','default',{analytics_storage:a,ad_storage:ad,ad_user_data:ad,ad_personalization:ad,functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
window.gtag('set','ads_data_redaction',ad==='denied');})();`

/** Google Tag Manager — `<head>` içinde, mümkün olan en üstte. */
export default function GoogleTagManager() {
  if (!GTM_ID) return null

  return (
    <Script id="google-tag-manager" strategy="beforeInteractive">
      {`${CONSENT_BOOTSTRAP}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  )
}

/** GTM noscript yedek — `<body>` açılışının hemen ardından. */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID)}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
