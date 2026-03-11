# Firestore "Error loading documents" – Kontrol listesi

## 1. Kurallar (Rules)

Az önce **tüm erişimi kapatan** kurallar ekledik (`allow read, write: if false`). Firebase Console normalde bu kuralları bypass eder; bazı projelerde ise Data sekmesi yine de "Error loading documents" gösterebilir.

**Yapılacaklar:**
- Firestore → **Rules** sekmesine gidin. Kural sözdizimi hatası var mı kontrol edin (kırmızı uyarı olmamalı).
- Eğer bu hata, kuralları yayınladıktan **sonra** başladıysa: Geçici olarak kuralları gevşetip test edin. Aşağıdaki **Geçici kural** bölümündeki gibi `allow read: if true` yapıp kaydedin; Console’da dokümanlar yükleniyor mu bakın. Yükleniyorsa sorun kurallardandır. Testten sonra tekrar `if false` yapın.

**Geçici kural (sadece test için, sonra geri alın):**
```
allow read: if true;
allow write: if false;
```
Bu sırada proje ID’sini bilen biri teorik olarak okuyabilir; sadece birkaç dakika açık bırakıp test edin.

## 2. İndeks (Indexes)

Bazen koleksiyon açılırken Firestore bir sorgu çalıştırır ve **composite index** ister.
- **Indexes** sekmesine gidin.
- "Build" veya "Create index" gerektiğine dair bir uyarı / link var mı bakın. Varsa o indeksi oluşturun.

## 3. Tarayıcı / Ağ

- Sayfayı **sert yenileyin** (Ctrl+F5 / Cmd+Shift+R).
- Farklı tarayıcı veya **gizli pencere** deneyin.
- VPN veya kurumsal ağ kullanıyorsanız kapatıp tekrar deneyin.

## 4. Veri gerçekten var mı?

- Rezervasyon oluşturmayı siteden bir kez deneyin; sonra Console’da **bookings** koleksiyonunu tekrar açın.
- Bazen ilk kez boş koleksiyon açılırken de hata çıkabiliyor; bir doküman ekleyince düzelir.

## 5. Kuralları sadece yazmayı kapatacak şekilde bırakmak

Console’da veriyi görebilmek için okumaya izin vermek isterseniz (yazma yine kapalı kalır):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document} {
      allow read: if true;   // Console ve sizin okumanız için
      allow write: if false; // Kimse yazamaz (sadece sunucu admin ile)
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Not:** `allow read: if true` demek, proje ID’sini bilen herkesin client ile okuma yapabilmesi demek. Proje ID’niz şu an istemcide yok; yine de riski bilerek kullanın. En güvenli seçenek `read, write: if false` ve veriyi CLI / Admin API ile kontrol etmektir.
