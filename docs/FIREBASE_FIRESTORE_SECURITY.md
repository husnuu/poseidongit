# Firestore güvenlik kuralları

Bu projede Firestore’a **sadece sunucu** (Next.js API + `firebase-admin`) erişiyor. Tarayıcıda Firebase Client SDK kullanılmıyor.

## Neden kurallar önemli?

Firebase Console’da varsayılan/test kuralları bazen **herkese okuma-yazma** izni verir. O zaman proje ID’sini bilen biri Web SDK ile doğrudan Firestore’a bağlanıp verileri okuyabilir/yazabilir. Proje ID’niz `.env`’de (NEXT_PUBLIC değil), yani tarayıcıda yok; yine de kuralları sıkı tutmak güvenlik için şart.

## Ne yapmalı?

Kök dizindeki **`firestore.rules`** dosyası tüm **istemci** erişimini kapatıyor (`allow read, write: if false`). **Admin SDK (firebase-admin) kuralları bypass ettiği için** sunucu tarafındaki API’ler (rezervasyon oluşturma, voucher, admin listesi vb.) aynen çalışmaya devam eder.

### Seçenek 1: Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → projenizi seçin  
2. **Firestore Database** → **Kurallar (Rules)** sekmesi  
3. `firestore.rules` içeriğini kopyalayıp yapıştırın  
4. **Yayınla** deyin  

### Seçenek 2: Firebase CLI

Projede `firebase.json` tanımlayıp `firebase deploy --only firestore:rules` ile de dağıtabilirsiniz.

## Özet

- **Sunucu (firebase-admin):** Kurallardan etkilenmez, tüm erişim çalışır.  
- **İstemci (Web/Mobil SDK):** Tüm okuma/yazma reddedilir; verileriniz sadece sizin API’leriniz üzerinden erişilebilir.
