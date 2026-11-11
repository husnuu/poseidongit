# Partner sistemi kurulumu

Oteller, pansiyonlar ve acenteler için: kişiye özel mini sayfa (`/p/otel-adi`), QR kod, partner paneli (`/partner`) aylık komisyon takibi ve web sitesi olanlar için gömülebilir widget. Mini sayfa ve QR için web sitesi gerekmez.

## Canlıya alma (bir kez)

1. **Veritabanı:** `docs/supabase-partners.sql` dosyasını Supabase SQL Editor'da çalıştırın.
2. **Vercel ortam değişkeni:** `PARTNER_JWT_SECRET` ekleyin (en az 24 karakter, diğer secret'lardan farklı). Üretmek için: `openssl rand -base64 32`
3. Deploy edin.

SQL çalıştırılmadan deploy edilirse normal rezervasyonlar etkilenmez; yalnızca partner sayfaları çalışmaz.

## Yeni partner ekleme

Admin → **Partnerler** → **Yeni partner**: ad, oran, giriş e-postası, şifre (`Üret` düğmesi), logo. Oluşturunca giriş bilgileri bir kez gösterilir; partnere iletin. Bağlantı adı QR kodlara basıldığı için sonradan değiştirilemez.

Partner detay sayfasından QR indirilir, oda kartı yazdırılır, oran ve şifre değiştirilir, partner pasife alınır. Pasif partnerin sayfası kapanır, girişi engellenir, yeni rezervasyon ona yazılmaz; geçmiş kayıtlar durur. Silme yoktur.

## Kurallar

| Konu | Kural |
| --- | --- |
| Atıf | Misafir mini sayfaya geldikten sonra 7 gün içinde aynı tarayıcıdan yaptığı rezervasyon partnere yazılır (`PARTNER_ATTRIBUTION_DAYS`). Son gelinen partner geçerlidir. |
| Komisyon matrahı | Rezervasyonun toplam satış tutarı (ekstralar dahil), yalnızca alınan kapora değil. Kısmi iadede iade tutarı düşülür. |
| Kazanılma | Durum `paid`/`confirmed` ve tur tarihi geçmiş olmalı. İptal, başarısız ödeme ve tam iade komisyon kazandırmaz; iade talebi sonuçlanana kadar askıda kalır. |
| Oran | Rezervasyon anındaki oran kayda yazılır; oran değişikliği geçmişi etkilemez. |
| Dönem | Turun gerçekleştiği ay. Admin ayı "Ödendi" işaretler; tutar o anki hesaptan yazılır. Ödemeden sonra iptal olursa fark tabloda görünür. |
| Gizlilik | Partner misafirin e-posta ve telefonunu görmez, adı "Ayşe K." şeklinde görünür. |

## Resepsiyon satışı

Partner paneli → **Yeni rezervasyon**. Fiyat sunucuda hesaplanır, kapasite kontrol edilir.

- Online turlar: ödeme linki misafire e-posta ile gider, panelde WhatsApp ile gönderme düğmesi de çıkar.
- Nakit turlar: rezervasyon oluşur, ödeme teknede alınır. Admin `paid` işaretleyince komisyon sayılır.
- Özel turlar: talep admin listesine düşer. Admin onaylayıp `paid` işaretleyince komisyon sayılır.
- First Class: loca seçimi gerektirdiği için panelde yoktur; misafir mini sayfadan alır.

Admin rezervasyon listesinde bu kayıtlar `Acente` kaynağıyla görünür; admin notunda partner adı yazar.

## Web sitesi widget'ı

Web sitesi olan partnerler turları kendi sitelerinde gösterebilir. Kod, partner panelinde **Web sitesi widget'ı** sekmesinden ve admin panelinde **Widget** sayfasından alınır:

```html
<script src="https://cesmetekneturu.net/widget.js" data-partner="otel-adi" data-lang="tr" data-mode="list" async></script>
```

| Ayar | Değerler |
| --- | --- |
| `data-mode` | `list` (tur listesi), `tour` (tek tur), `button` (tıklanınca pencerede açılan buton) |
| `data-content` | `all` (turlar + tekne kiralama, sekmeli), `tours`, `yachts` |
| `data-lang` | `tr`, `en`, `de`, `ru` |
| `data-tour` | Tek tur modunda turun kimliği |
| `data-tours` | Listede yalnızca bu turlar (virgülle ayrılmış kimlikler); boşsa hepsi |
| `data-color` | Ana renk, örn. `#0f766e` |
| `data-prices` | `0` → fiyatlar gizlenir |
| `data-label` | Buton modunda buton yazısı |

- Tur rezervasyon formu widget içinde doldurulur. Ödeme adımında misafirin bulunduğu sayfa sitemize yönlenir: online ödemeli turlarda ödeme sayfası (`/odeme/...`), nakit turlarda onay sayfası. Banka 3D Secure ekranı iframe içinde açılmaz.
- **Tekne kiralama:** Tekneler widget'ta listelenir; tıklanınca misafir sitemizdeki tekne sayfasına gider (`?pref=otel-adi&k=widget`). Partner tarayıcıda 7 gün saklanır: teklif talebi admin **Motoryat Mesajları** listesinde partner adıyla görünür (komisyon yok, fiyat teklifle belirlenir); kapora ödenirse kapora tutarı partnerin rezervasyonlarına komisyonlu olarak yazılır.
- Widget'tan gelen tur rezervasyonları partnere `widget` kanalıyla yazılır ve raporlarda **Web sitesi widget** olarak görünür.
- **Alan adı kısıtlaması (isteğe bağlı):** Admin → Widget sayfasında partnerin alan adları girilirse (örn. `otel.com`) widget yalnızca o sitede ve alt alan adlarında açılır. Boşsa her sitede açılır. Sütun `docs/supabase-partners.sql` içindedir (`widget_domains`; yat talepleri için `yacht_inquiries.partner_*`).
- Widget sayfaları (`/embed/...`) noindex'tir ve robots.txt'de kapalıdır. Sitenin geri kalanı iframe içinde açılamaz (`X-Frame-Options: SAMEORIGIN`).

## Kapsam dışı

Yat kiralama/kapora rezervasyonları partnere yazılmaz.
