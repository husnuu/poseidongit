import type { WhatsAppTemplateKind } from './config'

/**
 * Meta Business Manager'da oluşturulacak şablonların metinleri — TEK KAYNAK.
 * docs/WHATSAPP_KURULUM.md bu metinleri birebir kullanır; admin panelindeki
 * önizleme de buradan üretilir. Bir metni değiştirirseniz Meta'daki şablonu
 * da güncelleyip yeniden onaya göndermeniz gerekir (değişken sırası aynı kalmalı).
 *
 * Kategori: UTILITY (işlemsel). Değişkenler {{1}}, {{2}}… sırasıyla
 * `paramNames` listesindeki alanlardır.
 */

export type TemplateLang = 'tr' | 'en' | 'de' | 'ru'

export type TemplateDef = {
  /** Şablon başlığı: bilet görseli (yalnızca onay mesajında). */
  headerImage: boolean
  paramNames: string[]
  body: Record<TemplateLang, string>
  /** Tek URL butonu: metin + sabit taban + {{1}} dinamik son ek. */
  button: { text: Record<TemplateLang, string>; target: 'ticket' | 'manage' }
  footer: Record<TemplateLang, string>
}

const FOOTER: Record<TemplateLang, string> = {
  tr: 'Çeşme Poseidon',
  en: 'Çeşme Poseidon',
  de: 'Çeşme Poseidon',
  ru: 'Çeşme Poseidon',
}

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateKind, TemplateDef> = {
  confirmation: {
    headerImage: true,
    paramNames: ['Ad', 'Tur', 'Tarih', 'Kalkış saati', 'Buluşma noktası', 'Rezervasyon kodu'],
    body: {
      tr:
        'Merhaba {{1}}, rezervasyonunuz onaylandı! 🎉\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Kalkış {{4}}\n📍 Buluşma: {{5}}\n🎫 Rezervasyon kodu: {{6}}\n\n' +
        'Lütfen kalkıştan 30 dakika önce iskelede olun. Biniş sırasında biletinizdeki QR kod okutulacaktır.',
      en:
        'Hi {{1}}, your booking is confirmed! 🎉\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Departure {{4}}\n📍 Meeting point: {{5}}\n🎫 Booking code: {{6}}\n\n' +
        'Please be at the pier 30 minutes before departure. The QR code on your ticket will be scanned at boarding.',
      de:
        'Hallo {{1}}, Ihre Buchung ist bestätigt! 🎉\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Abfahrt {{4}}\n📍 Treffpunkt: {{5}}\n🎫 Buchungscode: {{6}}\n\n' +
        'Bitte seien Sie 30 Minuten vor Abfahrt am Steg. Der QR-Code auf Ihrem Ticket wird beim Einsteigen gescannt.',
      ru:
        'Здравствуйте, {{1}}! Ваше бронирование подтверждено 🎉\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Отправление {{4}}\n📍 Место встречи: {{5}}\n🎫 Код бронирования: {{6}}\n\n' +
        'Пожалуйста, будьте на причале за 30 минут до отправления. QR-код на билете сканируется при посадке.',
    },
    button: {
      text: { tr: 'Biletimi görüntüle', en: 'View my ticket', de: 'Ticket ansehen', ru: 'Мой билет' },
      target: 'ticket',
    },
    footer: FOOTER,
  },
  reminder_24h: {
    headerImage: false,
    paramNames: ['Ad', 'Tur', 'Tarih', 'Kalkış saati', 'Biniş saati', 'Buluşma noktası', 'Harita linki'],
    body: {
      tr:
        'Merhaba {{1}}, yarın denizdeyiz! ⛵\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Kalkış {{4}} (biniş {{5}})\n📍 Buluşma: {{6}}\n🗺️ Konum: {{7}}\n\n' +
        'Mayo, havlu ve güneş kremini unutmayın. Görüşmek üzere!',
      en:
        'Hi {{1}}, see you on the sea tomorrow! ⛵\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Departure {{4}} (boarding {{5}})\n📍 Meeting point: {{6}}\n🗺️ Location: {{7}}\n\n' +
        "Don't forget your swimsuit, towel and sunscreen. See you soon!",
      de:
        'Hallo {{1}}, morgen geht es aufs Meer! ⛵\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Abfahrt {{4}} (Einstieg {{5}})\n📍 Treffpunkt: {{6}}\n🗺️ Standort: {{7}}\n\n' +
        'Denken Sie an Badesachen, Handtuch und Sonnencreme. Bis bald!',
      ru:
        'Здравствуйте, {{1}}! Завтра выходим в море ⛵\n\n' +
        '🛥️ {{2}}\n📅 {{3}} · ⏰ Отправление {{4}} (посадка {{5}})\n📍 Место встречи: {{6}}\n🗺️ Карта: {{7}}\n\n' +
        'Не забудьте купальник, полотенце и солнцезащитный крем. До встречи!',
    },
    button: {
      text: { tr: 'Biletimi görüntüle', en: 'View my ticket', de: 'Ticket ansehen', ru: 'Мой билет' },
      target: 'ticket',
    },
    footer: FOOTER,
  },
  reminder_2h: {
    headerImage: false,
    paramNames: ['Ad', 'Tur', 'Kalkış saati', 'Biniş saati', 'Buluşma noktası', 'Harita linki'],
    body: {
      tr:
        'Merhaba {{1}}, turunuza yaklaşık 2 saat kaldı! ⏰\n\n' +
        '🛥️ {{2}} · Kalkış {{3}}\n🚶 Biniş başlıyor: {{4}}\n📍 {{5}}\n🗺️ {{6}}\n\n' +
        'Biletinizdeki QR kodu hazır tutun. İyi eğlenceler!',
      en:
        'Hi {{1}}, your tour starts in about 2 hours! ⏰\n\n' +
        '🛥️ {{2}} · Departure {{3}}\n🚶 Boarding starts: {{4}}\n📍 {{5}}\n🗺️ {{6}}\n\n' +
        'Have the QR code on your ticket ready. Enjoy!',
      de:
        'Hallo {{1}}, Ihre Tour beginnt in etwa 2 Stunden! ⏰\n\n' +
        '🛥️ {{2}} · Abfahrt {{3}}\n🚶 Einstieg ab: {{4}}\n📍 {{5}}\n🗺️ {{6}}\n\n' +
        'Halten Sie den QR-Code Ihres Tickets bereit. Viel Spaß!',
      ru:
        'Здравствуйте, {{1}}! До начала тура около 2 часов ⏰\n\n' +
        '🛥️ {{2}} · Отправление {{3}}\n🚶 Посадка с: {{4}}\n📍 {{5}}\n🗺️ {{6}}\n\n' +
        'Держите QR-код билета наготове. Приятного отдыха!',
    },
    button: {
      text: { tr: 'Biletimi görüntüle', en: 'View my ticket', de: 'Ticket ansehen', ru: 'Мой билет' },
      target: 'ticket',
    },
    footer: FOOTER,
  },
  disruption: {
    headerImage: false,
    paramNames: ['Ad', 'Tarih', 'Tur', 'Duyuru metni'],
    body: {
      tr:
        'Merhaba {{1}}, {{2}} tarihli {{3}} turunuzla ilgili önemli bir bilgi:\n\n' +
        '{{4}}\n\n' +
        'Tarih değiştirmek veya iade talep etmek için aşağıdaki butonu kullanabilir ya da bu mesaja yanıt verebilirsiniz.',
      en:
        'Hi {{1}}, important information about your {{3}} tour on {{2}}:\n\n' +
        '{{4}}\n\n' +
        'To change the date or request a refund, use the button below or reply to this message.',
      de:
        'Hallo {{1}}, wichtige Information zu Ihrer Tour {{3}} am {{2}}:\n\n' +
        '{{4}}\n\n' +
        'Für eine Umbuchung oder Erstattung nutzen Sie den Button unten oder antworten Sie auf diese Nachricht.',
      ru:
        'Здравствуйте, {{1}}! Важная информация о вашем туре «{{3}}» {{2}}:\n\n' +
        '{{4}}\n\n' +
        'Чтобы изменить дату или запросить возврат, нажмите кнопку ниже или ответьте на это сообщение.',
    },
    button: {
      text: {
        tr: 'Rezervasyonumu yönet',
        en: 'Manage my booking',
        de: 'Buchung verwalten',
        ru: 'Управление бронированием',
      },
      target: 'manage',
    },
    footer: FOOTER,
  },
}

