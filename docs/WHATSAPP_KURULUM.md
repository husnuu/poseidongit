# WhatsApp Bildirimleri — Kurulum

Sistem kodda hazır. Bu belge, mesajların gerçekten gitmesi için **bir kez** yapılacak ayarları anlatır.
Anahtarlar girilene kadar site hiçbir WhatsApp mesajı göndermez; rezervasyon ve e-postalar normal çalışır.

## Sistem ne yapıyor?

| Mesaj | Ne zaman | İçerik |
|---|---|---|
| **Rezervasyon onayı** | Ödeme onaylanınca (kapıda ödemelide rezervasyon anında) | Bilet görseli (QR kodlu) + tur, tarih, saat, buluşma noktası, rezervasyon kodu + “Biletimi görüntüle” butonu |
| **24 saat hatırlatma** | Turdan ~24 saat önce | Tarih, kalkış ve biniş saati, buluşma noktası, harita linki |
| **2 saat hatırlatma** | Turdan ~2 saat önce | Kalkış/biniş saati, buluşma noktası, harita linki |
| **Sefer duyurusu** | Admin panelinden elle | Hava nedeniyle iptal / gecikme / özel metin — seferdeki tüm yolculara |

- Müşteri rezervasyonun son adımında “WhatsApp ile bilgilendir” kutusunu kaldırırsa mesaj gönderilmez.
- Aynı mesaj bir yolcuya iki kez gitmez (`whatsapp_messages` tablosu).
- Bilet görseli: `https://cesmetekneturu.net/api/ticket/image?bookingId=…&token=…` (rezervasyonun gizli anahtarıyla korunur).
- Admin paneli: **/admin/whatsapp** — bağlantı durumu, sefer duyurusu, test gönderimi, gönderim geçmişi.

## 1. Supabase tablosu

Supabase → SQL Editor → `docs/supabase-whatsapp.sql` dosyasının içeriğini çalıştırın.

## 2. Meta (WhatsApp Business) hesabı

1. **Meta Business Suite**’te işletme hesabınız olsun (business.facebook.com).
2. **developers.facebook.com** → *Create App* → tür: **Business** → ürün olarak **WhatsApp** ekleyin.
3. WhatsApp → **API Setup**: işletme telefon numaranızı ekleyip doğrulayın.
   - Not: Şu an WhatsApp (Business) **uygulamasında** kullandığınız numarayı API'ye bağlamak, Meta'nın sunduğu seçeneklere göre
     uygulamadan çıkarılmasını gerektirebilir. En sorunsuz yol, bildirimler için ayrı bir numara kullanmaktır; kurulum sırasında Meta'nın gösterdiği seçeneği kontrol edin.
4. Aynı sayfadan **Phone number ID** değerini kopyalayın → `WHATSAPP_PHONE_NUMBER_ID`.
5. **Kalıcı erişim anahtarı:** Business Settings → Users → **System users** → yeni sistem kullanıcısı (Admin) →
   *Add assets* ile uygulamayı ve WhatsApp hesabını verin → *Generate new token* → izinler:
   `whatsapp_business_messaging`, `whatsapp_business_management` → `WHATSAPP_ACCESS_TOKEN`.
   (API Setup sayfasındaki geçici anahtar 24 saatte biter, onu kullanmayın.)
6. İşletme doğrulaması (Business verification) ve ödeme yöntemi: Meta, şablon mesajlarını ücretlendirir; ücret
   kategoriye (bu sistemdekilerin hepsi Utility) ve alıcının ülkesine göre değişir. Güncel fiyatlar için Meta'nın fiyat sayfasına bakın.

## 3. Mesaj şablonları (Meta onayı gerekir)

WhatsApp Manager → **Message templates** → *Create template*. Her şablon için:
**Category: Utility**, ad ve diller aşağıdaki gibi. Gövde metnini **birebir** kopyalayın (değişken sırası önemli).
Önce en az **Türkçe ve İngilizce** oluşturun; Almanca/Rusça da eklerseniz `WHATSAPP_TEMPLATE_LANGUAGES=tr,en,de,ru` yapın.
Onaylanmayan dillerdeki müşterilere İngilizce şablon gider.

Şablon metinleri koddaki `lib/whatsapp/templates.ts` ile aynıdır; birinde değişiklik yaparsanız diğerini de güncelleyin.

### 1) Rezervasyon onayı — bilet görselli

