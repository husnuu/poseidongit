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
      name: 'yacht',
      title: 'Tekne',
      type: 'reference',
      to: [{ type: 'yachtRental' }],
      description:
        'Kapora alınacak özel tekne. Sayfada tekne adı, görseli ve konumu gösterilir; müşteri hangi tekne için ödeme yaptığını net görür.',
    }),
    defineField({
      name: 'charterDateStart',
      title: 'Kiralama başlangıç tarihi',
      type: 'date',
      description: 'Kiralama döneminin ilk günü (giriş veya tek günlük kiralama tarihi).',
    }),
    defineField({
      name: 'charterDateEnd',
      title: 'Kiralama bitiş tarihi',
      type: 'date',
      description:
        'Konaklamalı kiralama için çıkış günü. Günlük kiralama için boş bırakın — yalnızca başlangıç tarihi gösterilir.',
      validation: (Rule) =>
        Rule.custom((end, context) => {
          const start = (context.parent as { charterDateStart?: string })?.charterDateStart
          if (!end || !start) return true
          if (end <= start) return 'Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.'
          return true
        }),
    }),
    defineField({
      name: 'depositAmount',
      title: 'Kapora tutarı (TRY)',
      type: 'number',
      description: 'Müşteriden tahsil edilecek kapora miktarı.',
      validation: (Rule) => Rule.required().min(1),
    }),
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
    select: {
      amount: 'depositAmount',
      enabled: 'enabled',
      yachtName: 'yacht.name',
      start: 'charterDateStart',
      end: 'charterDateEnd',
    },
    prepare({ amount, enabled, yachtName, start, end }) {
      const status = enabled === false ? 'Kapalı' : 'Yayında'
      const datePart =
        start && end ? `${start} → ${end}` : start ? start : 'Tarih yok'
      const yachtPart = yachtName?.trim() || 'Tekne seçilmedi'
      return {
        title: yachtPart,
        subtitle: `${amount ? `${amount.toLocaleString('tr-TR')} ₺` : 'Tutar girin'} · ${datePart} · ${status}`,
      }
    },
  },
})
