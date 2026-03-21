# Rezervasyonlar – Firebase Firestore (Server-Only)

Rezervasyonlar **sadece server-side** (firebase-admin) ile Firestore’a yazılır/okunur. Client’tan Firestore’a direkt erişim yok; güvenlik için Firestore **Locked mode** kalsın.

## Ortam değişkenleri

`.env.local` içinde (veya deploy ortamında) tanımlayın:

```bash
# Firebase Admin – service account JSON'dan alın
FIREBASE_PROJECT_ID=poseidonbooking
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@poseidonbooking.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin listesi için (Bearer token)
ADMIN_TOKEN=güçlü-rastgele-string
```

`FIREBASE_PRIVATE_KEY`: JSON’daki `private_key` alanını aynen kopyalayın. Satır sonları `\n` ise kod içinde otomatik düzeltiliyor; gerçek satır sonu da kullanılabilir.

## Koleksiyonlar

- **bookings**: Her belge bir rezervasyon (id, createdAt, status, tourId, tourTitle, date, counts, classId, className, unitPrice, totalPrice, currency, customer, source, **accessToken**).
- **availability**: Şimdilik placeholder; ileride tourId + date bazlı kapasite tutulabilir.

## Bilet erişim token’ı (accessToken)

**Sizin token üretmeniz gerekmez.** Token tamamen sunucuda otomatik üretilir:

1. **Web rezervasyonu** (POST /api/bookings): Rezervasyon oluşturulurken `generateBookingAccessToken()` çağrılır, token Firestore’a yazılır ve yanıtta `accessToken` olarak döner.
2. **Manuel rezervasyon** (POST /api/admin/bookings/manual): Aynı şekilde token üretilir ve kaydedilir.
3. **Eski rezervasyonlar**: Admin panelden “Ödendi” yapıldığında dokümanda token yoksa o an üretilip Firestore’a yazılır; e-postadaki bilet linki token’lı gider.

Bilet PDF ve bilet sayfası (`/api/voucher`, `/bilet/[bookingId]`) sadece geçerli token ile açılır. Linkler e-postada ve “Rezervasyonumu Yönet” sayfasında token ile üretilir.

## API

- **POST /api/bookings**: Rezervasyon oluşturur. Body: tourId, tourTitle, date, counts, classId, className, customer. Server totalPrice hesaplar (şimdilik Sanity’den class fiyatı × kişi sayısı). Response: `bookingId`, `accessToken`, `summary`.
- **GET /api/admin/bookings**: Sadece admin. Header: `Authorization: Bearer <ADMIN_TOKEN>`. Query: `limit`, `startAfter`, `status` (pending|paid|cancelled). Response: `bookings`, `nextStartAfter`, `count`.

## Admin panel

- **/admin/bookings**: Sayfa açılınca admin token sorar; token gönderilerek `/api/admin/bookings` çağrılır. Tablo: Tarih, Tur, Ad Soyad, Telefon, Kişi, Sınıf, Toplam, Durum, Oluşturulma. Durum filtresi ve sonraki sayfa butonu var.

## Rezervasyon wizard

4. adımda “Ödemeyi tamamla” tıklanınca `POST /api/bookings` atılır. Başarıda rezervasyon numarası ve özet gösterilir; hata durumunda mesaj gösterilir.