- **Şablon adı:** `poseidon_rezervasyon_onayi`
- **Kategori:** Utility
- **Başlık (Header):** **Media → Image** (örnek olarak bir bilet görseli yükleyin; gönderimde her müşterinin kendi bileti otomatik konur)
- **Altbilgi (Footer):** `Çeşme Poseidon`
- **Buton:** Call to action → **Visit website** → Dynamic → URL: `https://cesmetekneturu.net/{{1}}` · örnek son ek: `bilet/ornek?token=ornek`
- **Değişkenler:** {{1}} Ad · {{2}} Tur · {{3}} Tarih · {{4}} Kalkış saati · {{5}} Buluşma noktası · {{6}} Rezervasyon kodu
- **Örnek değerler (Meta onay formu için):** {{1}} `Ayşe` · {{2}} `Çeşme Adalar & Koylar Turu` · {{3}} `Cumartesi, 18 Ekim` · {{4}} `10:50` · {{5}} `Çeşme Sahil` · {{6}} `A1B2C3D4E5`

<details open><summary><b>Turkish (tr)</b> — buton metni: “Biletimi görüntüle”</summary>

```text
Merhaba {{1}}, rezervasyonunuz onaylandı! 🎉

🛥️ {{2}}
📅 {{3}} · ⏰ Kalkış {{4}}
📍 Buluşma: {{5}}
🎫 Rezervasyon kodu: {{6}}

Lütfen kalkıştan 30 dakika önce iskelede olun. Biniş sırasında biletinizdeki QR kod okutulacaktır.
```

</details>

<details><summary><b>English (en)</b> — buton metni: “View my ticket”</summary>

```text
Hi {{1}}, your booking is confirmed! 🎉

🛥️ {{2}}
📅 {{3}} · ⏰ Departure {{4}}
📍 Meeting point: {{5}}
🎫 Booking code: {{6}}

Please be at the pier 30 minutes before departure. The QR code on your ticket will be scanned at boarding.
```

</details>

<details><summary><b>German (de)</b> — buton metni: “Ticket ansehen”</summary>

```text
Hallo {{1}}, Ihre Buchung ist bestätigt! 🎉

🛥️ {{2}}
📅 {{3}} · ⏰ Abfahrt {{4}}
📍 Treffpunkt: {{5}}
🎫 Buchungscode: {{6}}

Bitte seien Sie 30 Minuten vor Abfahrt am Steg. Der QR-Code auf Ihrem Ticket wird beim Einsteigen gescannt.
```

</details>

<details><summary><b>Russian (ru)</b> — buton metni: “Мой билет”</summary>

```text
Здравствуйте, {{1}}! Ваше бронирование подтверждено 🎉

🛥️ {{2}}
📅 {{3}} · ⏰ Отправление {{4}}
📍 Место встречи: {{5}}
🎫 Код бронирования: {{6}}

Пожалуйста, будьте на причале за 30 минут до отправления. QR-код на билете сканируется при посадке.
```

</details>

### 2) 24 saat kala hatırlatma

- **Şablon adı:** `poseidon_hatirlatma_24s`
- **Kategori:** Utility
- **Başlık (Header):** Yok
- **Altbilgi (Footer):** `Çeşme Poseidon`
- **Buton:** Call to action → **Visit website** → Dynamic → URL: `https://cesmetekneturu.net/{{1}}` · örnek son ek: `bilet/ornek?token=ornek`
- **Değişkenler:** {{1}} Ad · {{2}} Tur · {{3}} Tarih · {{4}} Kalkış saati · {{5}} Biniş saati · {{6}} Buluşma noktası · {{7}} Harita linki
- **Örnek değerler (Meta onay formu için):** {{1}} `Ayşe` · {{2}} `Çeşme Adalar & Koylar Turu` · {{3}} `Cumartesi, 18 Ekim` · {{4}} `10:50` · {{5}} `10:20` · {{6}} `Çeşme Sahil` · {{7}} `https://maps.google.com/?q=Cesme`

<details open><summary><b>Turkish (tr)</b> — buton metni: “Biletimi görüntüle”</summary>

```text
Merhaba {{1}}, yarın denizdeyiz! ⛵

🛥️ {{2}}
📅 {{3}} · ⏰ Kalkış {{4}} (biniş {{5}})
📍 Buluşma: {{6}}
🗺️ Konum: {{7}}

Mayo, havlu ve güneş kremini unutmayın. Görüşmek üzere!
```

</details>