/** Hazır duyuru metinleri (admin panelinde seçilir, düzenlenebilir). */
export const DISRUPTION_PRESETS: Record<'weather_cancel' | 'delay', Record<TemplateLang, (extra: string) => string>> = {
  weather_cancel: {
    tr: () => 'Hava ve deniz koşulları nedeniyle bu sefer güvenliğiniz için iptal edilmiştir. Ücretiniz tam olarak iade edilir ya da dilediğiniz başka bir tarihe ücretsiz taşınır.',
    en: () => 'Due to weather and sea conditions, this trip has been cancelled for your safety. You will receive a full refund or a free move to another date of your choice.',
    de: () => 'Aufgrund der Wetter- und Seebedingungen wurde diese Fahrt zu Ihrer Sicherheit abgesagt. Sie erhalten eine volle Erstattung oder eine kostenlose Umbuchung auf ein Datum Ihrer Wahl.',
    ru: () => 'Из-за погодных условий и состояния моря этот рейс отменён ради вашей безопасности. Вы получите полный возврат или бесплатный перенос на другую дату.',
  },
  delay: {
    tr: (t) => `Kalkış saatimiz ${t || 'yeni bir saate'} ertelenmiştir. Lütfen iskelede yeni saatten 30 dakika önce olun. Anlayışınız için teşekkür ederiz.`,
    en: (t) => `Our departure has been moved to ${t || 'a new time'}. Please be at the pier 30 minutes before the new time. Thank you for your understanding.`,
    de: (t) => `Unsere Abfahrt wurde auf ${t || 'eine neue Uhrzeit'} verschoben. Bitte seien Sie 30 Minuten vorher am Steg. Vielen Dank für Ihr Verständnis.`,
    ru: (t) => `Время отправления перенесено на ${t || 'другое время'}. Пожалуйста, будьте на причале за 30 минут до нового времени. Спасибо за понимание.`,
  },
}

export function asTemplateLang(code: string | null | undefined): TemplateLang {
  const k = (code ?? 'tr').toLowerCase().slice(0, 2)
  return k === 'en' || k === 'de' || k === 'ru' ? k : 'tr'
}

/** Önizleme: şablon gövdesindeki {{n}} değişkenlerini değerlerle doldurur. */
export function renderTemplateBody(kind: WhatsAppTemplateKind, lang: TemplateLang, values: string[]): string {
  return WHATSAPP_TEMPLATES[kind].body[lang].replace(/\{\{(\d+)\}\}/g, (_, n: string) => values[Number(n) - 1] ?? `{{${n}}}`)
}
