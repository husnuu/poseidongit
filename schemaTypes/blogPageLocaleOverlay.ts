import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'blogPageLocaleOverlay',
  title: 'Blog listesi sayfası (bu dil)',
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
    defineField({
      name: 'heroTitle',
      title: 'Hero üst satır',
      type: 'string',
    }),
    defineField({
      name: 'heroHighlightTitlePart',
      title: 'Hero vurgulu alt satır',
      type: 'string',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero açıklama',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'heroImageAlt',
      title: 'Hero görseli alt metni',
      type: 'string',
    }),
    defineField({
      name: 'emptyListMessage',
      title: 'Liste boşken mesaj',
      type: 'text',
      rows: 2,
    }),
  ],
})
