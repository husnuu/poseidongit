import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'helpArticleTranslation',
  title: 'Yardım makalesi çevirisi (tek dil)',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug (bu dilde makale URL’si)',
      type: 'slug',
      options: { maxLength: 96 },
    }),
    defineField({ name: 'shortDescription', title: 'Kısa açıklama', type: 'text', rows: 3 }),
    defineField({
      name: 'body',
      title: 'İçerik',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({ name: 'seoTitle', title: 'SEO başlık', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO açıklama', type: 'text', rows: 3 }),
  ],
})