<details><summary><b>English (en)</b> — buton metni: “View my ticket”</summary>

```text
Hi {{1}}, see you on the sea tomorrow! ⛵

🛥️ {{2}}
📅 {{3}} · ⏰ Departure {{4}} (boarding {{5}})
📍 Meeting point: {{6}}
🗺️ Location: {{7}}

Don't forget your swimsuit, towel and sunscreen. See you soon!
```

</details>

<details><summary><b>German (de)</b> — buton metni: “Ticket ansehen”</summary>

```text
Hallo {{1}}, morgen geht es aufs Meer! ⛵

🛥️ {{2}}
📅 {{3}} · ⏰ Abfahrt {{4}} (Einstieg {{5}})
📍 Treffpunkt: {{6}}
🗺️ Standort: {{7}}

Denken Sie an Badesachen, Handtuch und Sonnencreme. Bis bald!
```

</details>

<details><summary><b>Russian (ru)</b> — buton metni: “Мой билет”</summary>

```text
Здравствуйте, {{1}}! Завтра выходим в море ⛵

🛥️ {{2}}
📅 {{3}} · ⏰ Отправление {{4}} (посадка {{5}})
📍 Место встречи: {{6}}
🗺️ Карта: {{7}}

Не забудьте купальник, полотенце и солнцезащитный крем. До встречи!
```

</details>

### 3) 2 saat kala hatırlatma

- **Şablon adı:** `poseidon_hatirlatma_2s`
- **Kategori:** Utility
- **Başlık (Header):** Yok
- **Altbilgi (Footer):** `Çeşme Poseidon`
- **Buton:** Call to action → **Visit website** → Dynamic → URL: `https://cesmetekneturu.net/{{1}}` · örnek son ek: `bilet/ornek?token=ornek`
- **Değişkenler:** {{1}} Ad · {{2}} Tur · {{3}} Kalkış saati · {{4}} Biniş saati · {{5}} Buluşma noktası · {{6}} Harita linki
- **Örnek değerler (Meta onay formu için):** {{1}} `Ayşe` · {{2}} `Çeşme Adalar & Koylar Turu` · {{3}} `10:50` · {{4}} `10:20` · {{5}} `Çeşme Sahil` · {{6}} `https://maps.google.com/?q=Cesme`

<details open><summary><b>Turkish (tr)</b> — buton metni: “Biletimi görüntüle”</summary>

```text
Merhaba {{1}}, turunuza yaklaşık 2 saat kaldı! ⏰

🛥️ {{2}} · Kalkış {{3}}
🚶 Biniş başlıyor: {{4}}
📍 {{5}}
🗺️ {{6}}

Biletinizdeki QR kodu hazır tutun. İyi eğlenceler!
```

</details>

<details><summary><b>English (en)</b> — buton metni: “View my ticket”</summary>

```text
Hi {{1}}, your tour starts in about 2 hours! ⏰

🛥️ {{2}} · Departure {{3}}
🚶 Boarding starts: {{4}}
📍 {{5}}
🗺️ {{6}}

Have the QR code on your ticket ready. Enjoy!
```

</details>

<details><summary><b>German (de)</b> — buton metni: “Ticket ansehen”</summary>

```text
Hallo {{1}}, Ihre Tour beginnt in etwa 2 Stunden! ⏰

🛥️ {{2}} · Abfahrt {{3}}
🚶 Einstieg ab: {{4}}
📍 {{5}}
🗺️ {{6}}

Halten Sie den QR-Code Ihres Tickets bereit. Viel Spaß!
```

</details>

<details><summary><b>Russian (ru)</b> — buton metni: “Мой билет”</summary>

```text
Здравствуйте, {{1}}! До начала тура около 2 часов ⏰

🛥️ {{2}} · Отправление {{3}}
🚶 Посадка с: {{4}}
📍 {{5}}
🗺️ {{6}}

Держите QR-код билета наготове. Приятного отдыха!
```

</details>

### 4) Sefer duyurusu (iptal / gecikme)

- **Şablon adı:** `poseidon_sefer_duyurusu`
- **Kategori:** Utility
- **Başlık (Header):** Yok
- **Altbilgi (Footer):** `Çeşme Poseidon`
- **Buton:** Call to action → **Visit website** → Dynamic → URL: `https://cesmetekneturu.net/{{1}}` · örnek son ek: `rezervasyon/yonet?bookingId=ornek`
- **Değişkenler:** {{1}} Ad · {{2}} Tarih · {{3}} Tur · {{4}} Duyuru metni
- **Örnek değerler (Meta onay formu için):** {{1}} `Ayşe` · {{2}} `Cumartesi, 18 Ekim` · {{3}} `Çeşme Adalar & Koylar Turu` · {{4}} `Hava ve deniz koşulları nedeniyle bu sefer iptal edilmiştir.`

