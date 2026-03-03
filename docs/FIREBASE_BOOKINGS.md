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

- **bookings**: Her belge bir rezervasyon (id, createdAt, status, tourId, tourTitle, date, counts, classId, className, unitPrice, totalPrice, currency, customer, source).
- **availability**: Şimdilik placeholder; ileride tourId + date bazlı kapasite tutulabilir.

## API

- **POST /api/bookings**: Rezervasyon oluşturur. Body: tourId, tourTitle, date, counts, classId, className, customer. Server totalPrice hesaplar (şimdilik Sanity’den class fiyatı × kişi sayısı). Response: `bookingId`, `summary`.
- **GET /api/admin/bookings**: Sadece admin. Header: `Authorization: Bearer <ADMIN_TOKEN>`. Query: `limit`, `startAfter`, `status` (pending|paid|cancelled). Response: `bookings`, `nextStartAfter`, `count`.

## Admin panel

- **/admin/bookings**: Sayfa açılınca admin token sorar; token gönderilerek `/api/admin/bookings` çağrılır. Tablo: Tarih, Tur, Ad Soyad, Telefon, Kişi, Sınıf, Toplam, Durum, Oluşturulma. Durum filtresi ve sonraki sayfa butonu var.

## Rezervasyon wizard

4. adımda “Ödemeyi tamamla” tıklanınca `POST /api/bookings` atılır. Başarıda rezervasyon numarası ve özet gösterilir; hata durumunda mesaj gösterilir.
