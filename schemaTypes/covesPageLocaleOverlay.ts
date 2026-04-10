import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'covesPageLocaleOverlay',
  title: 'Koylar sayfası (bu dil)',
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
    defineField({ name: 'description', title: 'Hero altı açıklama', type: 'text', rows: 4 }),
    defineField({
      name: 'emptyListMessage',
      title: 'Liste boşken mesaj',
      type: 'text',
      rows: 2,
    }),
  ],
})
