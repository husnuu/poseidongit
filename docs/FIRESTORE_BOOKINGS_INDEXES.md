# Firestore `bookings` bileşik indeksleri

Hata: **`FAILED_PRECONDITION: The query requires an index`** — Firestore, aşağıdaki sorgular için **önceden tanımlı bileşik indeks** ister (tek alan indeksi yetmez).

## Hatanızda istenen indeks

Mesajdaki link genelde şunu ister:

| Koleksiyon | Alan 1        | Alan 2   | (Alan 3) |
|------------|---------------|----------|----------|
| `bookings` | `classId` ↑   | `date` ↑ | `__name__` (otomatik) |

Bu, özellikle **admin doluluk** (`/api/admin/occupancy`) içindeki sorguya uygun:

- `classId == "first"`
- `date >= ayın başı` ve `date <= ayın sonu`

## Projede kullanılan diğer sorgular

Kodda ayrıca şunlar var:

1. **`tourId` + `date` + `status` `in (...)`** — günlük müsaitlik (`/api/availability`), tur bazlı rezervasyon sayımı.
2. **`date` + `classId` + `status` `in (...)`** — aynı gün tüm turlar için First Class loca çakışması (`/api/availability`, `POST /api/bookings`).

Bu yüzden `firestore.indexes.json` içinde birden fazla bileşik indeks tanımlıdır.

## Ne yapmalısınız?

### Seçenek A — Hatadaki linke tıklayın (en hızlı)

Firebase Console açılır; **“Create index”** ile indeks oluşturulur. Birkaç dakika sonra sorgu çalışır.

### Seçenek B — Firebase CLI

Projede `firestore.indexes.json` güncellendi. Firebase’e bağlı bir klasörde:

```bash
firebase deploy --only firestore:indexes
```

(`firebase.json` içinde `firestore` → `indexes` bu dosyayı göstermeli.)

## Not

- İndeks oluşana kadar (genelde **birkaç dakika**) aynı hata devam edebilir.
- “Turun Sanity’de kapasite tanımlı…” uyarısı ayrı bir konu; Firestore indeksi eksikse API önce **500** ile düşer.
