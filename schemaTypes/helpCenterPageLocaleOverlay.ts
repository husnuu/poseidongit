import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpCenterPageLocaleOverlay',
  title: 'Yardım merkezi ana sayfa (bu dil)',
  type: 'object',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'seoTitle', title: 'SEO başlık', type: 'string' }),
        defineField({ name: 'seoDescription', title: 'SEO açıklama', type: 'text', rows: 3 }),
      ],
    }),
    defineField({ name: 'heroEyebrow', title: 'Hero üst etiket', type: 'string' }),
    defineField({ name: 'title', title: 'Sayfa başlığı', type: 'string' }),
    defineField({ name: 'shortDescription', title: 'Kısa açıklama', type: 'text', rows: 3 }),
    defineField({ name: 'heroImageAlt', title: 'Hero görseli alt metni', type: 'string' }),
  ],
})
