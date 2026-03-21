# Rezervasyon Yönetimi – Müşteri Kimliği ve Güvenlik Özeti

## 1. Müşteri rezervasyona nasıl bağlanıyor?

- **Kullanılan tanımlayıcılar:** `bookingId` + `email`
- **Token yok.** Rezervasyon yönetimi için ayrı bir token veya “booking access key” üretilmiyor.
- **Bağlantı:** E-postadaki link sadece `bookingId` içeriyor. Sayfada müşteri e-postasını giriyor; API, Firestore’daki rezervasyondaki `customer.email` ile **eşleşme** yaparak erişim veriyor veya reddediyor.

---

## 2. Token tabanlı sistem var mı?

- **Hayır.** Şu anki yapı **e-posta eşleştirmeli**: linkte sadece `bookingId`, kimlik doğrulama “Rezervasyonumu Yönet” sayfasında girilen e-posta ile yapılıyor.

---

## 3. Token / erişim anahtarı nerede üretiliyor?

- Token veya erişim anahtarı **üretilmiyor**. Sadece Firestore doküman ID’si (`ref.id`) “bookingId” olarak kullanılıyor (web ve manuel rezervasyonlarda).

---

## 4. Nerede saklanıyor?

- **Firestore** `bookings` koleksiyonunda her rezervasyon bir doküman:
  - **Doküman ID** = `bookingId` (otomatik üretilen ID).
  - Dokümanda `customer.email`, `customer.firstName`, `customer.lastName`, `customer.phone` vb. alanlar var.
  - Token veya ayrı “access key” alanı **yok**.

---

## 5. “Rezervasyonumu Yönet” linki nasıl doğrulanıyor?

1. **E-postadaki link:**  
   `{site}/rezervasyon/yonet?bookingId={bookingId}`  
   Sadece `bookingId` var; kimlik bilgisi yok.

2. **Sayfa:**  
   Müşteri “Rezervasyon No”yu (readonly, URL’den gelen `bookingId`) görüyor ve **e-posta** giriyor.

3. **Doğrulama:**  
   İstek `GET /api/booking?bookingId=...&email=...` ile gidiyor. API:
   - Firestore’dan `bookings/{bookingId}` dokümanını okuyor.
   - `data.customer.email` ile istekteki `email`’i **case-insensitive** karşılaştırıyor.
   - Eşleşirse rezervasyon detayını döndürüyor; eşleşmezse **403** (“Bu e-posta adresi bu rezervasyona ait değil”).

Yani link tek başına erişim vermiyor; **e-posta bilgisi** girişi zorunlu ve her işlemde tekrar kontrol ediliyor.

---

## 6. Mevcut güvenlik yeterli mi? İyileştirme önerileri

**Şu anki durum:**

- **Artılar:**
  - Rezervasyon görüntüleme / iptal / tarih değiştirme hep **bookingId + email** ile yapılıyor; email Firestore’daki kayıtla eşleşmezse 403.
  - `/api/booking` (GET), `/api/booking/cancel` (POST), `/api/booking/change-date` (POST) hepsi bu eşleştirmeyi kullanıyor.

- **Eksikler / riskler (güncel):**
  1. **Rate limiting:** API’lerde istek sayısı sınırı önerilir; brute-force denemeleri (farklı email/bookingId) teorik risk. Bkz. `docs/RATE_LIMITING_SUGGESTIONS.md`.
  2. **Oturum yok:** Müşteri her seferinde e-posta girmek zorunda; tarayıcı kapatılınca “yönetim oturumu” kalmıyor (tasarım tercihi).

**Yapılan iyileştirmeler:**

- **Voucher / bilet:** `/api/voucher` ve `/bilet/[bookingId]` artık **accessToken** gerektiriyor; token yoksa veya geçersizse 403. Her yeni rezervasyonda Firestore’a `accessToken` yazılıyor; e-posta ve yönetim sayfası linkleri token içeriyor.
- **Rate limiting:** Öneriler `docs/RATE_LIMITING_SUGGESTIONS.md` içinde (IP bazlı limitler).

---

## Mevcut mimari özeti (akış)

```
[Rezervasyon oluşturma]
  - Web: POST /api/bookings → Firestore’a doc eklenir → doc.id = bookingId döner.
  - Manuel: POST /api/admin/bookings/manual → aynı şekilde bookingId = ref.id.

[E-posta]
  - Ödeme onayı / manuel sonrası e-posta gider.
  - Link: manageBookingUrl(bookingId) = /rezervasyon/yonet?bookingId={id}
  - Token veya imza yok; sadece bookingId.

[Rezervasyonumu Yönet sayfası]
  - URL: /rezervasyon/yonet?bookingId=...
  - Müşteri e-posta girer → GET /api/booking?bookingId=...&email=...
  - API: Firestore’dan doc(bookingId) alır; customer.email === email (küçük harf) kontrolü.
  - Eşleşirse booking detayı döner; sayfa detayı gösterir (iptal, tarih değiştir, bilet linkleri).

[İptal]
  - POST /api/booking/cancel { bookingId, email } → aynı email eşleşmesi + tura 24 saatten fazla var mı.

[Tarih değiştir]
  - POST /api/booking/change-date { bookingId, email, newDate } → aynı email eşleşmesi.

[Bilet / PDF]
  - /bilet/[bookingId]?token=... ve GET /api/voucher?bookingId=...&token=... → **token zorunlu**; token yoksa veya geçersizse 403.
  - Her rezervasyonda Firestore’a `accessToken` (güvenli rastgele) kaydedilir; e-postadaki ve yönetim sayfasındaki linkler bu token’ı içerir.
```

**Özet:** Müşteri, rezervasyona **bookingId + e-posta** ile bağlanıyor (yönetim). Bilet ve voucher erişimi **bookingId + accessToken** ile korunuyor; token e-postadaki ve “Rezervasyonumu Yönet” sayfasındaki linklerde yer alır. Rate limiting önerileri için `docs/RATE_LIMITING_SUGGESTIONS.md` dosyasına bakın.
