import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'yachtDepositPage',
  title: 'Yat Kapora Ödeme Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Sayfa yayında',
      type: 'boolean',
      initialValue: true,
      description: 'Kapalıyken sayfa ziyaretçilere gösterilmez.',
    }),
    defineField({
      name: 'depositAmount',
      title: 'Kapora tutarı (TRY)',
      type: 'number',
      description:
        'Müşteriden tahsil edilecek kapora miktarı. Sayfa metinleri (başlık, açıklama, form) kodda hazırdır; yalnızca bu tutarı güncellemeniz yeterlidir.',
      validation: (Rule) => Rule.required().min(1),
    }),
    // İçerik alanları kodda yönetilir; ileride özelleştirmek için gizli tutulur.
    defineField({
      name: 'titleTop',
      title: 'Başlık üst satır',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'titleBottom',
      title: 'Başlık alt satır',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'intro',
      title: 'Giriş metni',
      type: 'text',
      rows: 4,
      hidden: true,
    }),
    defineField({
      name: 'bullets',
      title: 'Bilgi maddeleri',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      hidden: true,
      fields: [
        defineField({ name: 'title', title: 'Meta başlık', type: 'string' }),
        defineField({ name: 'description', title: 'Meta açıklama', type: 'text', rows: 3 }),
      ],
    }),
    defineField({
      name: 'pageTranslations',
      title: 'Çeviriler — English',
      type: 'object',
      hidden: true,
      fields: [
        defineField({
          name: 'en',
          title: 'English',
          type: 'yachtDepositPageLocaleOverlay',
        }),
      ],
    }),
  ],
  preview: {
    select: { amount: 'depositAmount', enabled: 'enabled' },
    prepare({ amount, enabled }) {
      const status = enabled === false ? 'Kapalı' : 'Yayında'
      return {
        title: 'Yat kapora ödeme',
        subtitle: amount ? `${amount.toLocaleString('tr-TR')} ₺ · ${status}` : `Tutar girin · ${status}`,
      }
    },
  },
})