<details open><summary><b>Turkish (tr)</b> — buton metni: “Rezervasyonumu yönet”</summary>

```text
Merhaba {{1}}, {{2}} tarihli {{3}} turunuzla ilgili önemli bir bilgi:

{{4}}

Tarih değiştirmek veya iade talep etmek için aşağıdaki butonu kullanabilir ya da bu mesaja yanıt verebilirsiniz.
```

</details>

<details><summary><b>English (en)</b> — buton metni: “Manage my booking”</summary>

```text
Hi {{1}}, important information about your {{3}} tour on {{2}}:

{{4}}

To change the date or request a refund, use the button below or reply to this message.
```

</details>

<details><summary><b>German (de)</b> — buton metni: “Buchung verwalten”</summary>

```text
Hallo {{1}}, wichtige Information zu Ihrer Tour {{3}} am {{2}}:

{{4}}

Für eine Umbuchung oder Erstattung nutzen Sie den Button unten oder antworten Sie auf diese Nachricht.
```

</details>

<details><summary><b>Russian (ru)</b> — buton metni: “Управление бронированием”</summary>

```text
Здравствуйте, {{1}}! Важная информация о вашем туре «{{3}}» {{2}}:

{{4}}

Чтобы изменить дату или запросить возврат, нажмите кнопку ниже или ответьте на это сообщение.
```

</details>

## 4. Vercel ortam değişkenleri

Vercel → Project → Settings → Environment Variables (Production):

| Değişken | Değer |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Adım 2.5’teki kalıcı anahtar |
| `WHATSAPP_PHONE_NUMBER_ID` | Adım 2.4 |
| `WHATSAPP_TEMPLATE_LANGUAGES` | Onaylanan diller, örn. `tr,en` |
| `CRON_SECRET` | Uzun rastgele metin (hatırlatma görevi için zorunlu) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Kendi belirlediğiniz rastgele metin (isteğe bağlı, adım 6) |
| `WHATSAPP_APP_SECRET` | Meta App → Settings → Basic → App secret (isteğe bağlı, adım 6) |

Şablon adlarını değiştirdiyseniz: `WHATSAPP_TEMPLATE_CONFIRMATION`, `WHATSAPP_TEMPLATE_REMINDER_24H`,
`WHATSAPP_TEMPLATE_REMINDER_2H`, `WHATSAPP_TEMPLATE_DISRUPTION`. Değişkenlerden sonra yeniden deploy edin.

## 5. Hatırlatma görevi (24 saat / 2 saat)

`/api/cron/whatsapp-reminders` adresinin **15 dakikada bir** çağrılması gerekir (saatte bir de doğru çalışır).

- **Vercel Pro planı:** `vercel.json` içindeki `crons` listesine ekleyin:
  `{ "path": "/api/cron/whatsapp-reminders", "schedule": "*/15 * * * *" }`
  (Vercel Hobby planı günde birden sık cron’a izin vermez — eklenirse deploy hata verir.)
- **Hobby plan / harici zamanlayıcı:** cron-job.org gibi bir serviste her 15 dakikada
  `GET https://cesmetekneturu.net/api/cron/whatsapp-reminders` isteği, başlık
  `Authorization: Bearer <CRON_SECRET>` ile.

## 6. Webhook (isteğe bağlı — “iletildi / okundu” durumları için)

Meta App → WhatsApp → **Configuration** → Webhook:
- Callback URL: `https://cesmetekneturu.net/api/whatsapp/webhook`
- Verify token: `WHATSAPP_WEBHOOK_VERIFY_TOKEN` ile aynı
- Webhook fields: **messages** aboneliğini açın.

Bu yapılmazsa mesajlar yine gider; admin panelinde durum “sent” olarak kalır.

## 7. Test

1. **/admin/whatsapp** → durum “Bağlı” görünmeli.
2. *Test gönderimi*: gerçek bir rezervasyon ID’si + kendi numaranız → “Rezervasyon onayı” → gönder.
3. Telefonunuza bilet görselli mesaj gelmeli; “Biletimi görüntüle” butonu bilet sayfasını açmalı.
