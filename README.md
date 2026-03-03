# Poseidon Booking

Next.js (App Router) + Sanity + Firebase Firestore ile tur rezervasyon uygulaması.

## Firestore index (Availability API)

`GET /api/availability?tourId=...&date=YYYY-MM-DD` endpoint’i Firestore’da şu sorguyu kullanır:

- `collection("bookings")`
- `where("tourId", "==", tourId)`
- `where("date", "==", date)`
- `where("status", "in", ["pending", "paid", "confirmed"])`

Bu bileşik sorgu için Firestore’da **composite index** tanımlanması gerekebilir. Index yoksa hata mesajında verilen linke tıklayarak Firebase Console’dan index’i oluşturabilirsiniz.

Örnek index:

- **Collection:** `bookings`
- **Fields:** `tourId` (Ascending), `date` (Ascending), `status` (Ascending)

Firebase Console → Firestore → Indexes → Composite bölümünden aynı alanlarla index ekleyebilirsiniz.
