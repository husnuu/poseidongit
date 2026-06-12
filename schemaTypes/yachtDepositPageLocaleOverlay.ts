import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'yachtDepositPageLocaleOverlay',
  title: 'Yat kapora sayfası (bu dil)',
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
    defineField({ name: 'titleTop', title: 'Başlık üst satır', type: 'string' }),
    defineField({ name: 'titleBottom', title: 'Başlık alt satır', type: 'string' }),
    defineField({ name: 'intro', title: 'Giriş metni', type: 'text', rows: 4 }),
    defineField({
      name: 'bullets',
      title: 'Madde işaretleri',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'form',
      title: 'Form metinleri',
      type: 'object',
      fields: [
        defineField({ name: 'sectionTitle', title: 'Form başlığı', type: 'string' }),
        defineField({ name: 'depositLabel', title: 'Kapora etiketi', type: 'string' }),
        defineField({ name: 'charterDateLabel', title: 'Tarih etiketi', type: 'string' }),
        defineField({ name: 'yachtNameLabel', title: 'Tekne adı etiketi', type: 'string' }),
        defineField({ name: 'messageLabel', title: 'Not etiketi', type: 'string' }),
        defineField({ name: 'submitLabel', title: 'Ödeme butonu', type: 'string' }),
        defineField({ name: 'secureNote', title: 'Güvenli ödeme notu', type: 'string' }),
        defineField({ name: 'successRedirectNote', title: 'Yönlendirme notu', type: 'string' }),
      ],
    }),
  ],
})
