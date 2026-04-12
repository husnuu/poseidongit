import { defineField, defineType } from 'sanity'

/**
 * İletişim sayfası EN/DE metinleri. Boş bırakılan alanlar uygulamadaki varsayılan çeviriyle dolar.
 */
export default defineType({
  name: 'contactPageLocaleOverlay',
  title: 'İletişim sayfası (bu dil)',
  type: 'object',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta başlık', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta açıklama', type: 'text', rows: 3 }),
      ],
    }),
    defineField({ name: 'title', title: 'Sayfa başlığı (H1)', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Giriş metni',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'form',
      title: 'Form',
      type: 'object',
      fields: [
        defineField({ name: 'submitLabel', title: 'Gönder butonu', type: 'string' }),
        defineField({ name: 'successMessage', title: 'Başarı mesajı', type: 'string' }),
      ],
    }),
    defineField({
      name: 'contactCards',
      title: 'İletişim kartları (sıra ile; Türkçe kartlarla eşleşir)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Etiket', type: 'string' }),
            defineField({ name: 'value', title: 'Değer (isteğe bağlı)', type: 'string' }),
          ],
          preview: {
            select: { label: 'label' },
            prepare({ label }) {
              return { title: label || 'Kart' }
            },
          },
        },
      ],
    }),
    defineField({ name: 'locationTitle', title: 'Harita bölümü başlığı', type: 'string' }),
    defineField({ name: 'popularToursTitle', title: 'Popüler turlar başlığı', type: 'string' }),
    defineField({
      name: 'ui',
      title: 'Arayüz metinleri (form, sidebar, harita — isteğe bağlı)',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'formSectionAria', title: 'Form bölümü (sr-only)', type: 'string' }),
        defineField({ name: 'labelFullName', title: 'Ad soyad etiketi', type: 'string' }),
        defineField({ name: 'labelGroupSize', title: 'Grup büyüklüğü', type: 'string' }),
        defineField({ name: 'labelEmail', title: 'E-posta', type: 'string' }),
        defineField({ name: 'labelPhone', title: 'Telefon', type: 'string' }),
        defineField({ name: 'labelMessage', title: 'Mesaj', type: 'string' }),
        defineField({ name: 'sending', title: 'Gönderiliyor…', type: 'string' }),
        defineField({ name: 'turnstileError', title: 'Doğrulama uyarısı', type: 'string' }),
        defineField({ name: 'submitErrorGeneric', title: 'Gönderim hatası', type: 'string' }),
        defineField({ name: 'submitErrorNetwork', title: 'Bağlantı hatası', type: 'string' }),
        defineField({ name: 'valNameMin', title: 'Validasyon: ad min', type: 'string' }),
        defineField({ name: 'valGroupMin', title: 'Validasyon: grup min', type: 'string' }),
        defineField({ name: 'valEmail', title: 'Validasyon: e-posta', type: 'string' }),
        defineField({ name: 'valMessageMin', title: 'Validasyon: mesaj min', type: 'string' }),
        defineField({ name: 'sidebarAria', title: 'Sidebar aria-label', type: 'string' }),
        defineField({ name: 'rowEmail', title: 'Sidebar: e-posta satır başlığı', type: 'string' }),
        defineField({ name: 'rowHours', title: 'Sidebar: çalışma saatleri', type: 'string' }),
        defineField({ name: 'rowAddress', title: 'Sidebar: adres', type: 'string' }),
        defineField({ name: 'rowPhone', title: 'Sidebar: telefon', type: 'string' }),
        defineField({ name: 'rowFriends', title: 'Sidebar: sosyal (YouTube)', type: 'string' }),
        defineField({ name: 'rowInspired', title: 'Sidebar: Instagram', type: 'string' }),
        defineField({ name: 'ariaEmailSend', title: 'Aria: e-posta gönder', type: 'string' }),
        defineField({ name: 'ariaOpenMaps', title: 'Aria: haritada aç', type: 'string' }),
        defineField({ name: 'ariaCall', title: 'Aria: ara', type: 'string' }),
        defineField({ name: 'ariaYoutube', title: 'Aria: YouTube', type: 'string' }),
        defineField({ name: 'ariaInstagram', title: 'Aria: Instagram', type: 'string' }),
        defineField({ name: 'mapIframeTitle', title: 'iframe title (harita)', type: 'string' }),
      ],
    }),
  ],
})
