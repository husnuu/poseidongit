# Instagram akışı kurulumu

Ana sayfadaki "Maceralarımızı takip edin" bölümü, son 12 gönderiyi, profil fotoğrafını ve takipçi sayısını @cesmeposeidon hesabından otomatik çeker. Gönderiler saatte bir yenilenir.

Token girilmeden de bölüm çalışır: Sanity'deki Instagram gönderileri gösterilir. Bu durumda takipçi sayısı, Sanity footer'daki Instagram satırına elle yazılmışsa görünür, boşsa gösterilmez.

## Gerekenler

- **Hesap türü:** @cesmeposeidon bir **İşletme** veya **İçerik üreticisi** hesabı olmalı (Instagram → Ayarlar → Hesap türü ve araçlar).
- **Meta geliştirici uygulaması:** Ücretsizdir.

## Adımlar

1. https://developers.facebook.com/apps adresinde **Uygulama oluştur** deyin. Kullanım durumu olarak "Instagram ile mesajları ve içerikleri yönet"i (Instagram API) seçin.
2. Uygulamada **Instagram → API setup with Instagram login** bölümüne gidin. "Generate access tokens" altında @cesmeposeidon hesabını ekleyip izin verin, ardından **Generate token** deyin.
   - Hesabı eklerken "test kullanıcısı" daveti isterse, Instagram'da Ayarlar → Uygulamalar ve web siteleri altından daveti kabul edin.
3. Üretilen uzun ömürlü token'ı kopyalayın.
4. Supabase SQL Editor'da `docs/supabase-instagram.sql` dosyasını çalıştırın.
5. Vercel → Settings → Environment Variables bölümüne `INSTAGRAM_ACCESS_TOKEN` olarak ekleyip deploy edin.

Token 60 gün geçerlidir. Site, token 7 günden eskiyse onu kendisi yeniler ve Supabase'e kaydeder, siz bir şey yapmazsınız. Supabase tablosu kurulmazsa yenileme kaydedilemez; o zaman 60 günde bir yeni token girmeniz gerekir.

Token geçersiz olursa (şifre değişikliği, izin iptali gibi) bölüm otomatik olarak Sanity gönderilerine döner. Yeni token üretip ortam değişkenini güncellemeniz ve Supabase'deki `integration_tokens` satırını silmeniz yeterli.
